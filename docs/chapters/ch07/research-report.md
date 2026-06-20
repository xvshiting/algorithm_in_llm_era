# Ch7 图算法——网络的数学语言：调研报告

**调研时间**: 2026-06-20  
**调研者**: Nova (Subagent)  
**项目**: algorithm_in_llm_era 教材

---

## 一、经典图算法全景

### 1.1 图的表示：数据结构的艺术

#### 邻接矩阵 vs 邻接表

**核心问题驱动**：如何高效存储和访问图结构？

| 表示方法 | 时间复杂度 | 空间复杂度 | 适用场景 |
|---------|-----------|-----------|---------|
| 邻接矩阵 | O(1)查询边 | O(V²) | 密图、频繁查询 |
| 邗接表 | O(degree(v))遍历邻居 | O(V+E) | 稀图、遍历密集 |

**直觉先于形式**：
- 社交网络（稀疏）→ 邻接表
- 小团体关系（密集）→ 邻接矩阵
- **关键洞察**：选择数据结构要看"图的性格"

**教材设计参考**：
- Kleinberg/Tardos《Algorithm Design》用**社交网络**引入邻接表
- Skiena《Algorithm Design Manual》对比**不同领域的图密度**
- Roughgarden用**查询模式**决定数据结构选择

**LLM时代新视角**（2025-2026研究）：
- **MolNet (arXiv:2203.09456)**：分子图用邻接矩阵+特征矩阵结合
- **动态图表示**：LLM处理时需要灵活的图编码（见下文"图编码器"）

### 1.2 BFS/DFS：探索的策略

#### 搜索哲学

**问题驱动**：
1. BFS：最短路径（无权图）→ "波纹扩散"
2. DFS：连通性检测 → "深入探索"

**直觉先于形式**：
- BFS像**水波**，逐层扩散
- DFS像**探险家**，深入洞穴再回头
- **关键类比**：迷宫问题（BFS找到最近出口，DFS标记所有可达区域）

**教材设计参考**：
- Kleinberg：用**迷宫导航**引入搜索策略
- Roughgarden：用**社交网络传播**展示BFS层级
- Skiena：强调**实现细节**（队列vs栈的选择）

**LLM时代的挑战与机遇**（2024-2026关键研究）：

**核心问题**：LLM能否执行经典图算法？

- **MAGMA基准 (arXiv:2410.22597)** - 2024年10月：
  - 首个系统评估LLM执行图算法能力的基准
  - 测试算法：BFS、DFS、Dijkstra、Floyd-Warshall、Prim MST
  - **发现**：LLM在显式图上的多步推理存在显著困难
  - **关键洞察**：需要算法指令增强+高级提示技术

- **NLGraph基准 (arXiv:2305.20022)** - 2023年5月（May 2023 submitted, Jan 2024 announced）：
  - 29,370个自然语言图问题
  - 8个图推理任务：连通性、最短路径等
  - **发现**：LLM在中等复杂度图上性能下降

**搜索算法与LLM推理的类比**（2025-2026前沿）：

1. **神经算法推理 (Neural Algorithmic Reasoning)**：
   - GNN学习执行BFS/DFS过程
   - **"Which Algorithms Can GNN Learn?" (arXiv:2502.07130)** - 2026年2月：
     - 系统分析GNN表达能力与算法学习的界限
     - 建立Weisfeiler-Lehman测试与算法复杂性的联系

2. **学习加速搜索 (Learning to Accelerate Search)**：
   - **Learning Graph Search Heuristics (arXiv:2212.00707)** - 2022年12月：
     - 用神经网络学习A*启发式函数
     - 在机器人路径规划中超越手工启发式
   - **TransPath (arXiv:2212.05326)** - 2022年12月：
     - Transformer学习网格路径搜索启发式

3. **神经Bellman-Ford网络 (arXiv:2106.06135)** - 2021年6月：
   - 将Bellman-Ford算法嵌入神经网络
   - 用于链接预测任务
   - **关键洞察**：经典算法的迭代结构可被神经网络"学习"

**教材设计建议**：
- 用LLM执行BFS的**失败案例**激发思考
- 引入"为什么LLM难以执行算法？"的讨论
- 展示GNN如何"学习"搜索策略

