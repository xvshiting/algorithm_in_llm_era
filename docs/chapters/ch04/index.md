# 第4章 图算法——建模比算法更重要

---

## 一个关于"建模错误"的故事

2024年，某物流公司要优化配送路径。工程师小李让 Cursor "实现最短路径算法"。

Cursor 给了 Dijkstra 实现，代码漂亮，测试通过。

上线后：系统崩溃。

问题出在哪里？

配送路径有时间窗约束——某些客户只能在特定时间段收货。小李没告诉 Cursor 这个约束。Cursor 给的是纯 Dijkstra，不考虑时间窗。

**建模错误，算法再对也没用。**

这个故事的教训是：**建模是人的工作，算法实现可以交给 LLM。但建模错了，一切都错。**

---

Skiena 在《算法设计手册》中有一个核心原则：**"设计图而非算法"**。

意思是：一旦你把问题正确地建模为图问题，标准图算法会自动解决它。真正的难点不是选择 BFS 还是 DFS，而是：

- 这个问题能建模为图吗？
- 顶点是什么？边是什么？权是什么？
- 有向还是无向？有环还是无环？

这些问题，LLM 不擅长回答。因为它们需要**对问题的深刻理解**，而不是对算法的记忆。

---

## 这一章的核心叙事

这一章的独特逻辑不是"图算法有哪些"，而是**LLM 能做和不能做的边界**。

```
问题 → 建模（人） → 算法（LLM） → 执行 → 判断（人）

人负责（创造性）：
├── 识别问题是否可建模为图
├── 定义顶点、边、权
├── 选择算法类别（遍历、最短路、流）
└── 判断建模是否正确

LLM 负责（机械性）：
├── 实现标准图算法
├── 选择具体算法（BFS/DFS、Dijkstra/BF）
├── 生成代码
└── 提供测试用例

人必须判断：
├── 建模是否遗漏约束
├── 算法选择是否匹配问题特性
└── 边界情况是否覆盖
```

学完这一章，你将理解：

- 为什么 Skiena 说"设计图而非算法"
- 常见图问题建模：调度、路径、资源分配
- 图 + LLM 融合的三种模式：知识图谱 RAG、GNN 嵌入、推理图
- 人机分工的边界在哪里

---

## 如何阅读这一章

这一章的内容需要你有一定编程基础。如果你已经熟悉图算法，可以重点关注：

- **4.7 设计图而非算法**：核心章节，人机分工详解
- **4.9 LLM + 图算法融合**：核心章节，图作为推理结构
- **4.8 图神经网络基础**：图结构与神经网络的连接

每节都有三层练习：

- **层次一（基础）**：手工计算、证明验证
- **层次二（LLM 协同）**：让 agent 实现，你审查和评判
- **层次三（Agent 设计）**：设计一个 Skill 或策略选择器

---

## 本章各节

- [4.1 图的表示与应用](/chapters/ch04/01-graph-representation) —— 邻接矩阵 vs 邻接表
- [4.2 BFS 与 DFS](/chapters/ch04/02-bfs-dfs) —— 遍历与边分类
- [4.3 拓扑排序与强连通分量](/chapters/ch04/03-topology-scc) —— DAG 与 SCC
- [4.4 最小生成树](/chapters/ch04/04-mst) —— Kruskal 与 Prim
- [4.5 最短路径](/chapters/ch04/05-shortest-path) —— Dijkstra 到 Floyd-Warshall
- [4.6 最大流](/chapters/ch04/06-max-flow) —— Ford-Fulkerson 与推送-重贴标签
- [4.7 设计图而非算法](/chapters/ch04/07-design-graph) —— **核心章节：人机分工**
- [4.8 图神经网络基础](/chapters/ch04/08-gnn-basics) —— GCN、GAT、Node2Vec
- [4.9 LLM + 图算法融合](/chapters/ch04/09-llm-graph) —— **核心章节：图作为推理结构**
- [4.10 综合练习](/chapters/ch04/10-exercises) —— 三层练习设计

---

## 关键参考文献

本章引用的主要教材和论文：

- CLRS, *Introduction to Algorithms*, 4th ed., Chapters 22-26
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapters 5-8
- Sedgewick & Wayne, *Algorithms*, 4th ed., Chapter 4
- "LLMs+Graphs: Toward Graph-Native, Synergistic AI Systems", arXiv 2026-06
- "GNN-as-Judge: LLMs for Graph Learning with GNN Feedback", arXiv 2026-03
- "Teaching LLMs to See Graphs", arXiv 2026-05
- "Graph Neural Network-Informed Predictive Flows", arXiv 2026-04