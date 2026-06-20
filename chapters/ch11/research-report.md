# Ch11 Transformer：注意力作为算法 - 调研报告

**调研时间**: 2026-06-20
**调研者**: Nova (Subagent)
**项目**: algorithm_in_llm_era 教材
**调研标准**: 算法视角（而非机器学习视角） + 前章节关联 + LLM时代新问题

---

## 一、教材设计哲学回顾

### 1.1 七个核心特征（参考 INBOX.md）

| 特征 | Transformer 算法视角应用 |
|------|-------------------------|
| **直觉先行** | 从"检索与检索结果融合"直觉引入注意力 |
| **人机协作** | 人判断注意力机制设计选择，LLM辅助实现验证 |
| **反对死记硬背** | 强调注意力作为算法组件的设计思维 |
| **问题驱动** | War Story：长文本理解、RAG检索融合 |
| **可视化教学** | 注意力矩阵热图、KV-cache增量可视化 |
| **算法对比** | RNN顺序处理 vs Transformer并行检索 |
| **跨章节连接** | Ch2缓存/KV-cache、Ch3查找/注意力检索、Ch4图传播/注意力传播、Ch10流式/滑动窗口 |

### 1.2 三阶培养目标

| 阶段 | Transformer 算法视角体现 |
|------|------------------------|
| **一阶：算法思维** | 理解注意力 = 带权检索 + 信息聚合，O(n²) 问题本质 |
| **二阶：人机协同** | 用 LLM 生成注意力变体实现，人工审查复杂度 |
| **三阶：Agent设计** | 设计长上下文管理 Agent，理解 KV-cache 空间约束 |

### 1.3 核心叙事定位

> Transformer 不是"一种神经网络"，而是**将检索和聚合算法化的范式**。
> 
> 传统算法通过显式规则查找信息，Transformer 通过**学习得到的权重函数**检索相关信息。
> 这是从"人工设计查找规则"到"学习检索策略"的转变。

---

## 二、注意力机制的算法解读

### 2.1 自注意力 = 带权检索 + 聚合

#### 核心直觉

**问题驱动**：如何从一段文本的每个位置，找到相关信息并聚合？

```
传统方案：
├── 查找表（Ch3）：精确匹配关键词 → 位置索引
├── 缓存（Ch2）：存储最近访问 → 加速复用
├── 图传播（Ch4）：邻居信息聚合 → 结构依赖

Transformer 方案：
├── Query：每个位置生成"查询向量"（我要什么信息）
├── Key：每个位置生成"键向量"（我有什么信息）
├── Value：每个位置生成"值向量"（信息的具体内容）
├── 注意力 = softmax(QK^T) → 检索权重
└── 输出 = 注意力 × V → 聚合结果
```

#### 与 Ch2/Ch3/Ch4 的算法对照

| 传统算法概念 | Transformer 对应 | 关系 |
|-------------|-----------------|------|
| **查找表索引** | Key 向量 | Key 是"可检索的签名" |
| **查询条件** | Query 向量 | Query 是"查找请求的编码" |
| **返回值** | Value 向量 | Value 是"检索结果的内容" |
| **匹配度排序** | QK^T 内积 | 内积 = 相似度度量 |
| **加权聚合** | 注意力 × V | 软检索（非硬选择） |
| **缓存更新** | KV-cache | 增量存储（见下文） |
| **图传播权重** | 注意力权重 | 信息流边权重 |

#### 算法本质：软检索 vs 硬检索

```
硬检索（Ch3 查找表）：
if exact_match(key, query):
    return value
else:
    return null

软检索（Transformer 注意力）：
weights = softmax(query × keys^T)  // 所有位置的权重
return weighted_sum(weights, values)  // 融合所有相关位置

关键区别：
├── 硬检索：要么匹配要么不匹配（二值）
├── 软检索：程度匹配（连续权重）
├── 硬检索：返回单一值
└── 软检索：返回聚合值（信息融合）
```

#### 设计哲学启示

> **检索规则的算法化 vs 学习化**
> 
> Ch3 教授的查找表是人工设计的匹配规则（关键词、哈希等）。
> Transformer 的 Q/K/V 是从数据中学习的匹配规则。
> 
> **关键问题**：学到的检索规则是否高效？是否可解释？

### 2.2 注意力的计算成本：O(n²) 问题

#### 为什么是 O(n²)？

**朴素注意力计算**：

```python
def naive_attention(Q, K, V):
    """
    Q: [n, d] - n 个查询向量
    K: [n, d] - n 个键向量  
    V: [n, d] - n 个值向量
    """
    # 计算所有 Q-K 对的内积
    scores = Q @ K.T  # [n, n] 矩阵 → O(n² · d) 计算
    
    # softmax 归一化
    weights = softmax(scores)  # [n, n] → O(n²)
    
    # 加权聚合
    output = weights @ V  # [n, d] → O(n² · d)
    
    return output

# 总复杂度：O(n² · d)
# 空间：存储 [n, n] 注意力矩阵 → O(n²)
```

#### O(n²) 的算法意义

**对照传统算法**：

| 算法 | 时间复杂度 | 是否有 O(n²) 瓶颈？ |
|------|-----------|-------------------|
| **查找表查找** | O(1) 或 O(log n) | 无（哈希或二分） |
| **线性扫描** | O(n) | 无 |
| **全对全比较** | O(n²) | 有（如编辑距离矩阵） |
| **图遍历** | O(V+E) | 无（稀疏连接） |
| **矩阵乘法** | O(n³) naïve, O(n^2.37) 优化 | 有但可优化 |

**Transformer 的 O(n²) 来自"全对全检索"**：
- 每个位置都检索所有位置
- 类似"全对全距离矩阵"计算
- 当 n=100k token 时，n²=10¹⁰，不可接受

#### 空间成本：注意力矩阵存储