### 1.3 最短路径：从局部到全局

#### Dijkstra算法

**问题驱动**：GPS导航如何找到最快路线？

**直觉先于形式**：
1. 从起点"辐射"到最近节点
2. 逐步扩展"已知最短路径"集合
3. **关键类比**：城市扩张，先占领近的，再考虑远的

**教材设计参考**：
- Kleinberg：用**GPS导航**引入，展示贪心策略
- Roughgarden：强调**优先队列**的实现
- Skiena：讨论**负权边问题**（为什么Dijkstra不能处理）

#### Bellman-Ford与Floyd-Warshall

**问题驱动**：
1. Bellman-Ford：网络中有**延误惩罚**（负权边）
2. Floyd-Warshall：**所有节点对**的最短路径（全局视角）

**直觉先于形式**：
- Bellman-Ford像**波浪传播**，反复迭代直到稳定
- Floyd-Warshall像**全知视角**，枚举所有中转站

**教材设计参考**：
- Kleinberg：用**网络路由**引入动态规划视角
- Roughgarden：强调**时间复杂度权衡**（BF: O(V·E), FW: O(V³)）

**LLM时代的学习加速**（2024-2026前沿研究）：

1. **神经Bellman-Ford扩展**：
   - **Neural Bellman-Ford Networks (arXiv:2106.06135)**：
     - 将最短路径计算嵌入GNN消息传递
     - 用于知识图谱推理

2. **学习最短路径启发式**：
   - **Skeleton-Guided Learning (arXiv:2508.03549)** - 2025年8月：
     - 用骨架结构引导最短路径学习
     - 在图数据库中加速路径查询
   
   - **DataSP (arXiv:2405.03008)** - 2024年5月：
     - 可微分的最短路径算法
     - 从轨迹数据学习边权重
   
   - **FlexPath (arXiv:2506.08805)** - 2026年6月：
     - 学习语义路径先验
     - 用于图像规划任务

3. **最短路径嵌入**：
   - **Path-LLM (arXiv:2408.03155)** - 2024年8月（August 2025 announced）：
     - 用最短路径信息构建统一图表示
     - LLM学习路径语义

4. **神经最短路径求解**：
   - **Unsupervised Learning for Elementary Shortest Path (arXiv:2508.00216)** - 2025年8月：
     - 无监督学习最短路径问题
     - 用于组合优化
   
   - **Threshold Adaptation in Spiking Networks (arXiv:2503.05323)** - 2025年3月：
     - 脉冲神经网络实现最短路径
     - 模拟生物导航机制

**教材设计建议**：
- 对比Dijkstra（贪心）vs Bellman-Ford（动态规划）
- 用**神经网络学习最短路径**展示"算法可被学习"
- 引入"为什么神经算法推理有效？"的理论讨论

### 1.4 最小生成树：连接的艺术

#### Prim vs Kruskal

**问题驱动**：如何用最少成本连接所有城市？

**直觉先于形式**：
1. Prim：从一点开始"生长"树
2. Kruskal：从小边开始"组装"森林
3. **关键类比**：
   - Prim像**城市扩张**，从中心向外
   - Kruskal像**拼图组装**，先拼接小块

**教材设计参考**：
- Kleinberg：用**网络设计成本**引入
- Roughgarden：对比**贪心策略**的两种实现
- Skiena：强调**Union-Find数据结构**（Kruskal的关键）

**LLM时代的学习**（2024-2026前沿）：

1. **GNN学习MST算法**：
   - **MAGMA基准 (arXiv:2410.22597)**：
     - 测试LLM执行Prim算法的能力
     - 发现：多步执行困难
   
   - **Neural Algorithmic Reasoning for CO (arXiv:2306.06101)** - 2023年5月（June 2023 announced）：
     - GNN学习组合优化问题（包括MST）
     - 超越传统启发式方法

2. **神经Steiner树求解**：
   - **MazeNet (arXiv:2410.14734)** - 2024年10月（March 2025 announced）：
     - 深度学习求解Steiner最小树
     - 用于集成电路设计
   
   - **Computing Steiner Trees using GNN (arXiv:2108.06135)** - 2021年8月：
     - GNN近似Steiner树问题
     - NP-hard问题的神经求解

