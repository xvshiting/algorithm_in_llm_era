# 11.4 Token与向量表示

> **核心洞察**：Token化是将离散符号映射到连续向量空间的算法过程。向量空间编码了语义关系，相似度度量变成几何距离。这是从"符号处理"到"几何计算"的转变。

---

## 11.4.1 开篇直觉：从符号到向量

**符号与向量的对比**：

```
场景：处理文本"algorithm is useful"

传统符号方法：
  词表：{algorithm: 1, is: 2, useful: 3}
  表示：[1, 2, 3]  # 整数索引
  
  问题：
    索引没有语义关系
    algorithm和useful的距离 = |1-3| = 2
    但algorithm和method语义相近，距离却很大
    
向量表示方法：
  algorithm → [0.8, 0.1, 0.1, ...]
  method → [0.7, 0.2, 0.1, ...]  # 与algorithm接近
  is → [0.1, 0.9, 0.0, ...]
  useful → [0.6, 0.3, 0.1, ...]
  
  关键洞察：
    向量空间中，语义相似的词距离近
    这是"知识编码"的方式
    
对比：
┌────────────────────────────────────────────┐
│ 符号表示：                                 │
│   离散索引，无语义关系                      │
│   无法计算相似度                            │
│                                            │
│ 向量表示：                                  │
│   连续向量，编码语义                        │
│   可以计算相似度（内积）                    │
│   可以聚合信息                              │
└────────────────────────────────────────────┘
```

---

## 11.4.2 问题驱动：Token化失败

### War Story：代码处理的困境

**场景**：

```
任务：处理代码片段 "def foo(): pass"

问题1：词表不匹配
  词表：{def: 1, foo: 2, pass: 5}
  
  未知token：
    "(): " 不在词表中
    如何处理？
  
  结果：
    忽略 → 信息丢失
    映射到<unk> → 无法区分不同未知token
    
问题2：子词切分
  BPE切分：algorithm → [algo, rithm]
  
  问题：
    一个词被拆成多个token
    如何保持语义完整性？
    
  分析：
    "algo"和"rithm"各自没有完整语义
    但组合后才有意义
    向量空间中需要表示"组合语义"
    
问题3：多语言问题
  中文：算法
  
  词表：中文词表小（如5000字）
  
  切分选择：
    字级别：每个字一个token（细粒度）
    词级别：整个词一个token（粗粒度）
    
  权衡：
    字级别：词表小，但语义破碎
    词级别：词表大，但语义完整
```

**关键问题**：

> Token化如何设计？向量空间如何组织？

---

## 11.4.3 核心概念：Token化的算法定义

### Token化流程

```
Token化三步骤：

输入："The algorithm is useful"
     ↓
步骤1：分词（Tokenization）
  方案选择：
    空格切分：["The", "algorithm", "is", "useful"]
    子词切分（BPE）：["The", "algo", "rithm", "is", "use", "ful"]
    字符切分：["T", "h", "e", " ", "a", "l", "g", ...]
     ↓
步骤2：映射（Vocabulary）
  词表：{The: 100, algorithm: 234, is: 56, useful: 789}
  索引：[100, 234, 56, 789]
     ↓
步骤3：嵌入（Embedding）
  向量表E：[V, d]  # V个词，每个d维向量
  查找：X = E[100], E[234], E[56], E[789]
  输出：[4, d]  # 4个token，每个d维向量
```

### BPE算法

**Byte Pair Encoding**的算法本质：

