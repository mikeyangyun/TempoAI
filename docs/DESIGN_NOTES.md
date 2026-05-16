# Tempo AI — Design Notes & Future Roadmap

> This document fulfills the submission requirement: implementation reasoning, key trade-offs, completion status, and prioritized extension plan.

---

## 1. Implementation Approach & Key Trade-offs

### Overall Philosophy

**"Fast and stable, with extensible seams."** — Ship a working prototype with a solid core loop (prompt → generate → preview → iterate), while structuring the code so that each layer can be upgraded independently without rewriting the system.

### Architecture Decisions

| Decision | What we chose | What we traded off | Why |
|----------|---------------|-------------------|-----|
| **Single-file HTML output** | Model outputs one complete HTML document per generation | Cannot generate multi-file React/Vue apps natively | Eliminates bundler complexity; iframe rendering is instant and reliable. The `PreviewEngine` interface allows swapping in Sandpack/WebContainers later without changing the chat or agent layers. |
| **Agent Orchestration layer** | `lib/agents/` with an `Orchestrator` that routes to specialized agents (CodeGenerator, CodeModifier) | Overhead vs. a single direct LLM call | Demonstrates multi-agent architecture understanding; makes adding new agents (e.g. CodeReviewer, Deployer) a one-file addition. Current agents are thin wrappers — no over-engineering. |
| **Server-side only LLM calls** | Next.js Route Handler proxies to OpenRouter | Cannot do client-side streaming without a backend | Non-negotiable for key security. Also enables future rate limiting, logging, and model switching without client changes. |
| **localStorage + IndexedDB** | Split: metadata in localStorage, large HTML in IndexedDB | No cloud sync, no multi-device | Zero external dependencies; instant setup; sufficient for demo. Storage layer is abstracted — adding Supabase/PostgreSQL would only require a new adapter. |
| **iframe sandbox** | `srcDoc` injection with configurable sandbox attributes | Not production-grade isolation (no separate origin) | Good enough for local demo; declared clearly in README. The `PreviewEngine` abstraction allows migrating to a containerized sandbox (Docker/Firecracker) or WebContainers. |
| **OpenRouter as LLM gateway** | Single OpenAI-compatible endpoint; model switchable via env var | Depends on third-party routing | Avoids vendor lock-in; can swap to direct OpenAI, Anthropic, or self-hosted model with a one-line env change. |
| **Streaming with fenced code contract** | System prompt enforces ` ```html ``` ` output; parser extracts only that block | Model occasionally breaks contract | Robust fallback: raw output shown + error toast with retry. Streaming shows code as it generates — no half-rendered previews. |

### What We Deliberately Did NOT Build (and Why)

| Feature | Reason for exclusion |
|---------|---------------------|
| User authentication / multi-tenancy | Not needed for a single-user prototype demo; adds significant complexity with no evaluation benefit |
| Docker/Firecracker sandboxing | Requires infra setup that cannot be reliably demoed in a portable `pnpm dev` scenario |
| Real-time multi-user collaboration | Out of scope for solo prototype; WebSocket infra is non-trivial |
| Deployment pipeline (custom domains) | Replaced by lightweight download functionality which demonstrates the concept without infra |
| Full CI/CD | Prototype-grade; manual verification per phase |
| Monaco Editor | Would add ~2MB bundle; plain `<pre>` code view with syntax sufficient for demo; architecture allows drop-in upgrade |

---

## 2. Current Completion Status

| Phase | Scope | Status | Notes |
|-------|-------|--------|-------|
| 0 | Project scaffolding | **Done** | Next.js 16 + Tailwind 4 + shadcn/ui v4 + env setup |
| 1 | Core layout (split-pane) | **Done** | Custom ResizablePanel with drag handle |
| 2 | LLM integration (streaming) | **Done** | OpenRouter provider + HTML fence parser |
| 3 | Chat interaction (frontend) | **Done** | Streaming display, auto-scroll, stop control |
| 4 | Preview engine (iframe) | **Done** | iframe srcDoc + toolbar (reload, new tab, download) |
| 5 | Persistence (storage) | **Done** | localStorage + IndexedDB facade + sidebar |
| 6 | UX polish | **Done** | Empty state, toasts, shortcuts, responsive, dark mode |
| 7 | Iterative modification + versions | **Done** | CodeModifier agent + VersionTimeline with restore |
| 8 | Final documentation | **Done** | README, DESIGN_NOTES, code cleanup |
| 9 | Buffer enhancements | Pending | Monaco, share link, model selector |

### What Works

The complete user workflow:

1. **Fresh start**: Open app → see prompt suggestion cards → click one or type custom prompt
2. **Generation**: AI streams code token-by-token → live code preview visible during generation
3. **Preview**: Generation completes → interactive app renders in sandboxed iframe
4. **Iteration**: Send follow-up message → Orchestrator routes to CodeModifier → app updates
5. **Versioning**: Each generation creates a snapshot → dropdown shows all versions → click to restore
6. **Persistence**: Refresh page → all projects, messages, and versions survive
7. **Multi-project**: Sidebar shows project history → switch between projects → start new chat (⌘K)
8. **Error recovery**: Network failure → toast with "Retry" button → click to resend
9. **Responsive**: Desktop: split-pane + sidebar | Mobile: tabbed layout
10. **Theme**: Dark/light mode with full coverage via CSS variables

### Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| Single-file HTML only | No multi-file React/Vue apps | CDN libraries via `<script>` tags work fine |
| No npm packages | Limited to CDN-available libs | System prompt includes Tailwind CSS CDN by default |
| Model quality varies | Less capable models produce worse output | Switch to `gpt-4o` or `claude-3.5-sonnet` via env var |
| localStorage size limits | ~5-10MB browser limit | Large projects auto-overflow to IndexedDB |
| No deployment | Apps only run locally | Download HTML button available |
| No undo for version restore | Restoring replaces current view | All versions preserved in timeline |