```
序列长度 n = 10000
注意力矩阵大小 = 10000 × 10000 = 100M 元素
每个元素 float32 = 4 bytes
总空间 = 400MB

如果 n = 100000 → 40GB（单层注意力矩阵）
```

### 2.3 KV-cache 的算法本质

#### 增量计算：只算新位置

**问题驱动**：生成第 n+1 个 token 时，能否复用前 n 个的计算？

```
传统思路：重新计算所有注意力
├── 需要存储完整输入序列
├── 每生成一个 token，重新跑一遍
└── 时间成本：每次生成 O(n²)

KV-cache 思路：增量存储，复用历史
├── 存储 K[n], V[n]（第 n 个位置的键值）
├── 新 token 只计算 Q[n+1]
├── 查询已有 K/V，无需重算
└── 时间成本：每次生成 O(n)
```

#### 与 Ch2 缓存的算法对照

| Ch2 缓存特征 | KV-cache 对应 |
|-------------|---------------|
| **存储最近访问** | 存储已生成的 K/V |
| **避免重复计算** | 避免重复 K/V 计算 |
| **空间换时间** | O(n · d) 空间换 O(n² → n) 时间 |
| **过期策略** | 滑动窗口删除（见 2.4） |
| **缓存命中** | 所有历史 token 都是"命中" |

#### KV-cache 的数据结构

```python
class KVCache:
    """
    增量缓存数据结构
    空间复杂度：O(L · d · layers)
    其中 L=序列长度，d=隐藏维度，layers=层数
    """
    def __init__(self, layers, d_model):
        self.cache_K = [None] * layers  # 每层一个 K 缓存
        self.cache_V = [None] * layers  # 每层一个 V 缓存
        self.d = d_model
        self.seq_len = 0
    
    def append(self, layer, K_new, V_new):
        """增量添加新位置的 K/V"""
        if self.cache_K[layer] is None:
            self.cache_K[layer] = K_new
            self.cache_V[layer] = V_new
        else:
            # 拼接到现有缓存
            self.cache_K[layer] = concat(self.cache_K[layer], K_new)
            self.cache_V[layer] = concat(self.cache_V[layer], V_new)
        self.seq_len += 1
    
    def get(self, layer):
        """返回完整的 K/V 供注意力计算"""
        return self.cache_K[layer], self.cache_V[layer]
    
    def truncate(self, max_len):
        """滑动窗口：删除超出窗口的旧 K/V"""
        if self.seq_len > max_len:
            for layer in range(len(self.cache_K)):
                self.cache_K[layer] = self.cache_K[layer][-max_len:]
                self.cache_V[layer] = self.cache_V[layer][-max_len:]
            self.seq_len = max_len

# 空间增长分析
# n 个 token，d=4096，32 层
# 总空间 = n × 4096 × 32 × 2 (K+V) × 4 bytes
# = n × 1MB (大约)
# 100k token → 100MB KV-cache
```

#### 空间复杂度层次

| 缓存类型 | 空间复杂度 | 时间收益 |
|---------|-----------|----------|
| **无缓存** | O(1)（不存储） | 每次生成 O(n²) |
| **完整 KV-cache** | O(n · d) | 每次生成 O(n) |
| **滑动窗口 KV-cache** | O(W · d) | 每次生成 O(W) |
| **压缩 KV-cache** | O(k · d) | 每次生成 O(k)，但有信息损失 |

### 2.4 滑动窗口注意力：与 Ch10 的关联

#### 滑动窗口模型

**直接借用 Ch10 的滑动窗口概念**：

```
Ch10 滑动窗口数据流：
[a b c d e f g h i j ...]
        ↑ 窗口大小 W
只处理最近 W 个元素

Transformer 滑动窗口注意力：
Token [1...n]，每个 token 只关注最近 W 个
├── 避免全对全（n²）→ 限制为 n×W
├── 类似 DGIM 的窗口管理
└── KV-cache 也只需保留最近 W 个
```

#### Longformer 的滑动窗口设计

```python
class SlidingWindowAttention:
    """
    每个位置只关注窗口内的 token
    复杂度从 O(n²) → O(n·W)
    """
    def __init__(self, window_size=512):
        self.W = window_size
    
    def compute_attention(self, Q, K, V):
        n = Q.shape[0]
        output = []
        
        for i in range(n):
            # 只取窗口内的 K/V
            start = max(0, i - self.W)
            end = min(n, i + self.W)
            
            K_window = K[start:end]
            V_window = V[start:end]
            
            # 计算局部注意力
            scores = Q[i] @ K_window.T
            weights = softmax(scores)
            output.append(weights @ V_window)
        
        return stack(output)

# 复杂度分析
# 时间：O(n · W · d)
# 空间：O(n · d) (KV-cache 只需窗口大小)
```

#### 与 Ch10 DGIM 的对照

| DGIM 特征 | 滑动窗口注意力对应 |
|----------|------------------|
| **窗口大小 W** | 注意力窗口大小 |
| **过期删除** | 超出窗口的 K/V 不计算 |
| **近似计数** | 近似注意力（损失远距离依赖） |
| **O(log²W) 空间** | O(W) KV-cache 空间 |

---

## 三、长上下文的算法挑战

### 3.1 线性注意力：打破 O(n²) 瓶颈

#### 核心思想：利用矩阵乘法结合律

**数学推导**：

```
标准注意力：
Attention(Q, K, V) = softmax(QK^T) × V
                   = [n×n] × [n×d]
                   需要 O(n²) 计算

线性注意力关键洞察：
softmax(QK^T) × V 可以改写？

如果用核函数 φ 替代 softmax：
Attention(Q, K, V) ≈ φ(Q) × (φ(K)^T × V)
                   = [n×k] × [k×d]  (先算 K×V)
                   = O(n·k·d) + O(k·n·d)

关键：先算 φ(K)^T × V [k×d]，再算 φ(Q) × [k×d]
     避免中间的 [n×n] 矩阵
```

