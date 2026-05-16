---
name: agile-micro-team
description: >-
  Runs a BA→UX→TL→Dev→QA feature micro-flow with short handoffs to save tokens and enable fast prototype iteration. Use when implementing a new feature, sprint-style prototyping, or when the user references agile micro-team, agile feature flow, or docs/agile-team.
disable-model-invocation: true
---

# Agile Micro-Team (feature micro-cycle)

## When this applies

User is building or iterating on a **feature** (not trivial one-line fixes). Default to this workflow unless they explicitly opt out.

## Core rules

1. **Order**: BA → UX → TL → Dev → QA. Do not skip BA acceptance criteria or TL slicing before coding.
2. **Token discipline**: Each role produces a **short artifact** (lists/tables). Downstream roles **reference** upstream artifacts; do not replay full debates.
3. **Blueprint**: If `docs/PROTOTYPE_BLUEPRINT.md` exists, TL and Dev must check alignment; surface conflicts and propose blueprint updates.

## Execution

For the current feature, work through stages. One agent may play roles sequentially, or pause after a stage if the user wants separate chats.

| Stage | Role | Output |
|-------|------|--------|
| 1 | BA | Story, In/Out scope, AC (Given/When/Then), Must/Should/Could |
| 2 | UX | Layout, main flow, loading/empty/error/success behaviors, copy notes |
| 3 | TL | Vertical slices, risks, data/API hints, AC → slices map |
| 4 | Dev | Implement slice-by-slice; brief “slice done” notes |
| 5 | QA | AC checklist, smoke list, edges, defect format |

## Templates and boundaries

- Full templates and charters live under `docs/agile-team/`:
  - `docs/agile-team/README.md` — index and prompt snippet
  - `docs/agile-team/business-analyst.md`
  - `docs/agile-team/ux-designer.md`
  - `docs/agile-team/tech-lead.md`
  - `docs/agile-team/developer.md`
  - `docs/agile-team/qa-engineer.md`
- Read the matching file **when entering that stage** if you need the template verbatim.

## Stop conditions

- Requirements ambiguous → BA clarification before UX/TL.
- Technical blocker → TL spike or explicit assumptions, proceed.
- QA fails AC → Dev fix rerun only impacted QA paths.
