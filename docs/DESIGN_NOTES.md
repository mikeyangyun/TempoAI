# Tempo AI — Design Notes

> Implementation reasoning, key trade-offs, completion status, and prioritized extension roadmap.

---

## 1. Implementation Approach & Key Trade-offs

### Core Insight

The central innovation is treating code generation not as a single LLM call, but as a **multi-agent agile sprint**. This brings three advantages over single-agent approaches:

1. **Separation of concerns** — each agent receives a focused prompt, producing higher-quality output than one model trying to do everything at once
2. **Structured quality gates** — QA validates against specific acceptance criteria, not just "does it look right"
3. **Transparent process** — users see each role's thinking, building trust and enabling intervention (e.g., answering BA's questions)

### Architecture Decisions

| Decision | What We Chose | Trade-off | Reasoning |
|----------|---------------|-----------|-----------|
| **Multi-agent sprint pipeline** | 5 sequential agents (BA → TL → UI/UX → Dev → QA) with phase markers | 5x more LLM calls per generation; higher latency | Quality improvement is significant. Each agent receives only the context it needs. The QA feedback loop catches issues that a single-pass model misses. |
| **Async generator streaming** | Each agent `yield*`s chunks through the orchestrator to SSE | More complex control flow than request-response | Enables true token-level streaming for all 5 agents in sequence. Users see thinking in real time. Phase markers are injected between chunks for UI updates. |
| **BA intelligence gating** | BA classifies requests as Clear / Vague / Too Vague before proceeding | Adds a decision point that could incorrectly block valid requests | Prevents the team from wasting 4 downstream LLM calls on requests like "hello" or "做个东西". The iteration-mode override ensures short requests during refinement still pass. |
| **Two-phase QA-Dev loop + TL escalation** | Phase 1: QA validates, Dev fixes (up to 3 rounds). If still failing, TL reviews root cause. Phase 2: Dev rebuilds with TL guidance, then up to 3 more QA-Dev rounds. If all fail, user notified with QA's detailed conclusion. | Up to 6x QA + 5x Dev + 1 TL escalation calls in worst case | Dramatically improves output quality. The two-phase approach distinguishes "simple bugs" (Phase 1) from "systemic issues" (Phase 2 after TL). TL escalation catches architectural problems that iterative fixes miss. Honest final reporting builds user trust. |
| **Multi-file output** | Dev produces `index.html` + `style.css` + `script.js` via markdown fences | More complex parsing than single-file; must merge for iframe preview | Closer to real project structure. The file tree in the preview panel gives users a realistic view. `mergeFilesToHtml()` handles reassembly transparently. |
| **Plan mode with selectable items** | PlannerAgent outputs structured sections; frontend parses into checkboxes | Requires consistent LLM output format to parse correctly | Users can selectively build parts of the plan instead of all-or-nothing. Default "select all" behavior if no explicit choices. |
| **Progressive Clerk authentication** | Full UI visible without login; `openSignIn()` modal on action | Slightly more complex auth flow than page-level redirect | V0.dev-style experience: users can explore, type prompts, and feel the product before committing to sign up. Pending prompts survive login via `sessionStorage`. |
| **iframe srcDoc preview** | Generated HTML injected as `srcDoc` with `sandbox` attributes | Not production-grade isolation (same origin) | Zero infrastructure cost; instant rendering; works offline. The `PreviewEngine` interface abstracts this — WebContainers or Docker sandbox can be swapped in. |
| **Client-side persistence** | localStorage for metadata; IndexedDB for large HTML payloads | No cloud sync; browser-only | Zero external dependencies; instant setup; sufficient for prototype. `StorageAdapter` interface allows upgrading to PostgreSQL/Supabase. |
| **LLM provider auto-selection** | Factory checks env vars: DeepSeek → Anthropic → OpenRouter | Tightly coupled to env var naming | Simple to configure; supports Chinese users (DeepSeek), global users (Anthropic), and a universal fallback (OpenRouter). All share `LLMProvider` interface. |

### What We Deliberately Did NOT Build

| Feature | Reason |
|---------|--------|
| WebContainers / Sandpack runtime | Adds significant bundle size and complexity; iframe srcDoc is sufficient for the self-contained HTML+CSS+JS apps we generate |
| Docker/Firecracker sandboxing | Requires server infrastructure that cannot be demoed in a portable `pnpm dev` scenario |
| Monaco editor | +2MB bundle size; plain code view with syntax highlighting is sufficient for preview; the `PreviewEngine` interface allows drop-in upgrade |
| Real-time multi-user collaboration | WebSocket infrastructure + CRDT conflict resolution is significant scope; single-user prototype is the correct scoping |
| Full CI/CD pipeline | Prototype-grade; manual verification per phase with `pnpm build` type checking |
| Backend code generation | Generating API routes and database schemas requires a fundamentally different execution sandbox; out of scope |

