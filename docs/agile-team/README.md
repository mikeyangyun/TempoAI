# Agile micro-team — Cursor agent collaboration guide

This directory defines **role boundaries** and a **recommended order** for prototyping or feature work. When starting Cursor on a feature, attach something like: *Follow the agile flow under `docs/agile-team/`.*

## Goals

- **Lower token usage**: Each chat focuses on one role’s artifact; downstream roles only read finalized short upstream notes (story, acceptance criteria, technical slices)—avoid repeating long context.
- **Fast iteration**: Clarify scope and acceptance first; ship small increments; each round has something demoable.

## Feature micro-cycle (recommended)

For each feature, produce in sequence (same agent acting as roles in stages, or separate chats):

| Order | Role | Artifact (committed or short note at top of chat) |
|-------|------|-----------------------------------------------------|
| 1 | BA | User story, scope boundaries, acceptance criteria (Given/When/Then) |
| 2 | UX | Key layout, states (loading/empty/error), copy notes |
| 3 | TL | Technical slices (tasks), deps and risks, alignment with blueprint |
| 4 | Dev | Slice-by-slice implementation; keep change summaries short |
| 5 | QA | Test angles, edge cases, smoke checklist; automate only where it pays |

**Principle**: BA → UX → TL outputs stay within each role’s template length; Dev should reference those three, not replay the entire discussion.

## Relationship to blueprint

If `docs/PROTOTYPE_BLUEPRINT.md` exists, TL and Dev must check for conflicts before slicing and implementation; conflicts need explicit trade-offs or blueprint updates in thread.

## Role index

| File | Role |
|------|------|
| [business-analyst.md](./business-analyst.md) | BA — requirements & acceptance |
| [ux-designer.md](./ux-designer.md) | UX — interaction & UX notes |
| [tech-lead.md](./tech-lead.md) | TL — technical slicing |
| [developer.md](./developer.md) | Dev — implementation conventions |
| [qa-engineer.md](./qa-engineer.md) | QA — quality & verification |

## One-line agent prompt example

```text
Implement feature "XXX": follow the order in docs/agile-team/README.md—
produce short BA → UX → TL conclusions first, implement, then self-check with QA checklist.
Honor each role charter under docs/agile-team/ and do not skip acceptance criteria.
```
