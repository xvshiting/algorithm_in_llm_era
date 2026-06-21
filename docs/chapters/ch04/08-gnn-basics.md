# 4.8 图神经网络基础

> "图神经网络将结构信息融入深度学习。"
> — 本章核心观点

---

## 学习目标

- 理解 GNN 的核心思想：消息传递
- 区分三种 GNN 架构（GCN、GAT、GraphSAGE）
- 理解 Node2Vec 如何将图结构编码为 embedding
- 理解 GNN 与 LLM 的连接点

---

## 为什么需要 GNN？

### 传统神经网络的局限

- **CNN**：处理网格数据（图像），固定邻域
- **RNN**：处理序列数据，固定顺序
- **图数据**：不规则结构，邻居数量变化，无固定顺序

### GNN 的核心思想

**消息传递（Message Passing）**：每个节点从邻居收集信息，聚合后更新自身表示。

```
节点 v 在第 l+1 层的表示：
h_v^(l+1) = UPDATE(h_v^(l), AGGREGATE({h_u^(l) : u ∈ N(v)}))

其中：
- N(v) 是 v 的邻居集合
- AGGREGATE 是聚合函数
- UPDATE 是更新函数
```

---

## 图卷积网络（GCN）

### 核心公式

```
h_v^(l+1) = σ(Σ_{u∈N(v)∪{v}} (1/√(d_u · d_v)) · W · h_u^(l))
```

### 解读

- **聚合**：求和邻居的特征
- **归一化**：1/√(d_u · d_v) 消除度的影响
- **线性变换**：W 是可学习参数
- **非线性**：σ 是激活函数（ReLU）

### 直觉

GCN 是对邻居特征的加权平均，权重由度决定。

### 实现（PyTorch 风格）

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GCNLayer(nn.Module):
    def __init__(self, in_features, out_features):
        super().__init__()
        self.W = nn.Parameter(torch.randn(in_features, out_features))
    
    def forward(self, h, adj):
        # h: [N, in_features]
        # adj: [N, N] 归一化邻接矩阵
        return F.relu(adj @ h @ self.W)
```

---

## 图注意力网络（GAT）

### 核心思想

用注意力机制学习邻居权重，而非固定的度归一化。

### 公式

```
α_vu = softmax(LeakyReLU(a^T [W h_v || W h_u]))

h_v^(l+1) = σ(Σ_{u∈N(v)} α_vu · W · h_u^(l))
```

### 解读

- **注意力系数**：α_vu 表示 u 对 v 的重要性
- **学习权重**：a 和 W 都是可学习参数
- **多头注意力**：可以有多组独立的注意力

### 优势

- 自适应权重
- 处理异构图（不同类型邻居重要性不同）

---

## GraphSAGE

### 核心思想

**采样 + 聚合**。对大图，不使用所有邻居，而是采样一部分。

### 算法步骤

```
1. 采样：对每个节点，随机采样固定数量的邻居
2. 聚合：用采样邻居的特征更新节点表示
3. 重复 1-2 多层
```

### 聚合方式

| 聚合方式 | 说明 |
|----------|------|
| Mean | 平均邻居特征 |
| Pool | 对邻居特征做 max-pooling |
| LSTM | 对邻居特征做序列建模 |

### 优势

- 可扩展到大图
- 可以归纳到未见过的节点（Inductive Learning）

---

## Node2Vec

### 核心思想

用随机游走生成节点序列，然后用 Skip-gram 学习节点 embedding。

### 随机游走策略

```
参数 p（返回参数）：控制回到上一个节点的概率
参数 q（进出参数）：控制向外探索 vs 向内收敛

q > 1：BFS-like（局部探索）
q < 1：DFS-like（全局探索）
p < 1：倾向于返回
p > 1：倾向于继续前进
```

### 算法步骤

```
1. 从每个节点开始随机游走，生成序列
2. 用 Skip-gram 训练 embedding
3. 输出每个节点的 embedding
```

### 应用

- 节点分类
- 链接预测
- 社区发现

---

## GNN 与 LLM 的连接

### 连接方式

| 方式 | 说明 |
|------|------|
| Embedding 作为上下文 | Node embedding → 拼接到 LLM 输入 |
| 图结构提示 | 图的文本描述 → LLM 输入 |
| GNN-LLM 协作 | GNN 处理结构，LLM 处理语义 |

### 应用场景

| 应用 | GNN 角色 | LLM 角色 |
|------|----------|----------|
| 知识图谱问答 | 图嵌入 | 生成答案 |
| 社交网络分析 | 用户嵌入 | 解释结果 |
| 分子性质预测 | 分子图嵌入 | 生成报告 |

### 当前研究前沿

- **LLMs+Graphs**: Graph-Native AI Systems（arXiv 2026-06）
- **GNN-as-Judge**: LLM + GNN 协作范式（arXiv 2026-03）
- **Teaching LLMs to See Graphs**: LLM 处理图结构（arXiv 2026-05）

---

## LLM 融合点

### 任务：解释 GNN 公式

```
让 LLM 解释 GCN 更新公式：

h_v^(l+1) = σ(Σ_{u∈N(v)∪{v}} (1/√(d_u · d_v)) · W · h_u^(l))

要求：
1. 解释每个符号的含义
2. 解释归一化系数的作用
3. 解释为什么聚合邻居信息有用
```

### 任务：设计 GNN 架构

```
场景：社交网络用户分类

数据：
- 用户特征：年龄、性别、兴趣向量（100 维）
- 图结构：好友关系

要求：
1. 选择 GNN 类型（GCN/GAT/GraphSAGE）
2. 解释选择理由
3. 设计网络结构
```

---

## 小结

**GNN 核心思想**：
- 消息传递：聚合邻居信息
- 结构信息融入深度学习

**三种架构**：
- GCN：度归一化聚合
- GAT：注意力加权聚合
- GraphSAGE：采样 + 聚合，可扩展

**Node2Vec**：
- 随机游走 + Skip-gram
- embedding 用于下游任务

**与 LLM 连接**：
- Embedding 作为上下文
- GNN-LLM 协作

---

## 参考文献

- [Kipf & Welling, ICLR 2017] Semi-Supervised Classification with Graph Convolutional Networks. https://arxiv.org/abs/1609.02907
- [Velickovic et al., ICLR 2018] Graph Attention Networks. https://arxiv.org/abs/1710.10903
- [Hamilton et al., NeurIPS 2017] Inductive Representation Learning on Large Graphs. https://arxiv.org/abs/1706.02216
- [Grover & Leskovec, KDD 2016] Node2Vec: Scalable Feature Learning for Networks. https://arxiv.org/abs/1607.00653
- [LLMs+Graphs, arXiv 2026] Toward Graph-Native, Synergistic AI Systems. https://arxiv.org/abs/2026.xxxxx