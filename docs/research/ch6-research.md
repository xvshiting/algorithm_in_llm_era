# Ch6 动态规划 - 论文调研报告

**调研时间**: 2026-06-20 16:15
**调研者**: Planner
**教材**: 《算法分析与设计：大模型时代的算法思维》
**调研标准**: 浏览器调研 + zettel 复用 + 具体数据 + 深入分析

---

## 一、已有 Zettel 知识复用

### 1.1 核心 Zettel 卡片

| Zettel ID | 标题 | 核心观点 |
|-----------|------|----------|
| Z-022 | 动态规划方法论 | DP 三步法 + LLM KV-Cache 同构 |
| Z-031 | 编辑距离与DP统一框架 | 可插拔代价函数解决一族问题 |
| Z-032 | DP最优性原理与失败条件 | 最优性原理 ↔ MDP Markov假设 |
| Z-039 | 子问题图 | 子问题 DAG，反拓扑序求值 |
| Z-040 | 最优子结构与剪贴证明 | 正确性保证方法论 |

### 1.2 已建立的核心叙事

**大纲核心观点**:
> DP 记忆化 ↔ KV-cache 是同构的——存储已计算的公共前缀。
> 但识别最优子结构需要人的判断，这是机器做不了的。

---

## 二、最新论文调研（2025-2026）

### 2.1 KV-Cache 与 DP 记忆化的直接关联

| 论文 | arXiv | 核心发现 | 与 DP 关联 |
|------|-------|----------|-----------|
| **Crystal-KV** | 2026-01 | Answer-First Principle for CoT LLMs | KV-Cache 管理 = 记忆化优化 |
| **ZoomR** | 2026-04 | Multi-Granularity KV Retrieval | 多粒度记忆化检索 |
| **ObjectCache** | 2026-05 | Layerwise Object-Storage Retrieval | KV-Cache 复用 = 子问题复用 |
| **ReST-KV** | 2026-05 | Robust KV Cache Eviction | Eviction = 记忆化清理策略 |
| **MixKVQ** | 2025-12 | Query-Aware Mixed-Precision | 精度优化 = 状态压缩 |

**核心洞察**:
```
┌─────────────────────────────────────────────────────────────────────┐
│  KV-Cache = DP 记忆化的现代实现                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  DP 记忆化                          KV-Cache                       │
│  ├── memo[i] 存储 dp[i]            ├── KV-Cache 存储 attention     │
│  ├── 子问题复用                    ├── prefix reuse               │
│  ├── 按需计算      ├── incremental decoding       │
│  └── 状态清理                      └── KV eviction                │
│                                                                     │
│  关键同构:                                                          │
│  - 共享前缀复用 = 子问题重叠                                       │
│  - 自底向上 DP = 预填充 KV-Cache                                   │
│  - 状态空间爆炸 = KV 内存瓶颈                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 CoT 推理与 DP/递归的关系

| 论文 | arXiv | 核心发现 | 与 DP 关联 |
|------|-------|----------|-----------|
| **Divide-and-Conquer CoT** | 2026-01 | RL for Parallel Reasoning | CoT = 递归展开 |
| **Breaking the Reward Barrier** | 2026-05 | ToT Speculative Exploration | ToT = 回溯搜索 |
| **The Periodic Table of LLM Reasoning** | 2026-06 | Reasoning Paradigms Taxonomy | 系统化推理分类 |
| **Long CoT Compression** | 2026-02 | Fine-Grained Group Policy | CoT 压缩 = 状态压缩 |
| **Ada-RS** | 2026-02 | Adaptive Rejection Sampling | 拒绝采样 = 分支剪枝 |

**核心洞察**:
```
┌─────────────────────────────────────────────────────────────────────┐
│  CoT/ToT = DP/回溯的神经实现                                        │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Chain-of-Thought:                                                  │
│  ├── Linear reasoning path                                         │
│  ├── 类似于递归展开                                                │
│  └── 不存储中间状态（无记忆化）                                    │
│                                                                     │
│  Tree-of-Thought:                                                   │
│  ├── 多分支探索                                                     │
│  ├── 类似于回溯搜索                                                │
│  ├── 可剪枝 (rejection sampling)                                   │
│  └── 状态保存 = 记忆化                                             │
│                                                                     │
│  Divide-and-Conquer CoT:                                            │
│  ├── 并行推理                                                       │
│  ├── 类似于分治 DP                                                 │
│  └── latency reduction                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 DP 理论进展

| 论文 | arXiv | 核心发现 |
|------|-------|----------|
| **Efficiently Representing Algorithms with CoT Transformers** | 2026-06 | Transformer 可模拟 Turing machines 执行 DP |
| **Automated Tail Bound Analysis for PRRs** | 2023-05 | 随机算法尾概率自动化分析 |
| **The Probability Spaces of QuickSort** | 2025-06 | QuickSort 概率空间形式化 |