```
BPE：贪心合并高频字节对

初始：每个字符一个token
迭代：合并最高频的相邻对
终止：达到词表大小目标

算法：
  # 初始化
  tokens = list(text)  # 字符序列
  
  while len(tokens) > 1:
      # 统计相邻对频率
      pairs = {}
      for i in range(len(tokens) - 1):
          pair = (tokens[i], tokens[i+1])
          pairs[pair] = pairs.get(pair, 0) + 1
      
      # 选择最高频对
      best_pair = max(pairs, key=pairs.get)
      
      if best_pair not in vocab:
          break  # 词表中没有
      
      # 合并
      new_tokens = []
      i = 0
      while i < len(tokens):
          if i < len(tokens) - 1 and (tokens[i], tokens[i+1]) == best_pair:
              new_tokens.append(best_pair)
              i += 2
          else:
              new_tokens.append(tokens[i])
              i += 1
      tokens = new_tokens

例子：
  文本："algorithm algorithm algorithm"
  
  初始：["a", "l", "g", "o", "r", "i", "t", "h", "m"]
  发现："l"+"g"高频 → 合并为"lg"
  更新：["a", "lg", "o", "r", "i", "t", "h", "m"]
  继续合并...
```

**与Ch3对照**：哈希映射

| Ch3 哈希映射 | 11.4 Token化映射 | 算法本质 |
|-------------|-----------------|---------|
| **键→索引** | **词→Token ID** | 符号到索引 |
| **固定函数** | **可学习切分** | BPE学习规则 |
| **精确映射** | **有歧义处理** | 子词切分 |

### 知识卡片 C11-10：Token化算法

```
概念：Token化是将文本切分并映射到索引的算法

核心步骤：
  分词 → 映射 → 嵌入

BPE算法本质：
  贪心合并高频对（类似Huffman编码）

算法对比：
  字符切分：细粒度，词表小
  词切分：粗粒度，词表大
  BPE：平衡，自适应

关联：
  Z-哈希映射（Ch3）
  Z-编码算法
```

---

## 11.4.4 向量空间的几何直觉

### 几何概念

```
向量空间 = 高维欧几里得空间

关键几何概念：
┌─────────────────────────────────────────────┐
│ 1. 内积 = 相似度                            │
│    cosine(a, b) = (a·b) / (|a|×|b|)         │
│    值域：[-1, 1]                            │
│    直觉：夹角越小，相似度越高               │
│                                            │
│ 2. 距离 = 差异度                            │
│    dist(a, b) = |a - b|                     │
│    直觉：距离越远，差异越大                 │
│                                            │
│ 3. 方向 = 语义轴                            │
│    king - man + woman ≈ queen               │
│    直觉：向量差表示语义变换                 │
│                                            │
│ 4. 聚类 = 语义分组                          │
│    相似词在向量空间中聚类                   │
│    例子：{cat, dog, bird} → 动物聚类        │
└─────────────────────────────────────────────┘
```

### 语义关系的几何表示

```
经典例子：king - man + woman ≈ queen

向量表示：
  king = [0.8, 0.2]
  man = [0.2, 0.8]
  woman = [0.1, 0.9]
  queen = [0.7, 0.3]

计算：
  king - man = [0.6, -0.6]  # "男性→女性"变换
  king - man + woman = [0.7, 0.3] ≈ queen

直觉：
  向量差编码"性别变换"
  类似于几何中的平移
  
可视化：
        queen
         ↑
         │  (性别维度)
    king ←─────────→ man
         │
         ↓
    king-man+woman

关键洞察：
  向量空间编码语义关系
  算术运算 = 语义变换
```

### 注意力内积的几何意义

```
注意力中的QK内积：

Q[i] 与 K[j] 的内积大 → 方向接近 → "语义相关"
Q[i] 与 K[j] 的内积小 → 方向远离 → "不相关"

类比：
  向量夹角θ → 内积 = |a|×|b|×cos(θ)
  
  θ接近0°：方向相同 → 内积最大 → 高相似度
  θ接近90°：方向垂直 → 内积≈0 → 无关
  θ接近180°：方向相反 → 内积最小 → 对立

几何直觉：
  内积 = 方向一致性度量
  注意力权重 = 相关性度量
```

---

## 11.4.5 位置编码：注入结构信息

### 问题：注意力无顺序信息

```
问题：自注意力是集合操作

句子："The cat chased the dog"
句子："The dog chased the cat"

自注意力输出：
  相同！因为token集合相同
  
分析：
  自注意力只看内容，不看位置
  "cat在位置1"和"cat在位置3"无法区分
  
问题：
  如何注入位置信息？
```

