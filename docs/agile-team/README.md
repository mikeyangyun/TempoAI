# Agile 微型团队 — Cursor Agent 协作指南

本目录定义原型 / Feature 开发时的**角色分工**与**推荐执行顺序**。启动 Cursor Agent 开发某一功能时，可附上：`请按 docs/agile-team/ 下的敏捷流程执行`。

## 目标

- **省 Token**：单次对话聚焦一个角色的产出；下游角色只读上游已定稿的短文（用户故事、验收标准、技术切片），避免重复长上下文。
- **快迭代**：先澄清范围与验收，再小块交付；每轮有可演示增量。

## Feature 微循环（建议）

对每一个 Feature，按顺序产出（可由同一 Agent 分阶段扮演不同角色，或分多次对话）：

| 顺序 | 角色 | 产出物（写入仓库或贴在对话顶部的短文） |
|------|------|----------------------------------------|
| 1 | BA | 用户故事、范围边界、验收标准（Given/When/Then） |
| 2 | UX | 关键界面结构、状态（加载/空/错）、文案要点 |
| 3 | TL | 技术切片（tasks）、依赖与风险、与现有蓝图对齐 |
| 4 | Dev | 按切片实现代码；变更说明保持简短 |
| 5 | QA | 测试要点、边界场景、冒烟清单；必要时补充自动化 |

**原则**：BA → UX → TL 的结论应尽量控制在各自文档模板长度内；Dev 实现时优先引用这三份结论，而非复述整个讨论。

## 与项目蓝图的关系

若仓库中存在 `docs/PROTOTYPE_BLUEPRINT.md`，TL / Dev 在切片与实现前应核对是否与蓝图冲突；冲突须在对话中明确取舍或提议修订蓝图。

## 角色文档索引

| 文件 | 角色 |
|------|------|
| [business-analyst.md](./business-analyst.md) | BA — 需求与验收 |
| [ux-designer.md](./ux-designer.md) | UX — 交互与视觉要点 |
| [tech-lead.md](./tech-lead.md) | TL — 技术与任务拆解 |
| [developer.md](./developer.md) | Dev — 实现约定 |
| [qa-engineer.md](./qa-engineer.md) | QA — 质量与测试 |

## 给 Agent 的一句话指令示例

```text
开发 Feature「XXX」：先按 docs/agile-team/README.md 的顺序，
依次产出 BA → UX → TL 的短文结论，再实现并最后用 QA 清单自检。
全程引用 docs/agile-team/ 各角色职责，避免跳过验收标准。
```