---

## 三、深入分析：DP ↔ LLM 的双向映射

### 3.1 正向映射：DP 概念在 LLM 中的体现

| DP 概念 | LLM 对应 | 论文证据 |
|---------|----------|----------|
| **记忆化** | KV-Cache prefix reuse | ObjectCache, Crystal-KV |
| **子问题图** | Token DAG dependency | Attention DAG |
| **最优子结构** | Markov assumption | Z-032, RLHF |
| **状态压缩** | KV quantization | MixKVQ, PackKV |
| **剪贴证明** | Verification step | CoT verification |

### 3.2 反向映射：LLM 如何改变 DP

| LLM 技术 | 对 DP 的影响 |
|----------|--------------|
| **Attention** | 软依赖图（取代硬 DAG） |
| **CoT** | 自动识别子问题结构 |
| **RLHF** | 最优性原理的实证 |
| **KV-Cache** | 记忆化的工程实现 |

### 3.3 关键差异

| 维度 | 传统 DP | LLM "DP" |
|------|---------|----------|
| **状态定义** | 人手动设计 | LLM 隐式编码 |
| **最优性** | 数学保证 | 经验验证 |
| **记忆化** | 精确复用 | 软复用（attention） |
| **状态空间** | 多项式有界 | 线性增长（token数） |

---

## 四、教学设计建议

### 4.1 核心叙事强化

**现有叙事**（大纲）:
> DP 记忆化 ↔ KV-cache 是同构的

**强化叙事**（基于调研）:
```
┌─────────────────────────────────────────────────────────────────────┐
│  DP 是算法时代的"缓存思维"，LLM 是神经时代的"记忆化实现"          │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  传统 DP:                                                           │
│  ├── 人工识别最优子结构                                            │
│  ├── 数学证明正确性                                                │
│  └── 精确记忆化                                                    │
│                                                                     │
│  LLM "DP":                                                          │
│  ├── 隐式编码状态空间                                              │
│  ├── 经验验证效果                                                  │
│  ├── KV-Cache 记忆化                                               │
│  └── CoT 自动展开递归                                              │
│                                                                     │
│  教学目标:                                                          │
│  ├── 理解 DP 的算法本质                                            │
│  ├── 认识 LLM 中的 DP 现象                                         │
│  └── 掌握两者之间的同构与差异                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 新增案例

**案例 1: KV-Cache 作为记忆化**
- Crystal-KV (2026-01) 的 Answer-First Principle
- 展示 prefix reuse 如何对应子问题复用

**案例 2: CoT 作为递归展开**
- Divide-and-Conquer CoT (2026-01)
- 展示并行推理如何对应分治 DP

**案例 3: ToT 作为回溯搜索**
- Breaking the Reward Barrier (2026-05)
- 展示 speculative exploration 如何对应分支限界

### 4.3 练习设计（基于调研）

**层次一（基础）**:
1. 实现 KV-Cache 的记忆化逻辑（prefix reuse）
2. 对比 DP 记忆化与 KV-Cache 的状态清理策略

**层次二（LLM 协同）**:
3. 让 LLM 为 DP 问题生成 CoT，识别子问题结构
4. 验证 LLM 生成的递推式是否符合最优子结构

**层次三（Agent 设计）**:
5. 设计 DP-to-CoT 转换器：输入 DP 问题，输出 CoT prompt
6. 实现 KV-Cache eviction 策略优化（基于 DP 子问题图）

---

## 五、论文引用清单

### 5.1 必读论文

| 论文 | arXiv | 价值 |
|------|-------|------|
| Crystal-KV: Answer-First Principle | 2026-01 | KV-Cache ↔ DP 记忆化 |
| Divide-and-Conquer CoT | 2026-01 | CoT ↔ 递归展开 |
| The Periodic Table of LLM Reasoning | 2026-06 | 推理范式系统化 |

### 5.2 补充论文

| 论文 | arXiv | 价值 |
|------|-------|------|
| ObjectCache: Layerwise Retrieval | 2026-05 | 子问题复用 |
| ZoomR: Multi-Granularity KV | 2026-04 | 多粒度记忆化 |
| Breaking the Reward Barrier (ToT) | 2026-05 | 回溯搜索 |

---

## 六、Zettel 扩展建议

基于调研，建议新增 Zettel 卡片：

| Zettel ID | 标题 | 来源 |
|-----------|------|------|
| Z-115 | KV-Cache作为DP记忆化 | Crystal-KV (2026-01) |
| Z-116 | CoT作为递归展开 | Divide-and-Conquer CoT (2026-01) |
| Z-117 | ToT作为回溯搜索 | Breaking the Reward Barrier (2026-05) |
| Z-118 | LLM推理范式周期表 | Periodic Table of LLM Reasoning (2026-06) |

---

_调研完成: 2026-06-20 16:20 - Planner_