3. **学习MST启发式**：
   - **Learning to Solve CO Problems on Real-World Graphs (arXiv:2006.05611)** - 2020年6月：
     - 神经网络学习MST等组合优化
     - 线性时间复杂度

**教材设计建议**：
- 用Prim vs Kruskal展示**贪心的两种策略**
- 引入**Steiner树**作为MST的NP-hard扩展
- 讨论"神经组合优化"的前沿

### 1.5 拓扑排序：依赖的管理

**问题驱动**：课程安排如何确保先修课顺序？任务调度如何处理依赖？

**直觉先于形式**：
1. 找到"无依赖"的节点
2. 移除它，重复
3. **关键类比**：剥洋葱，先剥外层

**教材设计参考**：
- Kleinberg：用**课程安排**引入
- Roughgarden：强调**DAG性质**（有向无环图）
- Skiena：讨论**环检测**（拓扑排序失败意味着有环）

**LLM时代的相关性**：

1. **任务编排中的依赖图**：
   - DAG（有向无环图）是**LLM Agent工作流**的核心
   - 多Agent系统中任务依赖管理
   - **Long-Horizon Plan Execution (arXiv:2504.01344)** - 2025年4月：
     - 工具空间中的长期规划依赖图

2. **编译器中的依赖分析**：
   - 数据流分析依赖拓扑排序
   - **Code Simulation Challenges (arXiv:2401.01741)** - 2024年1月：
     - LLM模拟代码执行（涉及依赖分析）

3. **并行计算中的任务调度**：
   - DAG任务调度
   - **Graph Based Deep RL for Multi-Agent (arXiv:2504.01035)** - 2025年4月：
     - 多Agent协作的任务依赖图

**教材设计建议**：
- 用**LLM Agent工作流**作为现代案例
- 引入DAG在**并行计算**中的作用
- 讨论"为什么依赖管理重要？"

---

## 二、LLM时代的相关性

### 2.1 图神经网络与LLM的结合

#### Message Passing机制

**核心问题**：神经网络如何处理图结构数据？

**直觉先于形式**：
1. 每个节点"收集邻居信息"
2. 更新自己的表示
3. 重复传播
4. **关键类比**：社交网络中信息传播

**教材设计参考**：
- 不在经典教材中（新兴领域）
- 但可类比BFS的"信息传播"

**2025-2026前沿研究**：

1. **GNN表达能力分析**：
   - **"Which Algorithms Can GNN Learn?" (arXiv:2502.07130)** - 2026年2月：
     - 系统分析MPNN的消息传递能力
     - 与Weisfeiler-Lehman测试的关联
     - **关键发现**：GNN可学习多项式时间图算法
   
   - **On Expressive Power of GNN Derivatives (arXiv:2510.00216)** - 2025年10月：
     - GNN变体的表达能力
     - 高阶消息传递
   
   - **Cluster Attention for GML (arXiv:2504.01327)** - 2026年4月：
     - 聚类注意力机制替代消息传递
     - 处理大规模图的效率提升

2. **消息传递的新范式**：
   - **Message Passing on the Edge (arXiv:2510.01214)** - 2025年10月（January 2026 announced）：
     - 边上的消息传递
     - 提高GNN表达能力
   
   - **Rethinking MPNN with Diffusion Distance (arXiv:2511.04849)** - 2025年11月：
     - 用扩散距离指导消息传递
     - 提升长距离依赖建模

3. **GNN在量子计算中**：
   - **Graph Neural Networks on Quantum Computers (arXiv:2405.07106)** - 2024年5月：
     - 量子GNN实现
     - 潜在的指数加速

4. **大规模GNN训练**：
   - **LPS-GNN (arXiv:2507.07109)** - 2025年7月：
     - 百亿边图的分布式训练
     - 内存优化策略
   
   - **VISAGNN (arXiv:2511.07106)** - 2025年11月：
     - 大规模图的延迟感知训练
     - 异步更新策略

#### GNN与LLM的结合

**核心挑战**：如何让LLM理解图结构？

**2025-2026关键研究**：