#### Linear Attention 实现

```python
def linear_attention(Q, K, V, feature_dim=64):
    """
    线性注意力：O(n·k·d) 复杂度
    核思想：用随机特征近似 softmax
    """
    # 特征映射 φ(x) = elu(x) + 1 (Performer)
    phi_Q = elu(Q) + 1  # [n, d] → [n, d]
    phi_K = elu(K) + 1
    
    # 先计算 K^T × V：[d, d] 矩阵
    KV = phi_K.T @ V  # O(n·d²)
    
    # 再计算 Q × KV：[n, d]
    output = phi_Q @ KV  # O(n·d²)
    
    # 总复杂度：O(n·d²)，而非 O(n²·d)
    # 当 d << n 时，显著节省
    
    return output

# 复杂度对比
# n=10000, d=512
# 标准注意力：O(10000² × 512) = O(51.2B)
# 线性注意力：O(10000 × 512²) = O(2.6M)
```

#### 近似的代价

| 线性注意力优势 | 线性注意力代价 |
|---------------|---------------|
| **时间 O(n·d²)** | 近似 softmax，非精确 |
| **空间 O(n·d)** | 长距离依赖表达能力下降 |
| **支持无限长度** | 核函数选择影响质量 |
| **流式友好** | 某些核函数需要历史累积 |

### 3.2 FlashAttention：硬件友妙的内存优化

#### 核心问题：内存访问瓶颈

```
GPU 内存层次：
├── HBM（高带宽内存）：40GB，带宽 1.5TB/s
├── SRAM（片上缓存）：每块 ~20MB，带宽 ~20TB/s
└── 计算：GPU 算力 ~300 TFLOPS

问题：
标准注意力需要多次读写 [n×n] 矩阵
├── 写入 HBM：scores [n×n]
├── 读回计算：softmax
├── 写入 HBM：weights [n×n]
└── 读回计算：× V
→ 内存带宽瓶颈！
```

#### FlashAttention 的算法思想

```
分块计算（Tiling）：
├── 将 Q, K, V 分成小块 [B×d]
├── 每块在 SRAM 内完成完整计算
├── 只写回最终结果，不存中间矩阵
└── 避免 HBM 的 n×n 矩阵读写

具体步骤：
for each block Q_block in Q:
    load Q_block to SRAM
    
    for each block K_block, V_block in K, V:
        load K_block, V_block to SRAM
        
        # 在 SRAM 内计算
        scores_block = Q_block × K_block^T
        weights_block = softmax(scores_block)
        output_block += weights_block × V_block
        
        # 不写回中间结果！
    
    write output_block to HBM

内存访问量：
├── 标准：读写 n×n 矩阵多次 → O(n²) HBM 访问
└── Flash：分块计算，只读写 n×d 结果 → O(n·d) HBM 访问
```

#### FlashAttention 的复杂度视角

| 维度 | 标准注意力 | FlashAttention |
|------|-----------|----------------|
| **计算复杂度** | O(n²·d) | O(n²·d)（相同） |
| **内存访问** | O(n²) HBM | O(n·d) HBM |
| **实际运行时间** | 内存瓶颈 | 计算瓶颈（更快） |
| **空间复杂度** | O(n²) | O(n·d)（不存注意力矩阵） |

#### 算法启示

> **FlashAttention 不是改变复杂度，而是改变瓶颈**
> 
> 算法复杂度仍是 O(n²)，但避免了内存访问瓶颈。
> 这体现了 Ch8-9 分布式章节的**硬件约束思维**：
> - 算法复杂度 ≠ 实际运行时间
> - 内存访问模式决定实际性能

### 3.3 稀疏注意力：算法选择而非随机

#### 稀疏注意力的设计模式

```
全注意力：每个 token 关注所有 → n² 连接

稀疏注意力设计模式：
├── 滑动窗口：只关注邻居 → 类似图局部传播
├── 全局 token：少数 token 作为全局枢纽 → 类似图中心节点
├── 随机注意力：随机选择 k 个关注 → 类似采样
├── 哈希注意力：按哈希分桶，桶内计算 → 类似哈希表分组
└── 层级注意力：分层聚合 → 类似树结构
```

#### BigBird 的混合稀疏模式

```python
class BigBirdAttention:
    """
    混合三种注意力：
    1. 滑动窗口（局部）
    2. 全局 token（枢纽）
    3. 随机注意力（探索）
    """
    def __init__(self, window_size=64, global_tokens=4, random_tokens=8):
        self.W = window_size
        self.G = global_tokens
        self.R = random_tokens
    
    def compute_attention(self, Q, K, V):
        n = Q.shape[0]
        output = []
        
        for i in range(n):
            # 1. 滑动窗口：邻居
            local_indices = range(max(0, i-self.W), min(n, i+self.W))
            
            # 2. 全局 token：固定枢纽
            global_indices = [0, 1, n-2, n-1]  # 首尾作为全局
            
            # 3. 随机注意力：随机采样
            random_indices = random.sample(range(n), self.R)
            
            # 合并关注位置
            attend_indices = set(local_indices) | set(global_indices) | set(random_indices)
            attend_indices = sorted(list(attend_indices))
            
            # 计算稀疏注意力
            K_sparse = K[attend_indices]
            V_sparse = V[attend_indices]
            
            scores = Q[i] @ K_sparse.T
            weights = softmax(scores)
            output.append(weights @ V_sparse)
        
        return stack(output)

# 复杂度
# 每个位置关注 W + G + R ≈ 80 个位置
# 总复杂度：O(n · 80 · d) → O(n)
```

#### 与 Ch4 图传播的对照

| 图传播模式 | 稀疏注意力对应 |
|----------|---------------|
| **邻居传播** | 滑动窗口注意力 |
| **中心节点** | 全局 token |
| **随机游走** | 随机注意力 |
| **层级聚合** | 层级注意力 |
| **边权重** | 注意力权重 |