### 位置编码方案

```
方案1：绝对位置编码（Sinusoidal）

PE(pos, 2i) = sin(pos / 10000^(2i/d))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d))

直觉：
  不同位置有唯一编码
  使用不同频率的正弦波组合
  
  低频：区分全局位置（如pos=0 vs pos=100）
  高频：区分局部位置（如pos=0 vs pos=1）
  
方案2：相对位置编码

注意力分数 = Q @ K^T + relative_bias(i-j)

直觉：
  只关心相对距离（i-j）
  不关心绝对位置
  
方案3：旋转位置编码（RoPE）

向量旋转：位置p的向量旋转 p × θ

直觉：
  复数旋转：e^(iθ) 表示旋转θ
  旋转角度编码位置
  
关键性质：
  Q[i] · K[j] 内积只依赖于相对位置 i-j
  因为旋转差 = 角度差 = 位置差
```

### 算法实现

```python
def sinusoidal_position_encoding(seq_len, d_model):
    """
    正弦位置编码
    
    seq_len: 序列长度
    d_model: 向量维度
    """
    import numpy as np
    
    position = np.arange(seq_len).reshape(-1, 1)
    
    # 计算分母：10000^(2i/d)
    div_term = np.exp(
        np.arange(0, d_model, 2) * (-np.log(10000.0) / d_model)
    )
    
    # 创建编码矩阵
    PE = np.zeros((seq_len, d_model))
    
    # 奇偶维度分别赋值
    PE[:, 0::2] = np.sin(position * div_term)  # 偶数维度：sin
    PE[:, 1::2] = np.cos(position * div_term)  # 奇数维度：cos
    
    return PE

# 测试
PE = sinusoidal_position_encoding(100, 512)
print(f"位置编码矩阵：{PE.shape}")
print(f"位置0的编码：{PE[0, :8]}")
print(f"位置1的编码：{PE[1, :8]}")
```

---

## 11.4.6 与前章节关联

### 对照表：向量空间 vs Ch4 图嵌入

| 维度 | Ch4 图嵌入 | 11.4 向量表示 | 关联强度 |
|------|-----------|--------------|---------|
| **嵌入对象** | 图节点 | Token | 强 |
| **相似度度量** | 节点距离 | 向量内积 | 强 |
| **聚类现象** | 相似节点聚类 | 相似词聚类 | 强 |
| **几何直觉** | 距离=相似性 | 内积=相似性 | 强 |
| **位置编码** | 节点标记 | 位置编码 | 中 |

### 知识卡片 C11-11：向量空间几何

```
概念：向量空间是语义的几何编码

关键几何：
  内积 = 相似度（余弦）
  距离 = 差异度
  方向 = 语义轴
  加法 = 语义组合

算法应用：
  语义搜索：最近邻查找
  聚类分析：语义分组
  分类边界：向量划分

关联：
  Z-图嵌入（Ch4）
  Z-几何直觉
```

### 知识卡片 C11-12：位置编码设计

```
概念：位置编码是结构约束的注入方式

方案对比：
  Sinusoidal：绝对位置，预计算
  Learned：绝对位置，可学习
  RoPE：相对位置，旋转编码
  ALiBi：相对位置，线性衰减

算法本质：
  结构信息注入（类似图节点标记）

关联：
  Z-节点标记（Ch4）
  Z-编码策略
```

---

## 11.4.7 可视化建议

### 1. 向量空间t-SNE可视化

```
降维展示词向量聚类：

步骤：
  1. 提取词向量（如GloVe或BERT嵌入）
  2. 用t-SNE降维到2D
  3. 观察聚类模式

预期模式：
  动物聚类：{cat, dog, bird, fish}
  动作聚类：{run, jump, swim, fly}
  抽象聚类：{love, hope, dream, fear}

可视化代码：
  from sklearn.manifold import TSNE
  import matplotlib.pyplot as plt
  
  # 降维
  tsne = TSNE(n_components=2)
  vectors_2d = tsne.fit_transform(word_vectors)
  
  # 绘图
  plt.scatter(vectors_2d[:, 0], vectors_2d[:, 1])
  for i, word in enumerate(words):
      plt.annotate(word, (vectors_2d[i, 0], vectors_2d[i, 1]))
  plt.show()
```