---

## 2. Current Completion Status

### What Works (Complete Feature List)

**Multi-Agent Sprint System**
- BA assesses request clarity with 3-tier classification (clear / vague / reject)
- BA asks clarifying questions for vague requests; user answers via interactive QuestionCard
- BA rejects nonsensical requests with helpful suggestions via RejectionCard
- TL, UI/UX, Dev execute sequentially with context from upstream agents
- Dev handles first-build and iteration (preserves existing features)
- QA validates against BA criteria + UI/UX specs with structured functional verification checklist
- Two-phase QA-Dev retry: Phase 1 up to 3 rounds, Phase 2 (post-TL) up to 3 more rounds
- TL escalation after Phase 1 exhaustion: TL analyzes root cause, provides revised technical approach
- Dev rebuilds with TL guidance, then QA-Dev loop continues with up to 2 more fix attempts
- Honest failure reporting: if QA still fails after all attempts, QA's detailed conclusion shown to user
- Temperature tuning: Dev and QA use 0.3 (deterministic); BA/TL/UI/UX use 0.7 (creative)
- Dev prompt includes CODE CORRECTNESS rules and SELF-CHECK to prevent common JS bugs
- QA prompt includes FUNCTIONAL VERIFICATION: traces element→handler mappings, ID consistency, init state
- Iteration context: existing code passed to Dev and QA for preservation and regression testing
- Dev fix() receives full TL architecture context to prevent architectural drift during repair

**Plan Mode**
- PlannerAgent generates structured plans (Overview, Architecture, Features, Steps, Design, Complexity)
- Plan items rendered as selectable checkboxes in the UI
- Select-all / deselect-all toggle
- "Build N selected" button that passes filtered plan to Sprint Orchestrator
- Button disables after click and during any active generation

**User Experience**
- V0-style landing page with prompt suggestions and AI introduction
- Progressive authentication: full UI explorable; Clerk modal on action
- Pending prompt preserved through login via sessionStorage
- Collapsible role cards showing each agent's thinking process
- Professional sprint summary as a work report
- Branded generation splash screen (animated rings, progress bar, status messages)
- SprintIncompleteCard: amber warning card shown when QA exhausts all retries (both phases), includes QA's final conclusion and guides user to continue conversation
- Previous preview retained during iterative builds
- Intelligent auto-scroll: follows output unless user scrolls up
- Chat input with embedded Plan/Build mode toggle and send button
- Dark/light theme with system detection

**Infrastructure**
- Multi-file code generation (HTML + CSS + JS) with file tree browser
- Multi-file parser and HTML merger for iframe preview
- Version history with snapshot restore
- Project persistence (localStorage + IndexedDB)
- Responsive layout: desktop split-pane, mobile tabs
- Keyboard shortcuts (⌘K, Esc, /)
- Three LLM providers with auto-selection
- Vercel deployment ready

### What Is NOT Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| WebContainers runtime | Not started | Would enable npm packages and framework-based apps |
| Monaco code editor | Not started | Would allow manual code editing + re-inject |
| One-click deployment | Not started | Vercel/Cloudflare API integration for generated apps |
| Multi-user / cloud sync | Not started | Would require PostgreSQL + auth-scoped storage |
| Template marketplace | Not started | Pre-built starters; community submissions |
| Component-level editing | Not started | Click element in preview → edit in code |
| Backend generation | Not started | API routes, database schemas, server logic |

---

## 3. Future Extension Roadmap

Ordered by **impact/effort ratio** — highest value first.

### Tier 1: High Impact, Moderate Effort (1-2 weeks)

| Extension | Description | Architectural Hook |
|-----------|-------------|-------------------|
| **WebContainers integration** | Replace iframe with browser-based Node.js runtime; enable npm packages and React/Vue generation | `PreviewEngine` interface — implement `WebContainerEngine` |
| **Editable code + re-inject** | Monaco editor; user edits become the new `currentHtml` baseline for next iteration | `PreviewEngine.inject()` + version snapshot on edit |
| **Server-side persistence** | Supabase/PostgreSQL; cross-device sync; project URLs | `StorageAdapter` interface — implement `SupabaseAdapter` |
| **Smarter context window** | Summarize long sprint histories to stay within token limits; sliding window over recent sprints | Sprint context compression in `useChat.ts` |