---

## 四、Token 与表示：离散到连续的映射

### 4.1 Token 化的算法意义

#### 核心问题：如何将离散符号编码为可计算的向量？

```
传统算法的离散处理：
├── 字符串：直接比较、哈希、索引
├── 数值：数学运算
├── 结构化数据：字段映射
└── 问题：如何计算"相似度"？无法内积

Transformer 的连续化：
├── Token → 向量嵌入（embedding）
├── 向量可以内积 → 相似度度量
├── 向量可以聚合 → 信息融合
└── 问题：如何保证嵌入有意义？
```

#### Embedding 表作为"编码字典"

```python
class TokenEmbedding:
    """
    Token → 向量的映射表
    空间：O(|V| · d)，其中 V=词表大小，d=维度
    """
    def __init__(self, vocab_size, embed_dim):
        self.embedding_table = random_init(vocab_size, embed_dim)
        # 每个 token ID 对应一个 d 维向量
    
    def embed(self, token_id):
        """查表返回向量（类似 Ch3 查找表）"""
        return self.embedding_table[token_id]
    
    def lookup_similar(self, vector):
        """反向查找：最接近的 token"""
        # 计算所有词表中 token 与 vector 的相似度
        similarities = self.embedding_table @ vector
        return argmax(similarities)

# 算法对照
# Ch3 查找表：key → value（精确映射）
# Embedding 表：token_id → vector（查表）
# 但 vector 可以进一步计算相似度
```

#### Token 化的粒度选择

| Token 粒度 | 例子 | 词表大小 | 空间成本 |
|-----------|------|---------|----------|
| **字符级** | a, b, c... | ~100 | 小 |
| **子词级（BPE）** | un, ##happy | ~30k-50k | 中 |
| **词级** | happy, unhappy | ~100k | 大 |
| **字节级** | 字节 | 256 | 最小 |

#### BPE（Byte Pair Encoding）的算法本质

```python
def bpe_encode(text, vocab):
    """
    BPE：贪心合并高频字节对
    类似 Ch5 贪心算法的"最优合并"问题
    """
    # 初始化：字符序列
    tokens = list(text)
    
    while len(tokens) > 1:
        # 统计相邻对的频率
        pairs = count_adjacent_pairs(tokens)
        
        # 选择最高频对
        best_pair = max(pairs, key=pairs.get)
        
        if best_pair not in vocab:
            break  # 词表中没有
        
        # 合并
        tokens = merge_pair(tokens, best_pair)
    
    return tokens

# 算法对照：
# Huffman 编码：贪心合并最低频（最优压缩）
# BPE：贪心合并最高频（生成常用子词）
```

### 4.2 向量空间的几何直觉

#### 核心几何直觉

```
向量空间 = 高维欧几里得空间

关键几何概念：
├── 内积 = 相似度（余弦相似度）
├── 距离 = 差异度（欧氏距离）
├── 方向 = 概念方向（"语义轴"）
└── 加法 = 概念融合（"king - man + woman = queen"）

直觉可视化：
┌─────────────────────────────────┐
│        queen                     │
│         ↑                        │
│         │  (性别维度)             │
│    king ←─────────→ man          │
│         │                        │
│         ↓                        │
│        king-man+woman            │
│        ≈ queen                   │
└─────────────────────────────────┘
```

#### 注意力内积的几何意义

```python
def cosine_similarity(v1, v2):
    """
    余弦相似度 = 向量夹角的 cos 值
    值域：[-1, 1]
    """
    return (v1 @ v2) / (norm(v1) * norm(v2))

# 注意力中的 QK^T：
# Q[i] 与 K[j] 的内积大 → 方向接近 → "语义相关"
# Q[i] 与 K[j] 的内积小 → 方向远离 → "不相关"

# 类比 Ch4 图的边权重：
# 边权大 = 紧密连接
# 注意力大 = 信息相关
```

#### 向量空间的算法利用

| 算法应用 | 向量空间利用 |
|---------|-------------|
| **聚类** | 向量距离分组（K-means） |
| **检索** | 向量相似度搜索（RAG） |
| **分类** | 向量边界划分 |
| **推荐** | 向量相似度排序 |
| **压缩** | 向量降维（PCA） |

### 4.3 位置编码的设计选择

#### 为什么需要位置编码？

```
Transformer 注意力的问题：
├── QK^T 是集合操作，无顺序概念
├── "I love cats" 和 "cats love I" 的注意力矩阵相同
└── 需要注入位置信息

解决方案：
├── 绝对位置编码：每个位置有唯一编码
├── 相对位置编码：编码位置差（i-j）
└── 旋转位置编码（RoPE）：用旋转表示相对位置
```

#### Sinusoidal 位置编码（原始 Transformer）

```python
def sinusoidal_position_encoding(n, d):
    """
    绝对位置编码：用不同频率的正弦波
    类似傅里叶变换的基函数组合
    """
    position = arange(n)  # [0, 1, 2, ..., n-1]
    
    encoding = zeros(n, d)
    for i in range(d):
        if i % 2 == 0:
            # 偶数维度：sin
            encoding[:, i] = sin(position / (10000 ** (i/d)))
        else:
            # 奇数维度：cos
            encoding[:, i] = cos(position / (10000 ** (i/d)))
    
    return encoding

# 直觉：
# 低频维度：区分全局位置
# 高频维度：区分局部位置
# 组合：唯一编码每个位置
```

#### RoPE（旋转位置编码）的算法直觉