### 2. 位置编码热图

```
展示不同位置的编码模式：

内容：
  X轴：向量维度（0到d）
  Y轴：位置（0到seq_len）
  颜色：编码值（sin/cos）

预期模式：
  低频维度：平滑变化（区分全局位置）
  高频维度：快速振荡（区分局部位置）
```

### 3. Token化流程图

```
流程展示：

  原始文本
     ↓
  分词（空格/BPE/字符）
     ↓
  映射（词表查表）
     ↓
  嵌入（向量表查找）
     ↓
  +位置编码
     ↓
  输入向量序列

每步标注示例：
  "algorithm" → ["algo", "rithm"] → [234, 567] → [[0.8,...], [0.7,...]]
```

---

## 11.4.8 代码示例

### Tokenizer实现

```python
class SimpleTokenizer:
    """
    简化Token化实现（教学版）
    """
    def __init__(self, vocab):
        self.vocab = vocab  # {word: id}
        self.inv_vocab = {v: k for k, v in vocab.items()}
        self.unk_id = vocab.get('<unk>', 0)
    
    def tokenize(self, text):
        """
        分词：简单空格切分
        """
        # 预处理：小写化
        text = text.lower()
        
        # 空格切分
        words = text.split()
        
        return words
    
    def encode(self, text):
        """
        文本 → token IDs
        """
        words = self.tokenize(text)
        
        # 映射到ID
        ids = []
        for word in words:
            if word in self.vocab:
                ids.append(self.vocab[word])
            else:
                ids.append(self.unk_id)
        
        return ids
    
    def decode(self, ids):
        """
        token IDs → 文本
        """
        words = [self.inv_vocab.get(id, '<unk>') for id in ids]
        return ' '.join(words)

# 使用示例
vocab = {
    'algorithm': 1,
    'is': 2,
    'useful': 3,
    'the': 4,
    'cat': 5,
    '<unk>': 0
}

tokenizer = SimpleTokenizer(vocab)

text = "The algorithm is useful"
ids = tokenizer.encode(text)
print(f"编码：{ids}")
decoded = tokenizer.decode(ids)
print(f"解码：{decoded}")
```

### Embedding实现

```python
import numpy as np

class EmbeddingLayer:
    """
    嵌入层实现
    
    空间复杂度：O(vocab_size × d_model)
    """
    def __init__(self, vocab_size, d_model):
        self.vocab_size = vocab_size
        self.d_model = d_model
        
        # 初始化向量表（可学习）
        self.embedding_table = np.random.randn(vocab_size, d_model) * 0.01
    
    def forward(self, token_ids):
        """
        token IDs → 向量
        
        token_ids: [batch, seq_len]
        output: [batch, seq_len, d_model]
        """
        # 查表
        embeddings = self.embedding_table[token_ids]
        
        return embeddings
    
    def lookup_similar(self, vector, top_k=5):
        """
        反向查找：最接近的token
        
        用于语义搜索
        """
        # 计算与所有词的相似度
        similarities = self.embedding_table @ vector
        
        # 排序取top_k
        top_indices = np.argsort(similarities)[-top_k:]
        
        return top_indices, similarities[top_indices]

# 使用示例
embedding = EmbeddingLayer(vocab_size=10000, d_model=512)

# 查找向量
token_ids = [1, 2, 3]  # "algorithm is useful"
vectors = embedding.forward(token_ids)
print(f"向量形状：{vectors.shape}")

# 语义搜索
query_vector = vectors[0]  # "algorithm"的向量
similar_ids, scores = embedding.lookup_similar(query_vector, top_k=5)
print(f"与'algorithm'最相似的词：{similar_ids}")
```

### 完整嵌入（含位置编码）

