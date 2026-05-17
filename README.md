# Tempo AI

An AI-powered application generator built as an **Agile Development Team simulation**. Describe what you want in natural language — a team of five AI agents (BA, Tech Lead, UI/UX Designer, Developer, QA Engineer) collaborates through a sprint to deliver a working web application in real time.

Live demo: [tempo-ai-one.vercel.app](https://tempo-ai-one.vercel.app)

---

## Design Philosophy

**"An AI team, not an AI tool."**

Most AI code generators treat the LLM as a single black box: user sends prompt, model returns code. Tempo AI reimagines this as a **multi-agent agile team** where each role has distinct expertise, structured handoffs, and a QA feedback loop — mirroring how real software teams operate.

Core design principles:
1. **Separation of concerns** — each agent (BA, TL, UI/UX, Dev, QA) owns one responsibility
2. **Quality through iteration** — QA validates against requirements and design specs; Dev fixes issues in up to 3 retry rounds, with TL escalation if issues persist
3. **Transparency** — the entire team's thinking process is visible in the chat as collapsible role cards
4. **Progressive engagement** — the UI is fully explorable before sign-in; authentication only triggers on action

---

## Architecture Overview

### System Flow

```
User Input (natural language)
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Mode Router                                │
│              plan mode │ build mode                           │
└────────┬──────────────┴──────────────┬──────────────────────┘
         │                             │
         ▼                             ▼
┌─────────────────┐    ┌──────────────────────────────────────┐
│  PlannerAgent   │    │         Sprint Orchestrator           │
│                 │    │                                       │
│ Structured plan │    │  ┌─────┐  ┌────┐  ┌──────┐          │
│ with selectable │    │  │ BA  │─▶│ TL │─▶│UI/UX │          │
│ bullet points   │    │  └──┬──┘  └──┬─┘  └──┬───┘          │
│                 │    │     │ reject? │       │              │
│  [Build this]   │    │     │ question?       ▼              │
│  (user selects  │    │     │          ┌──────────┐          │
│   items to      │    │     │          │   Dev    │◀─────┐   │
│   implement)    │    │     │          └────┬─────┘      │   │
└─────────────────┘    │     │               │            │   │
                       │     │               ▼            │   │
                       │     │          ┌─────────┐       │   │
                       │     │          │   QA    │       │   │
                       │     │          └────┬────┘       │   │
                       │     │    ┌──────────┤           │   │
                       │     │    │ FAIL     │ PASS       │   │
                       │     │    │ (max 3x) │            │   │
                       │     │    ▼          ▼            │   │
                       │     │  Dev fix    MVP Shipped    │   │
                       │     │    │                       │   │
                       │     │    └─(still failing)──▶ TL ┘   │
                       │     │                     review     │
                       └─────┴────────────────────────────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Live Preview    │
                              │  (iframe srcDoc) │
                              └─────────────────┘
```

### Agent Roles

| Agent | Name | Responsibility |
|-------|------|----------------|
| **BA** (Business Analyst) | Mike | Assesses request clarity (clear / vague / too vague), produces spec with features and acceptance criteria, or asks clarifying questions |
| **TL** (Tech Lead) | Sarah | Defines architecture, file structure, state management strategy, and build order; escalation reviewer when QA-Dev loop exhausts retries |
| **UI/UX** (Designer) | Alex | Specifies colors, typography, layout, spacing, and interaction patterns with concrete values |
| **Dev** (Developer) | Jordan | Implements the full application as multi-file output (HTML + CSS + JS), handles iterations preserving existing features |
| **QA** (Engineer) | Chris | Validates against BA's acceptance criteria AND UI/UX design specs; fails with itemized issues for Dev to fix |

### BA Intelligence

The BA classifies every incoming request into one of three categories:

- **Category A (Clear)** — specific enough to build immediately → outputs spec, sprint proceeds
- **Category B (Vague but workable)** — has intent but missing details → asks 2-4 clarifying questions, pauses sprint
- **Category C (Too vague)** — nonsensical or not actionable → rejects with helpful suggestions, sprint stops

This prevents the team from wasting effort on unclear requirements.

### QA-Dev Feedback Loop with TL Escalation

```
Dev writes code
      │
      ▼
QA validates against:
  ✓ BA acceptance criteria
  ✓ UI/UX design specs
  ✓ Code functionality
  ✓ Regression (iterations)
      │
      ├─── PASS → Ship MVP
      │
      └─── FAIL (itemized issues)
              │
              ▼
         Dev fixes ALL issues
         (with full BA + UI/UX context)
              │
              └──→ QA re-validates (up to 3 rounds)
                        │
                        └─── Still failing after 3 rounds?
                                    │
                                    ▼
                             TL (Sarah) escalation
                             Analyzes root cause, revises approach
                                    │
                                    ▼
                             Dev rebuilds with TL guidance
                                    │
                                    ▼
                             Final QA validation
                                    │
                              ┌─────┴─────┐
                              │           │
                           PASS        FAIL
                              │           │
                         MVP Shipped   User notified
                                      (honest feedback,
                                       continue conversation)
```

---

## Quick Start

```bash
# Prerequisites: Node.js >= 18, pnpm >= 9

# 1. Clone and install
git clone <repo-url>
cd TempoAI
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Add your LLM API key and Clerk keys (see below)

# 3. Run development server
pnpm dev
# Open http://localhost:3000

# 4. Build for production
pnpm build && pnpm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DEEPSEEK_API_KEY` | One of three | [DeepSeek](https://platform.deepseek.com/) API key (preferred) |
| `ANTHROPIC_API_KEY` | One of three | [Anthropic](https://console.anthropic.com/) API key |
| `OPENROUTER_API_KEY` | One of three | [OpenRouter](https://openrouter.ai/) API key (fallback) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | [Clerk](https://clerk.com/) publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |

LLM provider priority: DeepSeek → Anthropic → OpenRouter (first available key wins).

---

## Features

### Core
- **Multi-Agent Sprint Development** — five AI agents collaborate through a structured sprint pipeline
- **Plan Mode** — AI generates a structured plan with selectable bullet points; user chooses what to build
- **Build Mode** — full agile sprint: BA → TL → UI/UX → Dev → QA with live streaming
- **Interactive Preview** — sandboxed iframe rendering with URL bar, device width toggles, and code/file views
- **Iterative Refinement** — subsequent sprints preserve existing code; Dev modifies incrementally, QA regression-tests

### UX
- **Progressive Authentication** — UI fully explorable; Clerk sign-in modal triggers only on action
- **V0-Style Landing Page** — branded homepage with prompt suggestions, AI introduction, and mode toggles
- **Collapsible Team Cards** — each agent's thinking is shown as an expandable card in the chat stream
- **Sprint Summary** — professional work report after each sprint: what was built, features delivered, next steps
- **Branded Generation Splash** — animated Tempo AI screen during code generation instead of raw code
- **Intelligent Auto-Scroll** — chat scrolls during streaming but respects user scroll-up

### Infrastructure
- **Version History** — every generation creates a snapshot; browse and restore past versions
- **Project Persistence** — projects, conversations, and code survive refresh (localStorage + IndexedDB)
- **Multi-File Code Generation** — outputs `index.html`, `style.css`, `script.js` with file tree browser
- **Dark/Light Theme** — system-aware with manual toggle
- **Responsive Layout** — desktop split-pane with draggable divider; mobile tab-based layout
- **Keyboard Shortcuts** — `⌘K` (new chat), `Esc` (stop), `/` (focus input)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Components | [shadcn/ui v4](https://ui.shadcn.com/) (base-ui) |
| Auth | [Clerk](https://clerk.com/) (modal-based, progressive gating) |
| Icons | [Lucide React](https://lucide.dev/) |
| LLM | DeepSeek / Anthropic / OpenRouter (pluggable) |
| Preview | `<iframe srcDoc>` with configurable `sandbox` |
| Persistence | localStorage + IndexedDB |
| Deployment | [Vercel](https://vercel.com/) |

---

## Project Structure

```
TempoAI/
├── app/
│   ├── page.tsx                  # Main page — Clerk-gated workspace with split layout
│   ├── layout.tsx                # Root layout — Clerk, theme, and toast providers
│   ├── globals.css               # Tailwind + custom animations (shimmer, float, progress)
│   └── api/chat/route.ts         # POST — routes to PlannerAgent or SprintOrchestrator
│
├── components/
│   ├── ChatPanel.tsx             # Message list + scroll management + plan implementation
│   ├── ChatInput.tsx             # Textarea with Plan/Build mode toggles and send button
│   ├── MessageBubble.tsx         # Rich message rendering — role cards, plan card, QA card, etc.
│   ├── PreviewPanel.tsx          # Iframe preview + code view + file tree + generation splash
│   ├── HomePage.tsx              # V0-style landing page with prompt suggestions
│   ├── TempoLogo.tsx             # Animated brand logo
│   ├── UserMenu.tsx              # Clerk sign-in/sign-up buttons and user avatar
│   ├── Sidebar.tsx               # Project history list with search
│   ├── EmptyState.tsx            # Prompt suggestion cards for new conversations
│   ├── ResizablePanel.tsx        # Draggable split-pane divider
│   ├── VersionTimeline.tsx       # Version snapshot browser with restore
│   ├── MobileLayout.tsx          # Tab-based layout for small screens
│   ├── Toast.tsx                 # Notification system
│   ├── ThemeProvider.tsx         # next-themes wrapper
│   └── ThemeToggle.tsx           # Dark/light toggle
│
├── hooks/
│   ├── useChat.ts                # Core state — streaming, parsing, team progress, persistence
│   ├── useKeyboardShortcuts.ts   # Global keyboard shortcuts
│   ├── useMediaQuery.ts          # Responsive breakpoint detection
│   └── useMounted.ts             # SSR hydration helper
│
├── lib/
│   ├── agents/
│   │   ├── orchestrator.ts       # Routes plan mode to PlannerAgent, build mode to code agents
│   │   ├── code-generator.ts     # Single-agent code generation
│   │   ├── code-modifier.ts      # Single-agent iterative code modification
│   │   ├── planner.ts            # Structured plan generation (Plan mode)
│   │   ├── validator.ts          # Code validation agent
│   │   ├── types.ts              # BaseAgent interface
│   │   └── team/
│   │       ├── sprint-orchestrator.ts  # Multi-agent pipeline: BA → TL → UI/UX → Dev → QA
│   │       ├── ba-agent.ts             # Business Analyst (clarity assessment + spec)
│   │       ├── tl-agent.ts             # Tech Lead (architecture)
│   │       ├── uiux-agent.ts           # UI/UX Designer (visual spec)
│   │       ├── dev-agent.ts            # Developer (code implementation + fix)
│   │       ├── qa-agent.ts             # QA Engineer (validation + regression)
│   │       └── prompts.ts              # All team agent system prompts
│   ├── llm/
│   │   ├── index.ts              # Provider factory (DeepSeek > Anthropic > OpenRouter)
│   │   ├── deepseek.ts           # DeepSeek streaming implementation
│   │   ├── anthropic.ts          # Anthropic Messages API streaming
│   │   ├── openrouter.ts         # OpenRouter streaming (OpenAI-compatible)
│   │   ├── prompts.ts            # System prompts for single-agent flows
│   │   └── types.ts              # LLMProvider interface + LLMMessage type
│   ├── parser.ts                 # Multi-file fence parser + HTML merger for iframe
│   ├── storage/
│   │   ├── index.ts              # Storage facade (localStorage + IndexedDB)
│   │   ├── local-storage.ts      # Metadata persistence
│   │   ├── indexed-db.ts         # Large payload persistence
│   │   └── types.ts              # StorageAdapter interface
│   ├── preview/
│   │   ├── iframe-engine.ts      # iframe srcDoc preview implementation
│   │   └── types.ts              # PreviewEngine interface
│   └── utils.ts                  # cn() class merge helper
│
├── types/index.ts                # Shared domain types
├── proxy.ts                      # Clerk middleware — progressive API gating
├── docs/
│   └── DESIGN_NOTES.md           # Trade-offs, completion status, and future roadmap
└── [config files]                # next.config.ts, tsconfig.json, etc.
```

---

## Key Module Design

### Sprint Orchestrator (`lib/agents/team/sprint-orchestrator.ts`)

The central coordination engine. It chains agents sequentially via async generators, streaming each agent's output token-by-token to the frontend. Phase markers (`[TEAM:role:status:name:title]`) are embedded in the stream so the frontend can update the UI in real time without polling.

Key design decisions:
- **Async generator pattern** — each agent `yield*`s chunks, enabling true token-level streaming through the entire pipeline
- **BA gating** — the orchestrator checks BA output for `[BA:REJECT]` or `[QUESTIONS]` markers and halts the sprint early, avoiding wasted LLM calls
- **Context threading** — BA output feeds into TL and UI/UX; all three feed into Dev; BA + UI/UX + Dev code feed into QA
- **QA retry loop** — on failure, QA's itemized feedback plus original BA/UI/UX specs are sent back to Dev for targeted fixes (up to 3 rounds)
- **TL escalation** — if QA still fails after 3 rounds, TL reviews the persistent issues and provides a revised technical approach; Dev rebuilds once more; final QA decides pass/fail
- **Honest failure reporting** — if QA fails even after TL escalation, the sprint emits `[SPRINT:INCOMPLETE]` and the frontend displays an honest card encouraging the user to continue the conversation

### Streaming Content Parser (`hooks/useChat.ts`)

The `useChat` hook manages the complex state of parsing a single interleaved stream into structured UI state. The stream contains natural language text, code blocks, and control markers — all mixed together.

Key parsing responsibilities:
- **Phase marker detection** — `[TEAM:ba:start:Mike:Business Analyst]` markers update the `teamProgress` state
- **Role segment extraction** — `parseRoleSegments()` splits raw stream content into per-role segments for rendering as collapsible cards
- **BA special handling** — detects `[QUESTIONS]...[/QUESTIONS]` and `[BA:REJECT]...[/BA:REJECT]` to trigger interactive UI
- **Code extraction** — strips markers, splits chat text from code blocks, feeds code into the multi-file parser
- **Sprint context persistence** — `sprintContextRef` carries role outputs across sprints for iteration context

### Multi-File Parser (`lib/parser.ts`)

Handles two output formats:
1. **Multi-file** — ` ```language:filename ` blocks (e.g., ` ```css:style.css `) extracted into a `FileMap`
2. **Legacy single-file** — ` ```html ` block extracted as a single HTML string

The `mergeFilesToHtml()` function reassembles multi-file output into a single HTML document for iframe rendering, automatically linking CSS via `<style>` and JS via `<script>` tags.

### Message Bubble System (`components/MessageBubble.tsx`)

The most complex UI component, rendering different message types:
- **Team Sprint** — collapsible `RoleCard` per agent, `QuestionCard` for BA questions, `RejectionCard` for vague requests, `SprintSummaryCard` on completion, `SprintIncompleteCard` when QA exhausts all retries
- **Plan Mode** — `PlanCard` with selectable checkboxes per plan item, select-all toggle, and contextual "Build N selected" button
- **Legacy Agent** — `ThinkingSteps` timeline showing analyze → route → write → validate → fix phases
- **Historical reconstruction** — `rebuildTeamProgress()` reconstructs team progress from persisted `sprintRaw` for messages loaded from storage

### LLM Provider Layer (`lib/llm/`)

Interface-driven design allowing hot-swapping between providers:
- `LLMProvider.streamChat()` returns `AsyncIterable<string>` — all providers share the same contract
- `createLLMProvider()` factory auto-selects based on which API key is present
- Each provider handles its own API format (Anthropic Messages API vs OpenAI-compatible for DeepSeek/OpenRouter)

---

## Data Model

```typescript
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;          // Clean display text
  timestamp: number;
  rawContent?: string;      // Full raw LLM output (with code blocks)
  agentName?: string;       // Which agent/mode produced this message
  sprintRaw?: string;       // Full sprint stream for historical reconstruction
};

type Project = {
  id: string;
  title: string;
  messages: ChatMessage[];
  currentHtml: string | null;
  versions: ProjectVersion[];
  createdAt: number;
  updatedAt: number;
};

type SprintContext = {
  roleOutputs: SprintRoleOutput[];  // Each role's output from previous sprint
  userAnswers?: string[];           // BA question answers
  sprintNumber: number;
};
```

---

## Security

This is a **prototype**. Production deployment would require additional hardening.

| Concern | Current Approach |
|---------|-----------------|
| API keys | Server-side only via Route Handler; never in browser bundle |
| Generated code | Sandboxed iframe (`allow-scripts allow-forms`); isolated origin |
| Authentication | Clerk middleware gates `/api/chat`; frontend uses progressive modal gating |
| Production gaps | Would need: separate-origin preview, strict CSP, rate limiting, abuse detection |

---

## License

[MIT](LICENSE)