```python
def rope_encoding(position, vector):
    """
    RoPE：用旋转角度表示位置
    关键：相对位置差对应旋转差
    """
    # 每两个维度一组，视为 2D 向量
    for i in range(0, d, 2):
        theta = position * (10000 ** (-i/d))
        
        # 旋转该组向量
        cos_theta = cos(theta)
        sin_theta = sin(theta)
        
        x = vector[i]
        y = vector[i+1]
        
        vector[i] = x * cos_theta - y * sin_theta
        vector[i+1] = x * sin_theta + y * cos_theta
    
    return vector

# 关键性质：
# Q[i] · K[j] 内积只依赖于相对位置 i-j
# 因为旋转差 = 旋转角度差 = 位置差

# 算法直觉：
# 类似用"角度"编码位置
# 相对位置 = 角度差（保持内积关系）
```

#### 位置编码的算法对照

| 位置编码类型 | 算法类比 | 复杂度 |
|-------------|---------|-------|
| **Sinusoidal** | 傅里叶基函数 | O(n·d) 预计算 |
| **Learned** | 查找表（Ch3） | O(n·d) 存储 |
| **RoPE** | 几何旋转 | O(n·d) 在线计算 |
| **ALiBi** | 线性衰减 | O(1) 无额外参数 |

---

## 五、LLM 时代的新算法问题

### 5.1 推理时的算法选择

#### 采样策略的算法视角

```
生成第 n+1 个 token：
├── 模型输出概率分布 P(token | context)
├── 如何从分布中选择 token？
└── 采样策略 = 算法选择问题

策略对比：
┌─────────────────────────────────────────────────┐
│ 贪心选择：argmax(P)                              │
│ ├── 类似 Ch5 贪心算法                           │
│ ├── 每步最优，但全局不一定最优                   │
│ └── 问题：易陷入重复循环                        │
│                                                 │
│ 温度采样：softmax(P / temperature)              │
│ ├── temperature → 0：接近贪心                   │
│ ├── temperature → ∞：均匀随机                   │
│ └── temperature = 1：标准 softmax              │
│                                                 │
│ Top-k 采样：只从 top-k 候选中采样               │
│ ├── 类似 Ch10 蓄水池采样（限制候选集）          │
│ └── 避免低概率 token                           │
│                                                 │
│ Top-p（nucleus）采样：从累积概率 p 的最小集合采样│
│ ├── 动态调整候选集大小                         │
│ └── 概率分布集中时候选少，分散时候选多          │
└─────────────────────────────────────────────────┘
```

#### 温度调节的数学直觉

```python
def temperature_sampling(logits, temperature=1.0):
    """
    温度调节：控制概率分布的"陡峭度"
    """
    # logits: 未归一化的概率分数
    scaled_logits = logits / temperature
    
    # softmax 归一化
    probs = softmax(scaled_logits)
    
    # 采样
    token = random.choice(probs)
    
    return token

# 温度效果：
# temp = 0.1：分布陡峭 → 高概率 token 主导
# temp = 1.0：标准分布
# temp = 10.0：分布平坦 → 更随机

# 算法类比：
# temp → 0：确定性算法（贪心）
# temp → ∞：随机算法（均匀）
# 中间：概率算法（权衡确定性和探索）
```

#### Beam Search 的算法本质

```python
def beam_search(model, prompt, beam_width=5, max_tokens=100):
    """
    Beam Search：保留 top-k 候选路径
    类似 Ch4 BFS 的"波纹扩散"，但剪枝
    """
    beams = [{"tokens": prompt, "score": 0}]
    
    for _ in range(max_tokens):
        candidates = []
        
        for beam in beams:
            # 对每个 beam 扩展
            logits = model(beam["tokens"])
            top_k_tokens = top_k(logits, beam_width)
            
            for token, score in top_k_tokens:
                new_beam = {
                    "tokens": beam["tokens"] + [token],
                    "score": beam["score"] + log(score)
                }
                candidates.append(new_beam)
        
        # 剪枝：只保留 top beam_width
        beams = top_k(candidates, beam_width, key=lambda x: x["score"])
    
    return beams[0]["tokens"]

# 算法对照：
# BFS（Ch4）：保留所有扩展（无剪枝）
# Beam Search：保留 top-k（剪枝）
# 贪心：只保留 top-1（激进剪枝）
```

### 5.2 上下文压缩技术

#### 问题：KV-cache 空间有限，如何压缩？

```
长对话场景：
├── 用户多轮对话，历史累积
├── KV-cache 持续增长 → O(n·d)
├── GPU 内存有限 → 需压缩
└── 压缩目标：保留关键信息，删除冗余

压缩策略：
├── 滑动窗口：删除最旧 K/V
├── 摘要压缩：用摘要向量替代历史 K/V
├── 选择性保留：保留"重要" token 的 K/V
└── 分层压缩：高层压缩，低层保留
```

#### 注意力Sink 现象

```
观察：删除某些 token 的 K/V → 输出质量下降严重
原因：这些 token 是"注意力Sink"，聚合了大量信息

算法直觉：
├── 类似图的中心节点（Ch4）
├── 这些 token 是信息枢纽
├── 删除它们 → 信息流断裂
└── 应优先保留 Sink token

识别 Sink：
for each token i:
    incoming_attention = sum(attention[:, i])  # 所有位置对 i 的注意力总和
    if incoming_attention > threshold:
        mark_as_sink(i)
```

#### 压缩算法设计

```python
class ContextCompressor:
    """
    KV-cache 压缩：保留重要 token
    类似 Ch10 Misra-Gries 的"频繁项"思想
    """
    def __init__(self, max_tokens=1000):
        self.max_tokens = max_tokens
    
    def compress(self, KV_cache, attention_weights):
        """
        根据注意力权重选择保留的 token
        """
        # 计算每个 token 的"重要性" = 接收的总注意力
        importance = sum(attention_weights, axis=0)  # [n]
        
        # 选择 top max_tokens
        keep_indices = top_k(importance, self.max_tokens)
        
        # 保留对应的 K/V
        compressed_KV = KV_cache[keep_indices]
        
        return compressed_KV

# 算法对照：
# Misra-Gries：保留高频项
# 上下文压缩：保留高注意力 token
# 都是"选择性保留"策略
```