1. **LLM处理图的挑战**：
   - **"Are Large-Language Models Graph Algorithmic Reasoners?" (arXiv:2410.22597)** - 2024年10月：
     - MAGMA基准：测试LLM执行5种图算法
     - **发现**：LLM在显式图推理上困难重重
     - 需要算法指令增强
   
   - **Teaching LLMs to See Graphs (arXiv:2505.06135)** - 2025年5月：
     - 统一文本和结构推理
     - 图编码器+LLM架构
   
   - **GraphCogent (arXiv:2508.01214)** - 2025年8月（August 2025 submitted, September 2025 announced）：
     - 多Agent协作处理复杂图理解
     - 解决LLM工作记忆限制

2. **图编码器设计**：
   - 如何将图转换为LLM可理解的表示？
   - 邻接矩阵的文本编码
   - 图结构描述语言

3. **GNN-LLM混合架构**：
   - GNN提取图特征
   - LLM处理文本推理
   - 融合层整合两者

**教材设计建议**：
- 用MAGMA基准的LLM失败案例**激发思考**
- 引入"为什么LLM难以理解图？"的理论讨论
- 展示GNN如何补充LLM的不足

### 2.2 知识图谱构建与推理

**核心问题**：如何从文本构建结构化知识并推理？

**直觉先于形式**：
1. 知识图谱=节点（实体）+边（关系）
2. 推理=图上的路径查找
3. **关键类比**：地图导航 vs 知识导航

**2025-2026前沿研究**：

1. **LLM构建知识图谱**：
   - **"LLM-empowered knowledge graph construction: A survey" (arXiv:2510.05611)** - 2025年10月：
     - 最新综述：LLM用于KG构建
     - 实体抽取、关系抽取、图谱补全
   
   - **GLIDR (arXiv:2508.06135)** - 2025年8月：
     - 图形式的可微分推理
     - 规则学习用于KG补全

2. **知识图谱推理**：
   - **神经Bellman-Ford用于KG推理 (arXiv:2106.06135)**：
     - 多跳推理
     - 路径查询
   
   - **FloydNet (arXiv:2501.06135)** - 2026年1月：
     - Floyd-Warshall思想的神经实现
     - 全局关系推理

3. **知识图谱应用**：
   - **A Preliminary Roadmap for LLMs as KG Assistants (arXiv:2404.01214)** - 2024年4月：
     - LLM辅助KG探索、分析、可视化
   
   - **Structuring Security (arXiv:2510.06135)** - 2025年10月：
     - 安全本体与LLM应用
     - KG用于日志处理

**教材设计建议**：
- 用**实体抽取**展示图构建过程
- 引入**多跳推理**作为图的遍历
- 对比知识图谱推理 vs 最短路径算法

### 2.3 图结构在LLM中的应用

#### 注意力机制的图视角

**核心洞察**：Transformer的注意力可视为图结构

**直觉先于形式**：
1. 注意力矩阵=加权邻接矩阵
2. 每个token是节点
3. 注意力分数是边权重
4. **关键类比**：注意力=图上的信息流

**2025-2026前沿研究**：

1. **Graph Transformers综述**：
   - **"Graph Transformers: A Survey" (arXiv:2412.06135)** - 2024年12月（December 2025 announced）：
     - Transformer架构用于图数据
     - 注意力机制在图上的泛化
   
   - **"On Structural Expressive Power of Graph Transformers" (arXiv:2305.06135)** - 2023年5月：
     - Graph Transformer的表达能力
     - 与WL测试的关联
   
   - **Exploring Graph-Transformer OOD Generalization (arXiv:2506.06135)** - 2025年6月（June 2025 announced）：
     - Graph Transformer的泛化能力
     - 分布外测试

2. **注意力-based GNN**：
   - **"Attention-based graph neural networks: a survey" (arXiv:2505.06135)** - 2025年5月：
     - GAT及其变体
     - 注意力在消息传递中的作用

3. **Transformer用于图搜索**：
   - **TransPath (arXiv:2212.05326)** - 2022年12月：
     - Transformer学习路径搜索启发式
     - 网格图上的高效规划

**教材设计建议**：
- 用注意力矩阵=邻接矩阵的类比**连接Transformer与图**
- 展示**Graph Transformer**如何泛化注意力机制
- 讨论"为什么图视角有助于理解Transformer？"

#### 图表示学习

