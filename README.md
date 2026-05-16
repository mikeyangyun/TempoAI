# Tempo AI

An AI-powered application generator that turns natural language into live, interactive web applications — inspired by [v0.dev](https://v0.dev) and [bolt.new](https://bolt.new).

> **Status**: Prototype complete — all core phases (0–8) implemented and verified.

---

## Vision

Describe what you want in plain English. Tempo AI generates a fully functional web page and renders it in a live preview you can click, type into, and interact with — all in real time. Then keep talking to refine it: _"make the button red"_, _"add a dark mode toggle"_, _"put a navbar on top"_.

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
# Edit .env.local — add your OpenRouter API key

# 3. Run development server
pnpm dev
# Open http://localhost:3000

# 4. Build for production
pnpm build && pnpm start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | Your [OpenRouter](https://openrouter.ai/) API key |
| `OPENROUTER_MODEL` | No | Model identifier (default: `openai/gpt-4o-mini`) |

---

## Core Features

### Implemented

- **Natural Language → Live App**: Describe your app in plain English, get a working interactive web page
- **Real-Time Streaming**: Token-by-token generation with live code preview during generation
- **Interactive Preview**: Sandboxed iframe with full interactivity (clicks, forms, scripts)
- **Iterative Refinement**: Keep chatting to modify the app — "add dark mode", "make the header sticky"
- **Version History**: Every generation creates a version snapshot; browse and restore any past version
- **Project Persistence**: Projects, conversations, and code survive page refresh (localStorage + IndexedDB)
- **Dark/Light Theme**: System-aware with manual toggle via header button
- **Prompt Suggestions**: Empty state shows 6 ready-to-use prompt cards for quick start
- **Keyboard Shortcuts**: `⌘K` (new chat), `Esc` (stop generation), `/` (focus input)
- **Responsive Layout**: Desktop split-pane; mobile tab-based interface
- **Error Handling**: Toast notifications with retry action; graceful error display
- **Download**: Export generated HTML as a downloadable file

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
│         │                  │  Version History │ Download    ││
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
│  • Streams tokens back to browser via chunked response       │
│  • System prompt enforces ```html``` fenced output           │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Agent Orchestration layer** | Code is structured as `Orchestrator → Agent` pipeline. Adding new agents (Planner, Reviewer, Deployer) requires only a new file. |
| **Interface-driven extensibility** | Core layers (`LLMProvider`, `PreviewEngine`, `StorageAdapter`, `BaseAgent`) are defined as interfaces. Upgrading any layer is a swap, not a rewrite. |
| **Single-file HTML generation** | Lowest integration cost; reliable parsing; real interactivity in iframe. The `PreviewEngine` interface allows future swap to Sandpack or WebContainers. |
| **Server-side LLM calls only** | API keys never reach the browser. The Next.js Route Handler acts as a secure proxy. |
| **Fenced code contract** | The system prompt instructs the model to output exactly one ` ```html ``` ` block. The parser extracts that fence; failures surface a user-friendly error. |
| **iframe with sandbox** | Generated HTML is treated as untrusted code. `sandbox` attributes allow scripts/forms while isolating the origin. |
| **localStorage + IndexedDB** | Project metadata in localStorage; large HTML payloads in IndexedDB. The `StorageAdapter` interface allows upgrading to any backend. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Components | [shadcn/ui](https://ui.shadcn.com/) (v4, base-ui) |
| LLM Gateway | [OpenRouter](https://openrouter.ai/) (OpenAI-compatible) |
| Preview | `<iframe srcDoc>` with configurable `sandbox` |
| Persistence | localStorage + IndexedDB |
| Package Manager | pnpm |

---

## Project Structure

```
TempoAI/
├── app/
│   ├── page.tsx                 # Main page — responsive split-pane layout
│   ├── layout.tsx               # Root layout, theme + toast providers
│   ├── globals.css              # Tailwind + shadcn CSS variables (light/dark)
│   └── api/chat/route.ts        # POST — streaming LLM proxy via Orchestrator
├── components/
│   ├── ChatPanel.tsx            # Message list + empty state + input
│   ├── ChatInput.tsx            # Textarea, send/stop controls
│   ├── MessageBubble.tsx        # Single message rendering + streaming
│   ├── PreviewPanel.tsx         # Preview engine wrapper (iframe + code view)
│   ├── EmptyState.tsx           # Prompt suggestion cards
│   ├── Sidebar.tsx              # Project list / history
│   ├── VersionTimeline.tsx      # Version snapshot browser + restore
│   ├── MobileLayout.tsx         # Tab-based layout for mobile
│   ├── ResizablePanel.tsx       # Draggable split-pane
│   ├── Toast.tsx                # Toast notification system
│   ├── ThemeProvider.tsx        # next-themes wrapper
│   ├── ThemeToggle.tsx          # Dark/light toggle button
│   └── ui/                      # shadcn/ui primitives
├── hooks/
│   ├── useChat.ts               # Chat state, streaming, versions, persistence
│   ├── useKeyboardShortcuts.ts  # Global keyboard shortcuts
│   └── useMediaQuery.ts         # Responsive breakpoint detection
├── lib/
│   ├── agents/
│   │   ├── types.ts             # BaseAgent interface
│   │   ├── orchestrator.ts      # Routes to CodeGenerator or CodeModifier
│   │   ├── code-generator.ts    # Generates HTML from natural language
│   │   └── code-modifier.ts     # Iteratively modifies existing HTML
│   ├── llm/
│   │   ├── types.ts             # LLMProvider interface
│   │   ├── openrouter.ts        # OpenRouter streaming implementation
│   │   └── prompts.ts           # System prompt definitions
│   ├── preview/
│   │   ├── types.ts             # PreviewEngine interface
│   │   └── iframe-engine.ts     # iframe srcDoc implementation
│   ├── storage/
│   │   ├── types.ts             # StorageAdapter interface
│   │   ├── local-storage.ts     # localStorage for metadata
│   │   ├── indexed-db.ts        # IndexedDB for large HTML payloads
│   │   └── index.ts             # StorageFacade combining both
│   ├── parser.ts                # HTML fence extractor (streaming + complete)
│   └── utils.ts                 # cn() helper
├── types/index.ts               # Shared TypeScript types
├── docs/
│   ├── PROTOTYPE_BLUEPRINT.md   # Scope and requirements
│   ├── DESIGN_NOTES.md          # Trade-offs, status, future roadmap
│   └── EXECUTION_PLAN.md        # Step-by-step development guide
├── .env.example                 # Required env vars (no secrets)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 0 | Project scaffolding — Next.js + Tailwind + shadcn/ui + env | **Done** |
| 1 | Core layout — split-pane Chat + Preview | **Done** |
| 2 | LLM integration — OpenRouter streaming + HTML parser | **Done** |
| 3 | Chat interaction — frontend streaming + message UI | **Done** |
| 4 | Preview engine — iframe rendering + toolbar | **Done** |
| 5 | Persistence — localStorage + IndexedDB + project history | **Done** |
| 6 | UX polish — empty states, loading, errors, shortcuts | **Done** |
| 7 | Innovation — iterative modification + version snapshots | **Done** |
| 8 | Documentation & delivery — final README, .env.example, cleanup | **Done** |
| 9 | Buffer enhancements — prompt templates, Monaco, sharing, export | Pending |

---

## Demo Workflow

1. Open `http://localhost:3000` — you'll see prompt suggestion cards
2. Click **"Todo App"** or type your own description
3. Watch the AI stream code in real time (code view visible in the preview panel)
4. When generation completes, the live interactive app appears in the preview iframe
5. Type a follow-up: _"add a dark mode toggle"_ — the app updates iteratively
6. Click the version dropdown (`v1/2`) in the preview toolbar to restore any past version
7. Start a new chat with `⌘K`, or browse project history in the sidebar

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

## Known Limitations

- **Single-file HTML only**: Generated apps are self-contained HTML documents; multi-file React/Vue projects are not supported
- **No npm packages in generated code**: Apps can use CDN-linked libraries (included via `<script>` tags in generated HTML) but not `import` statements
- **No real-time collaboration**: Single-user, local-only persistence
- **Model-dependent quality**: Output quality depends on the chosen LLM model; `gpt-4o-mini` is fast but less capable than `gpt-4o` or `claude-3.5-sonnet`
- **No deployment**: Generated apps run locally in iframe; no one-click deploy to hosting
- **localStorage limits**: Browser storage limits apply (~5-10MB); very large projects may need manual cleanup

---

## Architecture Evolution

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

## License

[MIT](LICENSE)
