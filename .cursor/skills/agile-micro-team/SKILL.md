---
name: agile-micro-team
description: >-
  Runs a BA→UX→TL→Dev→QA feature micro-flow with short handoffs to save tokens and enable fast prototype iteration. Use when implementing a new feature, sprint-style prototyping, or when the user references agile micro-team, agile feature flow, or docs/agile-team.
disable-model-invocation: true
---

# Agile 微型团队（Feature 微循环）

## When this applies

User is building or iterating on a **feature** (not trivial one-line fixes). Default to this workflow unless they explicitly opt out.

## Core rules

1. **Order**: BA → UX → TL → Dev → QA. Do not skip BA acceptance criteria or TL slicing before coding.
2. **Token discipline**: Each role produces a **short artifact** (lists/tables). Downstream roles **reference** upstream artifacts; do not rewrite full discussions.
3. **Blueprint**: If `docs/PROTOTYPE_BLUEPRINT.md` exists, TL and Dev must check alignment; flag conflicts and propose blueprint updates if needed.

## Execution

For the current feature, work through the stages. Same agent may impersonate roles sequentially, or stop after a stage if the user wants separate chats.

| Stage | Role | Output |
|-------|------|--------|
| 1 | BA | Story, In/Out scope, AC (Given/When/Then), Must/Should/Could |
| 2 | UX | Layout, main flow, loading/empty/error/success behavior, copy notes |
| 3 | TL | Vertical slices, risks, data/API notes, map AC → slices |
| 4 | Dev | Implement slice-by-slice; short “done” note per slice |
| 5 | QA | AC checklist, smoke list, edge cases, defects format |

## Templates and boundaries

- Full templates and role boundaries live in the repo:
  - `docs/agile-team/README.md` — index and one-line agent prompt
  - `docs/agile-team/business-analyst.md`
  - `docs/agile-team/ux-designer.md`
  - `docs/agile-team/tech-lead.md`
  - `docs/agile-team/developer.md`
  - `docs/agile-team/qa-engineer.md`
- Read the relevant file **when entering that stage** if templates are needed.

## Stop conditions

- Requirements ambiguous → BA clarification before UX/TL.
- Technical blocker → TL spike or explicit assumption, then continue.
- AC fails at QA → Dev fix, then re-run affected QA checks only.