---

## 3. Future Extension Roadmap (If More Time Were Available)

Ordered by **impact/effort ratio** — highest value first.

### Tier 1: High Impact, Moderate Effort (next 1–2 days)

| Extension | Description | Architectural Hook |
|-----------|-------------|-------------------|
| **WebContainers / Sandpack integration** | Replace iframe single-file with a browser-based Node.js runtime; enables multi-file React/Vue generation | `PreviewEngine` interface — implement `WebContainerEngine` adapter |
| **Multi-agent pipeline** | Add `PlannerAgent` (decomposes complex requests) + `ReviewerAgent` (validates HTML quality before preview) | `Orchestrator` already routes by intent; add new agent classes |
| **Editable code + re-inject** | Monaco editor becomes read-write; user manual edits re-inject into iframe and become the new `currentHtml` baseline | Monaco `onChange` → `PreviewEngine.inject()` |
| **Server-side persistence (Supabase/PostgreSQL)** | Enable cross-device sync, sharing, and project URLs | `StorageAdapter` interface — implement `SupabaseAdapter` |

### Tier 2: Medium Impact, Medium Effort (next 3–5 days)

| Extension | Description | Architectural Hook |
|-----------|-------------|-------------------|
| **One-click deployment** | Publish generated app to Vercel/Cloudflare Pages via API | New `DeployAgent` in orchestration layer |
| **Template marketplace** | Pre-built starter templates (dashboard, landing page, form); community submissions | `lib/templates/` registry + UI template picker |
| **Model comparison mode** | Generate same prompt with 2 models side-by-side; user picks preferred output | `Orchestrator.parallelGenerate()` + split preview |
| **Real-time collaboration** | WebSocket-based multi-cursor; shared project state | Requires Yjs/CRDT + WebSocket server; significant infra |
| **Component-level editing** | Click an element in preview → highlight in code → modify only that component | Requires DOM-to-source mapping; complex but high UX value |

### Tier 3: Long-term Vision (1–4 weeks)

| Extension | Description |
|-----------|-------------|
| **Full-stack generation** | Generate backend (API routes, database schema) alongside frontend |
| **Git-native versioning** | Replace simple snapshots with actual git commits; branching, merging, PRs |
| **Plugin system** | Third-party agents/tools can register via a plugin API |
| **Usage metering & billing** | Credit system, subscription tiers, rate limiting per user |
| **Security hardening** | Separate-origin iframe, CSP policies, container isolation, abuse detection |
| **Mobile app generation** | Extend beyond web — generate React Native or Flutter code |

---

## 4. Extensibility Architecture

The codebase is structured around **interface boundaries** that enable upgrading any layer independently:

```
┌─────────────────────────────────────────────────────────────┐
│                    Extensibility Seams                        │
│                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  LLM Layer  │   │ Agent Layer  │   │ Preview Engine   │  │
│  │             │   │              │   │                  │  │
│  │ Interface:  │   │ Interface:   │   │ Interface:       │  │
│  │ LLMProvider │   │ BaseAgent    │   │ PreviewEngine    │  │
│  │             │   │              │   │                  │  │
│  │ Impls:      │   │ Impls:       │   │ Impls:           │  │
│  │ • OpenRouter│   │ • CodeGen    │   │ • IframeSrcDoc   │  │
│  │ • OpenAI    │   │ • CodeMod    │   │ • Sandpack       │  │
│  │ • Anthropic │   │ • Planner    │   │ • WebContainers  │  │
│  │ • Local LLM │   │ • Reviewer   │   │ • Docker (SSR)   │  │
│  └─────────────┘   └──────────────┘   └─────────────────┘  │
│                                                              │
│  ┌──────────────────┐   ┌─────────────────────────────────┐ │
│  │  Storage Layer   │   │        UI Components            │ │
│  │                  │   │                                 │ │
│  │  Interface:      │   │  Composable panels:             │ │
│  │  StorageAdapter  │   │  • ChatPanel                    │ │
│  │                  │   │  • PreviewPanel                 │ │
│  │  Impls:          │   │  • EditorPanel (Monaco)         │ │
│  │  • LocalStorage  │   │  • VersionTimeline              │ │
│  │  • IndexedDB     │   │  • TemplateGallery              │ │
│  │  • Supabase      │   │                                 │ │
│  │  • PostgreSQL    │   │                                 │ │
│  └──────────────────┘   └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Interfaces (implemented in prototype)

```typescript
// Any LLM provider must implement this
interface LLMProvider {
  streamChat(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string>;
}

// Any agent must implement this
interface BaseAgent {
  readonly name: string;
  execute(context: AgentContext): Promise<AgentResult>;
}

// Preview rendering can be swapped
interface PreviewEngine {
  inject(html: string): void;
  reload(): void;
  openInNewTab(): void;
  getScreenshot?(): Promise<Blob>;
}

// Storage can be upgraded without touching UI
interface StorageAdapter {
  listProjects(): Promise<ProjectMeta[]>;
  getProject(id: string): Promise<Project | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
}
```

---

## 5. Priority Judgment Framework

When deciding what to build next, we apply this filter:

```
Does it make the core loop (prompt → generate → preview → iterate) 
MORE STABLE or MORE DELIGHTFUL?
  → Yes: Do it now.
  → No: Does it demonstrate architectural depth or innovation?
    → Yes, and low risk: Do it in buffer time.
    → Yes, but high risk: Document it as future work here.
    → No: Skip entirely.
```

This ensures we never sacrifice a working demo for an impressive-sounding but incomplete feature.