### Tier 2: Medium Impact, Medium Effort (2-4 weeks)

| Extension | Description | Architectural Hook |
|-----------|-------------|-------------------|
| **One-click deployment** | Publish generated app to Vercel/Cloudflare via API | New `DeployAgent` in orchestration layer |
| **Template marketplace** | Pre-built starters (dashboard, landing, form); kickstart instead of blank canvas | `lib/templates/` registry + UI template picker |
| **Model comparison** | Same prompt → 2 models side-by-side → user picks preferred output | `Orchestrator.parallelGenerate()` + split preview |
| **Component-level editing** | Click element in preview → highlight in code → modify only that section | DOM-to-source mapping; complex but high UX value |
| **Agent memory** | Agents learn user preferences across projects (preferred colors, frameworks, patterns) | User preference store + prompt injection |

### Tier 3: Long-term Vision (1-3 months)

| Extension | Description |
|-----------|-------------|
| **Full-stack generation** | Generate backend (API routes, database schema) alongside frontend |
| **Git-native versioning** | Replace snapshots with actual git commits; branching, merging, diffs |
| **Plugin system** | Third-party agents/tools register via plugin API |
| **Usage metering & billing** | Credit system, subscription tiers, rate limiting |
| **Security hardening** | Separate-origin preview iframe, CSP, container isolation, abuse detection |
| **Multi-language generation** | React Native, Flutter, SwiftUI — beyond web |
| **Real-time collaboration** | WebSocket + CRDT for multi-cursor shared editing |

### Priority Judgment Framework

```
Is the user's core loop (describe → generate → preview → iterate)
  MORE RELIABLE or MORE DELIGHTFUL?
    → Yes: Build it now.
    → No: Does it demonstrate architectural depth?
      → Yes, low risk: Build in buffer time.
      → Yes, high risk: Document as future work.
      → No: Skip.
```

---

## 4. Extensibility Architecture

The codebase is structured around **interface boundaries** so each layer can be upgraded independently:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Extensibility Seams                         │
│                                                                  │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────┐ │
│  │  LLM Layer   │  │  Agent Layer   │  │   Preview Engine     │ │
│  │              │  │                │  │                      │ │
│  │  Interface:  │  │  Interface:    │  │  Interface:          │ │
│  │  LLMProvider │  │  BaseAgent     │  │  PreviewEngine       │ │
│  │              │  │                │  │                      │ │
│  │  Current:    │  │  Current:      │  │  Current:            │ │
│  │  • DeepSeek  │  │  • Planner     │  │  • iframe srcDoc     │ │
│  │  • Anthropic │  │  • Sprint Team │  │                      │ │
│  │  • OpenRouter│  │    (5 agents)  │  │  Future:             │ │
│  │              │  │  • CodeGen     │  │  • WebContainers     │ │
│  │  Future:     │  │  • CodeMod     │  │  • Sandpack          │ │
│  │  • GPT-4o    │  │  • Validator   │  │  • Docker (SSR)      │ │
│  │  • Local LLM │  │                │  │                      │ │
│  └──────────────┘  └────────────────┘  └──────────────────────┘ │
│                                                                  │
│  ┌───────────────────┐  ┌────────────────────────────────────┐  │
│  │  Storage Layer    │  │         Auth Layer                 │  │
│  │                   │  │                                    │  │
│  │  Interface:       │  │  Current:                          │  │
│  │  StorageAdapter   │  │  Clerk (modal-based, progressive)  │  │
│  │                   │  │                                    │  │
│  │  Current:         │  │  Middleware:                        │  │
│  │  • localStorage   │  │  API routes gated, UI public       │  │
│  │  • IndexedDB      │  │                                    │  │
│  │                   │  │  Future:                            │  │
│  │  Future:          │  │  Multi-tenancy, RBAC, teams        │  │
│  │  • Supabase       │  │                                    │  │
│  │  • PostgreSQL     │  │                                    │  │
│  └───────────────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// LLM provider — any model service must implement this
interface LLMProvider {
  streamChat(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string>;
}

// Agent — any processing step in the pipeline
interface BaseAgent {
  readonly name: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

// Storage — any persistence backend
interface StorageAdapter {
  listProjects(): Promise<ProjectMeta[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
}
```

Adding a new LLM provider, agent, or storage backend requires implementing one interface in one file — no changes to the rest of the system.