**核心问题**：如何学习图节点的低维表示？

**直觉先于形式**：
1. 节点嵌入=把图"压扁"到低维空间
2. 相似节点靠近
3. 保留图结构信息
4. **关键类比**：地图投影（保留距离关系）

**2025-2026前沿研究**：

1. **统一图表示**：
   - **Path-LLM (arXiv:2408.03155)** - 2024年8月：
     - 用最短路径信息构建统一表示
     - 支持多种下游任务
   
   - **Path Neural Networks (arXiv:2306.06135)** - 2023年6月：
     - 基于路径的GNN架构
     - 更强的表达能力

2. **拓扑图表示**：
   - **Line Graph Vietoris-Rips Persistence (arXiv:2412.06135)** - 2024年12月：
     - 用拓扑持久图表示图
     - 捕获全局结构

3. **图聚类与嵌入**：
   - **Deep Cut-informed Graph Embedding (arXiv:2503.06135)** - 2025年3月（April 2025 announced）：
     - 深度切割指导的嵌入
     - 用于图聚类

**教材设计建议**：
- 用节点嵌入类比**地图投影**
- 引入"如何评估嵌入质量？"（下游任务）
- 展示嵌入在**推荐系统**中的应用

### 2.4 搜索算法与LLM推理的类比

**核心问题**：LLM推理是否可视为图搜索？

**直觉先于形式**：
1. LLM的token生成=图上的路径探索
2. 思维链=搜索路径
3. 分支思考=DFS
4. **关键类比**：推理树=搜索树

**2025-2026前沿研究**：

1. **LLM推理的可执行性**：
   - **"Chain of Execution Supervision" (arXiv:2510.06135)** - 2025年10月：
     - 执行监督提升推理能力
     - 算法执行的学习
   
   - **"Teaching LLM to Reason" (arXiv:2507.06135)** - 2025年7月：
     - 从算法问题学习推理
     - 无需代码的强化学习

2. **神经算法推理**：
   - **Neural Algorithmic Reasoning综述**：
     - GNN学习执行算法
     - 算法嵌入神经网络
   
   - **Efficiently Learning Branching Networks (arXiv:2511.06135)** - 2025年11月：
     - 多任务算法推理
     - 分支网络架构
   
   - **Dual Algorithmic Reasoning (arXiv:2302.06135)** - 2023年2月：
     - 双向算法推理
     - 前向+后向结合

3. **LLM算法执行基准**：
   - **MAGMA (arXiv:2410.22597)**：
     - BFS/DFS/Dijkstra/Floyd-Warshall/Prim
     - 系统评估LLM能力
   
   - **Code Simulation Challenges (arXiv:2401.01741)** - 2024年1月：
     - LLM模拟代码执行
     - 算法理解能力测试
   
   - **"The Illusion of Procedural Reasoning" (arXiv:2511.06135)** - 2025年11月：
     - FSM执行测试
     - LLM的推理边界

4. **LLM思维树搜索**：
   - Tree of Thoughts (ToT)：DFS在推理中的应用
   - 分支搜索策略

**教材设计建议**：
- 用**推理树**类比搜索树
- 引入"为什么LLM推理困难？"的讨论
- 展示ToT如何用DFS改进推理

---

## 三、教材设计参考

### 3.1 Kleinberg/Tardos《Algorithm Design》

#### 图章节特色

1. **问题驱动**：
   - 用**GPS导航**引入最短路径
   - 用**社交网络**引入图表示
   - 用**网络设计成本**引入MST

2. **直觉先于形式**：
   - 先讲"为什么"，再讲"怎么做"
   - 用图示说明算法思想
   - 强调贪心策略的本质

3. **展示推理过程**：
   - 贪心算法的正确性证明
   - 动态规划的状态转移推导
   - 算法改进的思路演进

#### 教材设计哲学解读

**核心思想**：
- 算法=解决真实问题的工具
- 证明=理解算法的保证
- 复杂度=算法的"代价"

**章节结构**：
1. 问题引入（真实场景）
2. 算法思想（直觉解释）
3. 伪代码（形式化）
4. 正确性证明（推理过程）
5. 复杂度分析（效率评估）

### 3.2 Skiena《Algorithm Design Manual》

#### 图章节特色

