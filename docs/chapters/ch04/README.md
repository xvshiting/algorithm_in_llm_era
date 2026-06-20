# 第4章 图算法——建模比算法更重要

## 核心叙事

"LLM 能做和不能做的边界"

- 建模是创造性的 → 人负责
- 执行是机械的 → LLM 负责
- 判断是必要的 → 人负责

## 章节结构

| 文件 | 主题 | 核心内容 |
|------|------|----------|
| index.md | 导入 | War Story + 学习目标 + 人机分工 |
| 01-graph-representation.md | 图表示 | 邻接矩阵/表 + 应用场景 |
| 02-bfs-dfs.md | 遍历 | BFS/DFS + 边分类 + 白色路径定理 |
| 03-topology-scc.md | 结构 | 拓扑排序 + SCC（Kosaraju/Tarjan） |
| 04-mst.md | MST | Kruskal/Prim + 切割性质 + 并查集 |
| 05-shortest-path.md | 最短路 | Dijkstra/BF/Floyd + 正确性证明 |
| 06-max-flow.md | 最大流 | Ford-Fulkerson + 推送重贴标签 |
| **07-design-graph.md** | **核心** | 建模原则 + 经典映射 + 人机分工 |
| 08-gnn-basics.md | GNN | 图卷积 + 消息传递 + Node2Vec |
| **09-llm-graph.md** | **核心** | 图作为推理结构 + KG-RAG |
| 10-exercises.md | 练习 | 三层练习 + Agent 设计 |

## 文件统计

- 总文件数：11 个
- 总行数：约 1200+ 行
- 核心章节：07, 09

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapters 22-26
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapters 5-8
- "LLMs+Graphs: Toward Graph-Native, Synergistic AI Systems", arXiv 2026-06

---

_创建时间: 2026-06-20_
_创建者: Dana_