```python
class TransformerEmbedding:
    """
    完整Transformer嵌入层
    
    Token嵌入 + 位置编码
    """
    def __init__(self, vocab_size, d_model, max_seq_len=512):
        self.token_embedding = EmbeddingLayer(vocab_size, d_model)
        self.position_embedding = sinusoidal_position_encoding(max_seq_len, d_model)
    
    def forward(self, token_ids):
        """
        token_ids: [batch, seq_len]
        """
        batch_size, seq_len = token_ids.shape
        
        # Token嵌入
        token_emb = self.token_embedding.forward(token_ids)
        
        # 位置编码
        pos_emb = self.position_embedding[:seq_len]
        
        # 合并
        output = token_emb + pos_emb
        
        return output

# 使用示例
full_embedding = TransformerEmbedding(vocab_size=10000, d_model=512)

token_ids = np.array([[1, 2, 3]])  # batch=1, seq_len=3
output = full_embedding.forward(token_ids)
print(f"完整嵌入形状：{output.shape}")
```

---

## 11.4.9 练习设计

### 基础理解题（3题）

#### 练习 1：Token化分析

```
词表：{algorithm: 1, is: 2, useful: 3, <unk>: 0}

输入："The algorithm works well"

任务：
a) 输出token IDs？
b) 未知token如何处理？
c) BPE如何改进？

分析：
a) 输出：
   ["the", "algorithm", "works", "well"]
   → ["<unk>", 1, "<unk>", "<unk>"]
   → [0, 1, 0, 0]
   
   问题：大量未知词
   
b) 未知token处理：
   映射到<unk>（ID=0）
   问题：无法区分不同未知词
   
c) BPE改进：
   子词切分：
     "works" → ["work", "s"]
     "well" → ["wel", "l"]
   
   若词表包含子词：
     可以表示更多词
     减少<unk>数量
```

#### 练习 2：向量空间几何计算

```
向量：
  king = [0.8, 0.2]
  queen = [0.7, 0.3]
  man = [0.2, 0.8]
  woman = [0.1, 0.9]

任务：
a) 计算 king - man + woman
b) 与queen的余弦相似度？
c) 解释语义关系

计算：
a) king - man + woman：
   = [0.8, 0.2] - [0.2, 0.8] + [0.1, 0.9]
   = [0.6, -0.6] + [0.1, 0.9]
   = [0.7, 0.3]
   
b) 余弦相似度：
   result = [0.7, 0.3]
   queen = [0.7, 0.3]
   
   cosine = (0.7×0.7 + 0.3×0.3) / (|result| × |queen|)
   = 0.58 / (sqrt(0.58) × sqrt(0.58))
   = 0.58 / 0.58
   = 1.0  # 完全相同！
   
c) 语义解释：
   king - man 编码"去除男性属性"
   + woman 编码"添加女性属性"
   结果 ≈ queen
   
   这展示了向量空间编码语义变换的能力
```

#### 练习 3：位置编码分析

```
位置编码：PE(pos) = sin(pos / 10000^(i/d))

任务：
a) PE(0) 和 PE(1) 的区别？
b) PE(100) 和 PE(101) 的区别？
c) 为什么用sin/cos？

分析：
a) PE(0) vs PE(1)：
   低频维度：差异小（sin(0)≈0, sin(0.001)≈0.001）
   高频维度：差异大（sin(0)≈0, sin(10)≈-0.5）
   
   结论：局部位置主要由高频维度区分
   
b) PE(100) vs PE(101)：
   低频维度：差异小（sin(100/10000)≈0.01）
   高频维度：差异大
   
   结论：全局位置主要由低频维度区分
   
c) sin/cos原因：
   1. 唯一性：每个位置有唯一编码
   2. 连续性：相邻位置编码接近
   3. 可学习相对位置：
      PE(pos+k)可以通过PE(pos)线性变换得到
```

### 方法应用题（2题）

#### 练习 4：语义搜索实现