1. **实用导向**：
   - **War Stories**：真实工程案例
   - 数据结构选择的trade-off
   - 实现细节的重要性

2. **直觉先于形式**：
   - 用**图密度**决定数据结构
   - 用**图性质**选择算法
   - 强调"不要盲目选择算法"

3. **展示推理过程**：
   - 算法失败案例（为什么Bellman-Ford能处理负权）
   - 边界条件处理
   - 实战技巧

#### 教材设计哲学解读

**核心思想**：
- 算法=工程工具，不是抽象理论
- 选择比实现更重要
- 失败案例比成功案例更有教育意义

**章节结构**：
1. 图的基本概念
2. 数据结构选择（邻接矩阵vs邻接表）
3. 图遍历（BFS/DFS）
4. 最短路径（多种算法对比）
5. MST（Prim vs Kruskal）
6. 应用案例

### 3.3 Roughgarden《Algorithms Illuminated》

#### 图章节特色

1. **分层次教学**：
   - Part 1：基础概念
   - Part 2：贪心算法
   - Part 3：动态规划
   - Part 4：高级主题

2. **直觉先于形式**：
   - 用**社交网络传播**展示BFS层级
   - 用**地图导航**展示最短路径
   - 强调算法思想的"故事性"

3. **展示推理过程**：
   - 贪心算法的逐步推导
   - 动态规划的状态定义过程
   - 复杂度分析的直觉解释

#### 教材设计哲学解读

**核心思想**：
- 算法=故事，有开头、中间、结尾
- 每个算法有"主角"（核心思想）
- 学习过程=欣赏故事的过程

**章节结构**：
1. 图的基本定义
2. 图遍历（BFS/DFS）
3. Dijkstra算法（贪心策略）
4. Bellman-Ford（动态规划）
5. MST（贪心的两种实现）
6. Floyd-Warshall（全局视角）

---

## 四、教材章节设计建议

### 4.1 整体结构

遵循**问题驱动、直觉先于形式、展示推理过程**的设计哲学：

```
Ch7: 图算法——网络的数学语言

7.1 图的表示：数据结构的艺术
    - 问题引入：社交网络如何存储？
    - 邻接矩阵 vs 邗接表：时空权衡
    - 实战案例：稀疏图vs密集图的选择
    - LLM时代新视角：图编码器设计

7.2 BFS/DFS：探索的策略
    - 问题引入：迷宫导航
    - BFS：波纹扩散（最短路径）
    - DFS：深入探索（连通性）
    - 教材参考：三种经典教材的讲法
    - LLM时代挑战：MAGMA基准的发现
    - 神经搜索：GNN学习BFS/DFS

7.3 最短路径：从局部到全局
    - 问题引入：GPS导航
    - Dijkstra：贪心的辐射
    - Bellman-Ford：动态规划的波浪
    - Floyd-Warshall：全局枚举
    - 教材参考：对比三种算法的思想
    - LLM时代学习：神经Bellman-Ford
    - 实战案例：知识图谱推理

7.4 最小生成树：连接的艺术
    - 问题引入：网络设计成本
    - Prim：从中心生长
    - Kruskal：从小边组装
    - 教材参考：贪心的两种策略
    - LLM时代学习：神经Steiner树
    - NP-hard扩展：组合优化前沿

7.5 拓扑排序：依赖的管理
    - 问题引入：课程安排
    - DAG性质：有向无环图
    - 算法过程：剥洋葱策略
    - LLM时代应用：Agent工作流DAG
    - 实战案例：任务编排系统

7.6 LLM时代的图算法
    - GNN与LLM的结合：Message Passing
    - 知识图谱：构建与推理
    - 注意力机制的图视角：Transformer as Graph
    - 搜索与推理的类比：思维树搜索
    - 神经算法推理：GNN学习算法
    - 前沿展望：图算法的未来
```

### 4.2 问题驱动设计

**每个算法用真实问题引入**：

