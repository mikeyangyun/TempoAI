# Tempo AI

An AI-powered application generator that turns natural language into live, interactive web applications — inspired by [v0.dev](https://v0.dev) and [bolt.new](https://bolt.new).

> **Status**: Pre-development — architecture and project plan finalized, implementation starting from Phase 0.

---

## Vision

Describe what you want in plain English. Tempo AI generates a fully functional web page and renders it in a live preview you can click, type into, and interact with — all in real time. Then keep talking to refine it: _"make the button red"_, _"add a dark mode toggle"_, _"put a navbar on top"_.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                                                              │
│  ┌──────────────┐  resize  ┌───────────────────────────────┐│
│  │  Chat Panel   │◄───────►│       Preview Panel            ││
│  │              │          │                               ││
│  │ • Messages   │          │ ┌───────────────────────────┐ ││
│  │ • Streaming  │  inject  │ │  <iframe> / PreviewEngine │ ││
│  │ • Input bar  │─────────►│ │  srcDoc = generated HTML  │ ││
│  │ • Stop/Send  │  html    │ │  (sandboxed, swappable)   │ ││
│  │              │          │ └───────────────────────────┘ ││
│  └──────┬───────┘          │ Toolbar: Reload │ New Tab     ││
│         │                  │          Code (Monaco) / View  ││
│         │ POST /api/chat   └───────────────────────────────┘│
└─────────┼───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│              Next.js Server — Agent Orchestration             │
│                                                              │
│  ┌────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │Orchestrator│───►│ CodeGenerator│    │  CodeModifier   │  │
│  │ (router)   │───►│    Agent     │    │    Agent        │  │
│  └────────────┘    └──────┬───────┘    └───────┬─────────┘  │
│                           │                    │             │
│         ┌─────────────────▼────────────────────▼──────┐     │
│         │            LLM Provider (interface)          │     │
│         │  Current: OpenRouter (OpenAI-compatible)     │     │
│         │  Swappable: OpenAI / Anthropic / Local LLM   │     │
│         └─────────────────────────────────────────────┘     │
│                                                              │
│  • API Key server-side only (never in browser bundle)        │
│  • Streams SSE tokens back to browser                        │
│  • System prompt enforces ```html``` fenced output           │
└─────────┬────────────────────────────────────────────────────┘
          │
┌─────────▼───────────────────────────────────────────────────┐
│                  LLM Gateway (OpenRouter)                     │
│  • Model configurable via OPENROUTER_MODEL env var           │
│  • Streaming chat completions (OpenAI-compatible protocol)   │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Agent Orchestration layer** | Even with a single model, code is structured as `Orchestrator → Agent` pipeline. Adding new agents (Planner, Reviewer, Deployer) requires only a new file — no rewiring. |
| **Interface-driven extensibility** | Core layers (`LLMProvider`, `PreviewEngine`, `StorageAdapter`, `BaseAgent`) are defined as interfaces. Current impls are simple; upgrading any layer is a swap, not a rewrite. |
| **Single-file HTML generation** | Lowest integration cost; reliable parsing; real interactivity in iframe. The `PreviewEngine` interface allows future swap to Sandpack or WebContainers. |
| **Server-side LLM calls only** | API keys never reach the browser. The Next.js Route Handler acts as a secure proxy. |
| **Fenced code contract** | The system prompt instructs the model to output exactly one ` ```html ``` ` block. The parser only extracts that fence; failures surface a user-friendly error + "copy raw output" fallback. |
| **iframe with sandbox** | Generated HTML is treated as untrusted code. `sandbox` attributes are configured to allow scripts/forms for interactivity while acknowledging this is a local/demo-grade trust boundary (see [Security](#security)). |
| **localStorage + IndexedDB** | Project metadata in localStorage; large HTML payloads in IndexedDB. The `StorageAdapter` interface allows upgrading to Supabase/PostgreSQL without touching UI code. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) |
| LLM Gateway | [OpenRouter](https://openrouter.ai/) (OpenAI-compatible) |
| Preview | `<iframe srcDoc>` with configurable `sandbox` |
| Persistence | localStorage + IndexedDB |
| Package Manager | pnpm |

---

## Project Structure

> Will be populated as each phase is implemented. Target layout:

```
TempoAI/
├── app/
│   ├── page.tsx                 # Main page — split-pane layout
│   ├── layout.tsx               # Root layout, theme provider
│   ├── globals.css              # Tailwind base styles
│   └── api/
│       └── chat/
│           └── route.ts         # POST — streaming LLM proxy via Orchestrator
├── components/
│   ├── ChatPanel.tsx            # Message list + input
│   ├── ChatInput.tsx            # Textarea, send/stop controls
│   ├── MessageBubble.tsx        # Single message rendering
│   ├── PreviewPanel.tsx         # Preview engine wrapper (iframe)
│   ├── CodeEditor.tsx           # Monaco-based code view
│   ├── Sidebar.tsx              # Project list / history
│   ├── VersionTimeline.tsx      # Version snapshot browser
│   └── ui/                      # shadcn/ui primitives
├── hooks/
│   └── useChat.ts               # Streaming fetch + message state
├── lib/
│   ├── agents/
│   │   ├── types.ts             # BaseAgent, AgentContext, AgentResult
│   │   ├── orchestrator.ts      # Routes requests to appropriate agent
│   │   ├── code-generator.ts    # Generates HTML from natural language
│   │   └── code-modifier.ts     # Iteratively modifies existing HTML
│   ├── llm/
│   │   ├── types.ts             # LLMProvider interface
│   │   ├── openrouter.ts        # OpenRouter implementation
│   │   └── prompts.ts           # System prompt definitions
│   ├── preview/
│   │   ├── types.ts             # PreviewEngine interface
│   │   └── iframe-engine.ts     # iframe srcDoc implementation
│   ├── storage/
│   │   ├── types.ts             # StorageAdapter interface
│   │   ├── local-storage.ts     # localStorage implementation
│   │   └── indexed-db.ts        # IndexedDB for large payloads
│   ├── parser.ts                # HTML fence extractor
│   └── utils.ts                 # Shared helpers
├── types/
│   └── index.ts                 # Shared TypeScript types
├── docs/
│   ├── PROTOTYPE_BLUEPRINT.md   # Single source of truth for scope
│   ├── DESIGN_NOTES.md          # Trade-offs, status, future roadmap
│   └── agile-team/              # Agile micro-team role guides
├── .cursor/
│   ├── rules/                   # Cursor agent behavior rules
│   └── skills/                  # Cursor agent skills
├── .env.example                 # Required env vars (no secrets)
├── .env.local                   # Local secrets (git-ignored)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md
```

---

## Quick Start

> Detailed steps will be added once Phase 0 scaffolding is complete.

```bash
# Prerequisites: Node.js >= 18, pnpm >= 9

# 1. Clone and install
git clone <repo-url>
cd TempoAI
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — add your OpenRouter API key

# 3. Run
pnpm dev
# Open http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your [OpenRouter](https://openrouter.ai/) API key |
| `OPENROUTER_MODEL` | No | Model identifier (default: `openai/gpt-4o-mini`) |

---

## Development Phases

Implementation follows the phased plan in the [execution plan](.cursor/plans/). Each phase produces a testable deliverable; documentation is updated incrementally.

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Project scaffolding — Next.js + Tailwind + shadcn/ui + env | Pending |
| 1 | Core layout — split-pane Chat + Preview | Pending |
| 2 | LLM integration — OpenRouter streaming + HTML parser | Pending |
| 3 | Chat interaction — frontend streaming + message UI | Pending |
| 4 | Preview engine — iframe rendering + toolbar | Pending |
| 5 | Persistence — localStorage + IndexedDB + project history | Pending |
| 6 | UX polish — empty states, loading, errors, shortcuts | Pending |
| 7 | Innovation — iterative modification + version snapshots | Pending |
| 8 | Documentation & delivery — final README, .env.example, cleanup | Pending |
| 9 | Buffer enhancements — prompt templates, Monaco, sharing, export | Pending |

---

## Core Features

### Implemented

_None yet — development starting from Phase 0._

### Planned

- **Natural language to live app**: Describe → Generate → Interact
- **Streaming generation**: Token-by-token AI response with stop control
- **Live preview**: Real, interactive iframe rendering (not a screenshot)
- **Iterative refinement**: Keep chatting to modify the generated app
- **Version history**: Snapshot every generation; browse and restore past versions
- **Project persistence**: Conversations and generated code survive page refresh
- **Dark/Light theme**: System-aware with manual toggle

---

## Data Model

```typescript
type Project = {
  id: string;
  title: string;
  messages: ChatMessage[];
  currentHtml: string | null;
  versions: { html: string; timestamp: number }[];
  createdAt: number;
  updatedAt: number;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};
```

---

## Security

This is a **prototype / local demo**. Generated HTML is executed inside a sandboxed iframe, but this does **not** provide production-grade isolation.

| Concern | Prototype Stance |
|---------|-----------------|
| Generated code execution | `<iframe sandbox="allow-scripts allow-forms">` — scripts run, but origin is isolated |
| API key exposure | Server-side only; never in browser bundle or `NEXT_PUBLIC_*` |
| XSS from generated content | Contained within iframe sandbox; not equivalent to a separate-origin deployment |
| Production readiness | Would require: separate origin for preview, strict CSP, content security review |

---

## Agile Workflow

Development follows a lightweight agile micro-team model documented in [`docs/agile-team/`](docs/agile-team/). For each feature:

**BA** (scope & acceptance) → **UX** (interaction & states) → **TL** (tech slices) → **Dev** (implementation) → **QA** (verification)

See the [agile team README](docs/agile-team/README.md) for details.

---

## Architecture Evolution

This prototype is scoped to a local single-user demo, but the architecture is designed to evolve toward a production platform:

| Current (Prototype) | Future (Production) |
|---------------------|---------------------|
| iframe + srcDoc | WebContainers or server-side Docker sandbox |
| Single agent (CodeGenerator / CodeModifier) | Multi-agent pipeline (Planner → Coder → Reviewer → Deployer) |
| localStorage + IndexedDB | PostgreSQL + Redis + cloud sync |
| No auth | OAuth + multi-tenancy + RBAC |
| URL hash sharing | Custom domain deployment (Vercel/Cloudflare API) |
| Single model via OpenRouter | Model comparison, A/B testing, fine-tuned models |

For detailed reasoning, trade-offs, and a prioritized extension roadmap, see **[`docs/DESIGN_NOTES.md`](docs/DESIGN_NOTES.md)**.

---

## Blueprint & Governance

The single source of truth for scope, tech choices, and trade-offs is [`docs/PROTOTYPE_BLUEPRINT.md`](docs/PROTOTYPE_BLUEPRINT.md). Any deviation from the blueprint must be recorded either in the blueprint's revision table or in this README under a "Deviations" section.

---

## License

[MIT](LICENSE)