### 5.3 RAG 的算法视角

#### RAG = 检索 + 注意力融合

```
传统查找（Ch3）：
├── 查询 → 精确匹配 → 返回结果
└── 算法：哈希表、B树、倒排索引

RAG 的两阶段：
┌─────────────────────────────────────────────┐
│ Stage 1: 外部检索                            │
│ ├── 向量数据库检索相似文档                    │
│ ├── 算法：向量相似度搜索（近似）              │
│ └── 类似 Ch3 的查找，但用向量相似度          │
│                                             │
│ Stage 2: 注意力融合                          │
│ ├── 检索结果拼接到输入                        │
│ ├── Transformer 注意力融合检索内容           │
│ └── 检索信息与输入信息的加权聚合              │
└─────────────────────────────────────────────┘
```

#### 向量检索的算法本质

```python
class VectorDatabase:
    """
    向量检索：相似度搜索
    类似 Ch3 查找表，但用"相似度"而非"精确匹配"
    """
    def __init__(self, vectors):
        self.vectors = vectors  # [N, d]
    
    def search(self, query_vector, top_k=10):
        """
        返回最相似的 top_k 向量
        """
        # 计算相似度（内积或余弦）
        similarities = self.vectors @ query_vector
        
        # 排序返回 top_k
        indices = argmax_k(similarities, top_k)
        
        return self.vectors[indices], similarities[indices]

# 复杂度：O(N·d) 每次查询
# 优化：近似最近邻（ANN）
├── HNSW：层级导航小世界图（Ch4 图的应用）
├── IVF：倒排文件索引（聚类分组）
└── LSH：局部敏感哈希（Ch10 哈希思想）
```

#### RAG 注意力的信息融合

```python
def rag_attention(query_tokens, retrieved_docs):
    """
    RAG：输入 + 检索结果的注意力融合
    """
    # 拼接
    full_input = query_tokens + retrieved_docs
    
    # 注意力计算
    # query_tokens 可以关注 retrieved_docs
    # retrieved_docs 也可以互相关注
    output = transformer(full_input)
    
    return output

# 关键观察：
# Query 对 Doc 的注意力权重 → 决定使用哪些检索信息
# 类似"软检索"：不硬选择文档，而是加权融合
```

#### RAG 与传统检索的对照

| 传统检索 | RAG 检索 |
|---------|---------|
| **精确匹配** | **相似度匹配** |
| **返回单一结果** | **返回多个候选** |
| **硬选择** | **软融合（注意力权重）** |
| **倒排索引** | **向量索引（HNSW）** |
| **O(log N)** | **近似 O(log N) 或 O(N)（ANN）** |

---

## 六、与前章节的关联点汇总

### 6.1 跨章节对照表

| Ch11 内容 | 关联章节 | 关联点 |
|----------|---------|-------|
| **自注意力 = 检索** | Ch3 查找 | Q/K/V = 查询/键/值，软检索 vs 硬检索 |
| **KV-cache** | Ch2 缓存 | 增量存储，复用历史，空间换时间 |
| **注意力传播** | Ch4 图传播 | 信息流边权重，邻居聚合 |
| **滑动窗口注意力** | Ch10 流式 | 窗口管理，过期删除，DGIM 对照 |
| **稀疏注意力** | Ch4 图 | 邻居传播、中心节点、随机游走 |
| **Token 嵌入** | Ch3 查找表 | 查表返回向量 |
| **向量相似度** | Ch3 查找 | 相似度搜索 vs 精确匹配 |
| **BPE** | Ch5 贪心 | 贪心合并高频对 |
| **温度采样** | Ch5 贪心 | 贪心 vs 随机权衡 |
| **Beam Search** | Ch4 BFS | 波纹扩散 + 剪枝 |
| **向量检索** | Ch3 查找 | HNSW 图索引 |
| **上下文压缩** | Ch10 MG | 选择性保留"重要"项 |
| **FlashAttention** | Ch8-9 分布式 | 硬件约束，内存访问优化 |

### 6.2 知识递进路径

```
Ch2: 缓存 → KV-cache 增量存储
Ch3: 查找 → 注意力软检索 + 向量检索
Ch4: 图传播 → 注意力传播 + 稀疏注意力图结构
Ch5: 贪心 → BPE 合并 + 温度采样权衡
Ch8-9: 分布式 → FlashAttention 硬件优化
Ch10: 流式 → 滑动窗口注意力 + 上下文压缩
Ch11: Transformer → 综合视角：检索+传播+缓存+流式
```

---

## 七、练习设计建议

### 7.1 基础理解（3 题）

**练习 1：注意力矩阵的计算与可视化**

```
给定 4 个 token 的 Q、K 向量（简化为 2 维）：
Q = [[1, 0], [0, 1], [1, 1], [-1, 0]]
K = [[1, 0], [0, -1], [2, 0], [0, 1]]

任务：
1. 计算 QK^T 注意力分数矩阵
2. 应用 softmax 归一化
3. 绘制注意力热图
4. 观察：哪个 token 最"被关注"？为什么？
5. 思考：如果 Q 和 K 的维度增加，注意力模式如何变化？

教学目标：
- 理解注意力矩阵的计算过程
- 理解内积 = 相似度的几何直觉
- 观察软检索 vs 硬检索的区别
```

**练习 2：KV-cache 增量计算模拟**

```
场景：生成序列 "The cat sits on the"

任务：
1. 模拟逐 token 生成过程
2. 每生成一个新 token，记录新增的 K/V
3. 对比"无缓存"（每次重算）vs "有缓存"（增量）的计算量
4. 计算空间复杂度增长

思考：
- 为什么预填充（prefill）阶段不需要缓存？
- 生成阶段如果不使用缓存，复杂度如何？
- 缓存的空间限制如何影响长文本生成？

教学目标：
- 理解增量计算的算法本质
- 理解空间换时间策略
- 与 Ch2 缓存概念关联
```