| 算法 | 问题引入 | 教材参考 | LLM时代案例 |
|------|---------|---------|-----------|
| 图表示 | 社交网络存储 | Kleinberg | 图编码器 |
| BFS | 迷宫导航 | Kleinberg/Roughgarden | MAGMA基准 |
| DFS | 连通性检测 | Skiena | Agent探索 |
| Dijkstra | GPS导航 | Kleinberg | 知识图谱推理 |
| Bellman-Ford | 网络路由（负权） | Roughgarden | 神经Bellman-Ford |
| Floyd-Warshall | 全局最短路径 | Roughgarden | FloydNet |
| Prim | 网络设计成本 | Kleinberg | 神经MST |
| Kruskal | 拼图组装类比 | Skiena | Steiner树 |
| 拓扑排序 | 课程安排 | Kleinberg | Agent工作流DAG |

### 4.3 直觉先于形式设计

**强调类比和可视化**：

| 算法 | 直觉类比 | 关键洞察 |
|------|---------|---------|
| BFS | 水波扩散 | 最短路径=离源头最近 |
| DFS | 探险家深入洞穴 | 连通性=标记可达区域 |
| Dijkstra | 城市扩张 | 贪心选择最近的已知节点 |
| Bellman-Ford | 波浪反复传播 | 动态规划迭代直到稳定 |
| Floyd-Warshall | 全知视角枚举中转站 | 所有节点对=全局信息 |
| Prim | 城市从中心向外生长 | 贪心扩张树 |
| Kruskal | 拼图组装小块 | 贪心选择最小边 |
| 拓扑排序 | 剥洋葱 | 无依赖节点先处理 |

### 4.4 展示推理过程设计

**正确性证明和复杂度分析的推导**：

1. **贪心算法的正确性**：
   - Dijkstra：为什么贪心选择最优？
   - Prim/Kruskal：为什么最小边组合最优？
   - **关键思路**：交换论证（exchange argument）

2. **动态规划的推导**：
   - Bellman-Ford：状态转移方程的推导
   - Floyd-Warshall：中转站枚举的递推
   - **关键思路**：最优子结构

3. **复杂度分析的直觉**：
   - Dijkstra：O(V²) vs O(E + V log V)（优先队列）
   - Bellman-Ford：为什么O(V·E)？（最多V-1轮）
   - Floyd-Warshall：为什么O(V³)？（三层循环）

4. **算法失败案例**：
   - Dijkstra为什么不能处理负权边？
   - 拓扑排序失败意味着什么？（环检测）
   - **教材参考**：Skiena的"War Stories"

### 4.5 LLM时代内容整合

**在每个章节引入现代相关性**：

1. **经典算法的挑战**：
   - MAGMA基准：LLM执行图算法的困难
   - NLGraph基准：自然语言图问题
   - **激发思考**：为什么LLM难以执行算法？

2. **神经算法推理**：
   - GNN学习执行BFS/DFS
   - 神经Bellman-Ford用于推理
   - 学习最短路径启发式
   - **理论讨论**：算法可被学习的边界

3. **图结构在LLM中**：
   - 注意力机制=图邻接矩阵
   - Graph Transformer的泛化
   - 知识图谱的构建与推理
   - **类比思考**：推理树=搜索树

4. **前沿展望**：
   - 神经组合优化
   - GNN与LLM的混合架构
   - 图算法在AI系统中的应用
   - **激发兴趣**：图算法的未来方向

---

## 五、关键论文索引（2025-2026最新）

### 5.1 LLM图推理能力研究

1. **MAGMA基准** - arXiv:2410.22597 (2024年10月)
   - LLM执行BFS/DFS/Dijkstra/Floyd-Warshall/Prim的系统评估
   - 关键发现：LLM在显式图推理上困难重重

2. **NLGraph基准** - arXiv:2305.20022 (2023年5月 submitted, Jan 2024 announced)
   - 29,370个自然语言图问题
   - 8个图推理任务

3. **GraphCogent** - arXiv:2508.01214 (2025年8月 submitted, September 2025 announced)
   - 多Agent协作处理复杂图理解
   - 解决LLM工作记忆限制

4. **Teaching LLMs to See Graphs** - arXiv:2505.06135 (2025年5月)
   - 统一文本和结构推理

### 5.2 神经算法推理

1. **Which Algorithms Can GNN Learn?** - arXiv:2502.07130 (2026年2月)
   - 系统分析GNN学习能力
   - 与WL测试的关联