```
任务：实现语义搜索引擎

输入：查询文本、文档集合、预训练向量
输出：相似度排序的文档

要求：
a) 实现余弦相似度
b) 实现Top-K检索
c) 优化检索效率

实现：
def semantic_search(query_vec, doc_vectors, top_k=10):
    """
    语义搜索
    """
    # 余弦相似度
    similarities = doc_vectors @ query_vec
    norms = np.linalg.norm(doc_vectors, axis=1) * np.linalg.norm(query_vec)
    cosine_sims = similarities / norms
    
    # Top-K排序
    top_indices = np.argsort(cosine_sims)[-top_k:]
    
    return top_indices, cosine_sims[top_indices]

优化建议：
  1. 归一化向量：提前归一化，避免每次计算
  2. 近似检索：用ANN（近似最近邻）如HNSW
  3. 并行计算：GPU加速矩阵乘法
```

#### 练习 5：位置编码设计

```
任务：设计相对位置编码

方案：注意力分数 = QK^T + bias(i-j)

要求：
a) 实现相对位置偏置
b) 对比绝对位置编码
c) 分析优劣

实现：
def relative_position_attention(Q, K, V, max_relative_pos=32):
    """
    相对位置编码注意力
    """
    n = Q.shape[0]
    
    # 相对位置偏置矩阵
    # bias[i][j] = relative_bias[i-j]
    relative_bias = np.random.randn(2 * max_relative_pos + 1)
    
    bias_matrix = np.zeros((n, n))
    for i in range(n):
        for j in range(n):
            rel_pos = i - j
            if abs(rel_pos) <= max_relative_pos:
                bias_matrix[i][j] = relative_bias[rel_pos + max_relative_pos]
    
    # 注意力计算
    scores = Q @ K.T + bias_matrix
    attention = softmax_matrix(scores)
    output = attention @ V
    
    return output

对比分析：
  绝对位置：
    优点：简单，预计算
    缺点：无法外推（超出训练长度）
    
  相对位置：
    优点：可外推，只关心相对距离
    缺点：需要额外偏置矩阵
```

### LLM协同题（1题）

#### 练习 6：Token化审查

```
让LLM设计多语言Token化方案

任务：
a) 提供问题描述
b) 让LLM生成方案
c) 审查方案质量

审查要点：
┌─────────────────────────────────────────────┐
│ 多语言公平性：                              │
│   不同语言的切分效率是否公平？              │
│   中文/英文的词表大小是否平衡？             │
│                                            │
│ 词表大小权衡：                              │
│   词表太小 → 大量<unk>                     │
│   词表太大 → 内存和计算成本高               │
│                                            │
│ 未知token处理：                             │
│   如何处理罕见词？                          │
│   是否有fallback策略？                      │
└─────────────────────────────────────────────┘

提交审查报告
```

---

## 11.4.10 设计反思

### 教学要点总结

| 要点 | 教学策略 |
|------|---------|
| **直觉先行** | 从符号→向量对比引入，公式前有几何直觉 |
| **算法视角** | Token化作为三步算法流程 |
| **问题驱动** | War Story展示代码处理困境 |
| **跨章节关联** | 对照Ch3哈希映射、Ch4图嵌入 |
| **可视化** | t-SNE聚类、位置编码热图 |

### 常见误解澄清

| 误解 | 澄清 |
|------|------|
| "Token就是词" | Token可以是子词、字符，粒度可调 |
| "向量空间神秘" | 向量空间是语义的几何编码 |
| "位置编码只是加法" | 位置编码是结构约束注入 |

### 知识卡片清单

| 编号 | 卡片标题 | 本节位置 |
|------|---------|---------|
| C11-10 | Token化算法 | 11.4.3 |
| C11-11 | 向量空间几何 | 11.4.4 |
| C11-12 | 位置编码设计 | 11.4.5 |
| C11-17 | 向量相似度检索 | 11.4.4 |
| C11-19 | 语义方向向量 | 11.4.4 |

---

*下一节：11.5 LLM时代的算法问题 —— 生成、检索、压缩如何协同？*