**练习 3：滑动窗口注意力实现**

```
给定序列长度 n=1000，窗口大小 W=100

任务：
1. 实现滑动窗口注意力（每个位置只关注 W 个邻居）
2. 计算复杂度：O(n²) vs O(n·W)
3. 实现滑动窗口 KV-cache（只保留最近 W 个）
4. 测试长文本生成，观察窗口外信息丢失的影响

思考：
- 窗口大小 W 如何选择？
- 窗口外的历史信息如何处理？（提示：摘要）
- 与 Ch10 DGIM 滑动窗口的对照？

教学目标：
- 琢解滑动窗口降低复杂度的原理
- 理解窗口策略的信息损失代价
- 与 Ch10 流式算法关联
```

### 7.2 方法应用（3 题）

**练习 4：线性注意力实验**

```
给定序列 n=5000, d=256

任务：
1. 实现标准注意力（O(n²·d)）
2. 实现线性注意力（Performer 的 elu+1 核）
3. 测量两种方法的运行时间
4. 比较输出结果差异（近似误差）

思考：
- 为什么线性注意力是"近似"？
- 核函数选择如何影响近似质量？
- 当 d > n 时，线性注意力是否还有优势？

教学目标：
- 理解线性注意力的数学原理（矩阵结合律）
- 理解近似算法的精度-效率权衡
- 类似 Ch10 近似算法范式
```

**练习 5：稀疏注意力模式设计**

```
场景：处理长文档（n=10000）

任务：
1. 设计三种稀疏注意力模式：
   - 纯滑动窗口
   - 滑动窗口 + 全局 token（首尾）
   - 滑动窗口 + 全局 + 随机
2. 分析每种模式的复杂度
3. 用不同模式处理同一文档，比较结果差异
4. 思考：哪种模式适合什么场景？

思考：
- 全局 token 的作用？（类比图的中心节点）
- 随机注意力的作用？（类比随机游走探索）
- 如何自适应选择稀疏模式？

教学目标：
- 理解稀疏注意力的设计选择
- 理解算法设计 = 结构选择
- 与 Ch4 图结构关联
```

**练习 6：向量检索实现**

```
给定文档库 1000 篇，每篇嵌入为 512 维向量

任务：
1. 实现暴力检索（计算所有相似度）
2. 实现简单聚类索引（IVF）
3. 比较两种方法的检索速度和精度
4. 测试 RAG：检索 + 注意力融合生成

思考：
- 向量检索 vs 传统关键词检索的区别？
- 为什么向量检索需要近似算法？
- 检索结果如何通过注意力融合？

教学目标：
- 理解向量检索的算法本质
- 理解 RAG 的两阶段流程
- 与 Ch3 查找关联（相似度 vs 精确匹配）
```

### 7.3 错误诊断（2 题）

**练习 7：注意力机制错误案例**

```
案例：某模型生成重复文本 "I like cats. I like cats. I like cats."

诊断：
1. 检查注意力矩阵：观察 token 对自身的注意力权重
2. 分析：为什么模型陷入自引用循环？
3. 思考解决方案：
   - 调整温度（增加随机性）
   - Top-k 采样限制候选
   - 重复惩罚机制

思考：
- 注意力权重如何影响生成模式？
- 贪心采样的缺点是什么？
- 如何用算法视角诊断生成问题？

教学目标：
- 理解注意力权重对生成的影响
- 理解采样策略的算法选择
- 培养"算法诊断"思维
```

**练习 8：KV-cache 空间溢出**

```
场景：长对话 100 轮，每轮平均 50 token → 5000 token 历史

问题：KV-cache 空间不足（GPU 内存限制）

任务：
1. 分析 KV-cache 空间增长曲线
2. 设计三种压缩策略：
   - 滑动窗口（删除最旧）
   - 选择性保留（保留高注意力 token）
   - 摘要压缩（用摘要向量替代）
3. 比较三种策略的信息损失
4. 选择最优策略并解释原因

思考：
- 为什么删除某些 token 比其他影响更大？（Sink 现象）
- 如何识别"重要" token？
- 与 Ch10 Misra-Gries 频繁项思想的对照？

教学目标：
- 理解空间约束下的压缩策略
- 理解"重要性"识别的算法问题
- 与 Ch10 流式压缩关联
```

### 7.4 方案比较与开放设计（2 题）

**练习 9：不同注意力机制的权衡**

```
比较四种注意力机制：

| 机制 | 时间复杂度 | 空间复杂度 | 长距离依赖 | 适用场景 |
|------|-----------|-----------|-----------|---------|
| 标准注意力 | O(n²) | O(n²) | 完全支持 | 短文本 |
| 滑动窗口 | O(n·W) | O(n·W) | 受限 | 流式生成 |
| 稀疏混合 | O(n·k) | O(n·k) | 部分 | 长文档 |
| 线性注意力 | O(n·d²) | O(n·d) | 近似 | 极长文本 |

任务：
1. 分析每种机制的算法本质
2. 给出三种场景推荐：
   - 短对话（<1000 token）
   - 长文档理解（10k-100k token）
   - 实时流式生成
3. 论证推荐理由（复杂度 + 信息需求）

思考：
- 为什么没有"最优"注意力机制？
- 算法设计 = 约束适配？
- LLM 如何选择注意力机制？

教学目标：
- 理解算法选择的权衡思维
- 理解"没有最优，只有适配"
- 培养"方案比较"能力
```

**练习 10：设计长上下文管理 Agent**

```
场景：设计一个能处理无限长度对话的 Agent

要求：
1. 分析核心算法挑战：
   - KV-cache 空间增长
   - 长距离信息保留
   - 实时生成延迟
2. 设计综合方案：
   - 滑动窗口 + 摘要压缩
   - 选择性保留重要 token
   - RAG 检索补充历史信息
3. 给出算法流程伪代码
4. 分析方案的复杂度和信息损失

开放思考：
- 如何定义"重要" token？
- 摘要如何生成？（可用 LLM 本身）
- 检索索引如何维护？
- 与 Ch10 流式算法的完整对照？

教学目标：
- 综合应用 Ch11 所有概念
- 培养"系统设计"能力
- 理解算法视角的 Agent 设计
```