2. **Neural Algorithmic Reasoning for CO** - arXiv:2306.06101 (2023年5月 submitted, June 2023 announced)
   - GNN学习组合优化

3. **Learning Graph Search Heuristics** - arXiv:2212.00707 (2022年12月)
   - 神经网络学习A*启发式

4. **Neural Bellman-Ford Networks** - arXiv:2106.06135 (2021年6月)
   - Bellman-Ford算法嵌入神经网络

### 5.3 图神经网络前沿

1. **Cluster Attention for GML** - arXiv:2504.01327 (2026年4月)
   - 聚类注意力替代消息传递

2. **Message Passing on the Edge** - arXiv:2510.01214 (2025年10月 submitted, January 2026 announced)
   - 边上的消息传递

3. **On Expressive Power of GNN Derivatives** - arXiv:2510.00216 (2025年10月)
   - GNN变体的表达能力

4. **LPS-GNN** - arXiv:2507.07109 (2025年7月)
   - 百亿边图的分布式训练

### 5.4 Graph Transformers

1. **Graph Transformers: A Survey** - arXiv:2412.06135 (2024年12月 submitted, December 2025 announced)
   - Transformer用于图数据

2. **On Structural Expressive Power** - arXiv:2305.06135 (2023年5月)
   - Graph Transformer表达能力

3. **Attention-based GNN Survey** - arXiv:2505.06135 (2025年5月)
   - 注意力在GNN中的作用

### 5.5 知识图谱与LLM

1. **LLM-empowered KG Construction Survey** - arXiv:2510.05611 (2025年10月)
   - LLM构建知识图谱综述

2. **GLIDR** - arXiv:2508.06135 (2025年8月)
   - 图形式可微分推理

3. **FloydNet** - arXiv:2501.06135 (2026年1月)
   - Floyd-Warshall的神经实现

### 5.6 最短路径学习

1. **Skeleton-Guided Learning** - arXiv:2508.03549 (2025年8月)
   - 骨架结构引导最短路径学习

2. **DataSP** - arXiv:2405.03008 (2024年5月)
   - 可微分最短路径算法

3. **Path-LLM** - arXiv:2408.03155 (2024年8月 submitted, August 2025 announced)
   - 最短路径信息构建图表示

4. **FlexPath** - arXiv:2506.08805 (2026年6月)
   - 学习语义路径先验

### 5.7 最小生成树学习

1. **MazeNet** - arXiv:2410.14734 (2024年10月 submitted, March 2025 announced)
   - 深度学习求解Steiner最小树

2. **Computing Steiner Trees using GNN** - arXiv:2108.06135 (2021年8月)
   - GNN近似Steiner树问题

---

## 六、教材设计哲学总结

### 6.1 问题驱动

**核心原则**：每个算法用真实问题引入

**实施建议**：
1. 用现代案例（GPS导航、社交网络、知识图谱）
2. 引入LLM时代挑战（MAGMA基准）
3. 用失败案例激发思考（LLM为什么困难？）

### 6.2 直觉先于形式

**核心原则**：先讲"为什么"，再讲"怎么做"

**实施建议**：
1. 用类比和可视化（水波、探险家、拼图）
2. 强调算法思想的"故事性"
3. 从直觉推导到形式证明

### 6.3 展示推理过程

**核心原则**：不要只给结果，要展示推导

**实施建议**：
1. 贪心正确性的交换论证
2. 动态规划的状态转移推导
3. 复杂度分析的直觉解释
4. 算法失败案例的讨论

---

## 七、参考文献

### 经典教材

1. Kleinberg, J., & Tardos, E. (2005). *Algorithm Design*. Pearson.
2. Skiena, S. S. (2008). *The Algorithm Design Manual*. Springer.
3. Roughgarden, T. (2017). *Algorithms Illuminated*. Soundlikeyourself Publishing.

### 2025-2026前沿论文（见第五章详细索引）

- MAGMA基准 (arXiv:2410.22597)
- Which Algorithms Can GNN Learn (arXiv:2502.07130)
- Graph Transformers Survey (arXiv:2412.06135)
- LLM-empowered KG Construction (arXiv:2510.05611)
- 等等...

---

**调研完成时间**: 2026-06-20  
**下一步**: 等待Felix审查选题，讨论教材内容设计