---

## 八、知识卡片设计

以下内容可转化为独立的 Zettel 卡片：

| 卡片标题 | 来源章节 | 关键概念 | 关联卡片 |
|----------|----------|----------|----------|
| **自注意力 = 软检索** | 2.1 | Q/K/V、内积相似度、加权聚合 | Z-检索、Z-缓存 |
| **KV-cache 增量计算** | 2.3 | 空间换时间、增量存储 | Z-缓存更新策略 |
| **O(n²) 算法瓶颈** | 2.2 | 全对全比较、空间成本 | Z-复杂度层次 |
| **滑动窗口注意力** | 2.4 | 窗口管理、与 DGIM 对照 | Z-滑动窗口范式 |
| **线性注意力** | 3.1 | 矩阵结合律、核函数近似 | Z-近似算法范式 |
| **FlashAttention** | 3.2 | 内存访问优化、分块计算 | Z-硬件约束思维 |
| **稀疏注意力模式** | 3.3 | 图结构对照、设计选择 | Z-图传播权重 |
| **Token 嵌入表** | 4.1 | 离散→连续映射、查表 | Z-查找表 |
| **向量空间几何** | 4.2 | 内积相似度、语义方向 | Z-几何直觉 |
| **位置编码设计** | 4.3 | 绝对 vs 相对、旋转编码 | Z-编码策略 |
| **温度采样** | 5.1 | 贪心 vs 随机权衡 | Z-贪心局限 |
| **Beam Search** | 5.1 | BFS + 剪枝 | Z-搜索剪枝 |
| **上下文压缩** | 5.2 | Sink 识别、选择性保留 | Z-Misra-Gries |
| **RAG 两阶段** | 5.3 | 检索 + 注意力融合 | Z-软检索 |

---

## 九、参考资料

### 经典教材

1. **Kleinberg & Tardos** - *Algorithm Design*：检索、缓存、图传播章节
2. **Roughgarden** - *Algorithms Illuminated*：复杂度分析、图算法
3. **Skiena** - *The Algorithm Design Manual*：War Story 风格

### Transformer 原始论文与变体

1. Vaswani et al. (2017) - *Attention Is All You Need*
2. Beltagy et al. (2020) - *Longformer*（滑动窗口注意力）
3. Zaheer et al. (2020) - *BigBird*（稀疏注意力）
4. Choromanski et al. (2020) - *Performer*（线性注意力）
5. Dao et al. (2022) - *FlashAttention*
6. Su et al. (2021) - *RoPE*（旋转位置编码）

### 长上下文研究

1. Kwon et al. (2023) - *PagedAttention*（vLLM）
2. Xiao et al. (2023) - *StreamingLLM*（注意力 Sink）
3. Liu et al. (2024) - *Lost in the Middle*（长上下文性能分析）

### RAG 相关

1. Lewis et al. (2020) - *Retrieval-Augmented Generation*
2. Guo et al. (2022) - *HNSW 向量索引*

### 教材设计参考

- INBOX.md 七个核心特征
- Ch10 调研报告（流式算法对照）
- Ch7-9 调研报告（风格一致性）

---

## 十、后续工作建议

### 10.1 章节大纲细化

根据调研内容，建议章节结构：

```
Ch11: Transformer：注意力作为算法

11.1 自注意力的算法本质
    - 问题驱动：如何从每个位置找到相关信息？
    - Q/K/V = 查询/键/值 的检索直觉
    - 与 Ch3 查找对照：软检索 vs 硬检索
    - 注意力矩阵计算过程可视化

11.2 计算成本与缓存策略
    - O(n²) 问题：全对全检索的代价
    - KV-cache：增量计算的算法本质
    - 与 Ch2 缓存对照：空间换时间
    - 滑动窗口注意力：与 Ch10 流式对照

11.3 长上下文的算法挑战
    - 线性注意力：打破 O(n²) 瓶颈
    - FlashAttention：硬件约束优化
    - 稀疏注意力：设计模式而非随机
    - 与 Ch4 图传播对照

11.4 Token 与向量表示
    - Token 化：离散到连续的映射
    - 嵌入表 = 编码字典
    - 向量空间的几何直觉
    - 位置编码设计选择

11.5 LLM 时代的算法问题
    - 采样策略：贪心 vs 随机的权衡
    - 上下文压缩：Sink 识别与选择性保留
    - RAG：检索 + 注意力融合
    - 长上下文管理 Agent 设计

11.6 综合案例与练习
    - 注意力矩阵手动计算
    - KV-cache 模拟实验
    - 稀疏注意力设计实践
    - RAG 系统搭建实验
```

### 10.2 需补充的内容

1. **可视化资源**：
   - 注意力矩阵热图示例
   - KV-cache 增长动画
   - 滑动窗口示意图
   - 稀疏注意力模式图

2. **代码示例**：
   - 简化注意力实现（教学用）
   - KV-cache 增量计算演示
   - 滑动窗口注意力实现
   - RAG 两阶段流程演示

3. **实验数据**：
   - 不同注意力机制的速度对比
   - KV-cache 空间增长曲线
   - 压缩策略信息损失对比

### 10.3 与其他章节的协调

- Ch12 预定主题可能是 **"推理系统：从算法到工程"**，可衔接 Ch11 的硬件优化内容
- Ch11 的 RAG 内容可扩展为独立的 **检索增强生成** 章节
- Ch11 的采样策略可衔接 **概率算法** 章节

---

**调研完成时间**: 2026-06-20
**预计后续**: 根据 Felix 审查反馈调整，补充可视化资源和代码示例
