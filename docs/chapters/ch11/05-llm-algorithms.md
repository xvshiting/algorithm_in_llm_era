# 11.5 LLM时代的算法问题

> **核心洞察**：LLM时代的新问题可以还原为经典算法问题：采样策略是贪心vs随机的权衡，上下文压缩是缓存淘汰策略，RAG是两阶段检索流程。理解算法本质，才能有效应用和优化。

---

## 11.5.1 开篇直觉：新问题，旧算法

**生成、检索、压缩的算法视角**：

```
问题1：如何生成？
  场景：生成一篇1000字的文章
  
  传统算法：贪心选择概率最高的词
  问题：生成内容单调，陷入重复
  
  温度采样：调整概率分布
  温度低：更确定，单调
  温度高：更随机，多样
  
  算法本质：贪心vs随机权衡（Ch5对照）

问题2：如何利用外部知识？
  场景：回答"什么是KV-cache？"
  
  传统算法：固定上下文窗口
  问题：窗口外的知识无法利用
  
  RAG：检索增强生成
  两阶段：先检索相关文档，再生成答案
  
  算法本质：两阶段检索流程（Ch3对照）

问题3：如何压缩长上下文？
  场景：10000字对话历史
  
  传统算法：截断
  问题：关键信息丢失
  
  压缩算法：摘要、选择性保留
  算法本质：缓存淘汰策略（Ch2对照）

关键洞察：
┌────────────────────────────────────────────┐
│ LLM时代的算法问题 → 经典算法问题的泛化      │
│                                            │
│ 采样策略 → 贪心vs随机权衡                  │
│ RAG检索 → 两阶段检索流程                   │
│ 上下文压缩 → 缓存淘汰策略                  │
└────────────────────────────────────────────┘
```

---

## 11.5.2 问题驱动：生成单调的困境

### War Story：产品描述生成失败

**场景**：

```
任务：生成产品描述

输入："这个产品"

问题1：贪心生成（温度=0）
  输出："这个产品很好很好很好..."
  问题：陷入重复模式
  
  分析：
    模型预测："很好"概率最高
    生成"很好"后，下个词仍是"很好"概率最高
    循环：很好 → 很好 → 很好...
    
问题2：温度过高（温度=5）
  输出："这个产品香蕉飞机云彩..."
  问题：完全不相关，随机混乱
  
  分析：
    高温使概率分布趋于均匀
    所有词概率接近
    随机采样 → 任何词都可能被选中

问题3：平衡方案
  温度=1.0 + Top-K=50
  
  输出："这个产品设计精美，功能强大..."
  质量：连贯且有一定多样性
  
关键问题：
  如何平衡确定性和多样性？
```

---

## 11.5.3 采样策略：确定性与随机性的平衡

### 算法定义

```
生成过程：
  输入：上下文 [x₁, x₂, ..., xₙ]
  输出：下一个token x_{n+1}
  
步骤：
  1. 模型预测概率分布：P(x_{n+1} | x₁...xₙ)
  2. 采样策略：根据P选择x_{n+1}

采样策略对比：
┌─────────────────────────────────────────────┐
│ 1. 贪心采样（温度=0）：                      │
│    x_{n+1} = argmax P(x)                    │
│    问题：单调，容易重复                      │
│                                            │
│ 2. 温度采样：                                │
│    P'(x) = softmax(logits / T)              │
│    T→0：趋于贪心（确定）                     │
│    T→∞：趋于均匀（随机）                     │
│                                            │
│ 3. Top-K采样：                               │
│    只从概率最高的K个token中采样              │
│    P'(x) = P(x) / sum(P(top_k))            │
│                                            │
│ 4. Top-P（Nucleus）采样：                    │
│    只从累积概率达到P的token中采样            │
│    动态调整候选集大小                        │
└─────────────────────────────────────────────┘
```

### 温度调节的数学直觉

```
温度参数效果：

logits = [2.0, 1.0, 0.1]  # 原始分数

温度T=0.1（低温）：
  scaled = [20.0, 10.0, 1.0]
  P' ≈ [0.99, 0.01, 0.00]  # 几乎确定选第一个
  
温度T=1.0（正常）：
  scaled = [2.0, 1.0, 0.1]
  P' = softmax([2.0, 1.0, 0.1])
     = [0.65, 0.24, 0.11]
  
温度T=10（高温）：
  scaled = [0.2, 0.1, 0.01]
  P' ≈ [0.35, 0.33, 0.32]  # 趋于均匀

直觉：
  温度调节概率分布的"陡峭度"
  低温：分布陡峭 → 高概率词主导
  高温：分布平坦 → 更均匀随机
```

### 与Ch5对照：贪心算法局限

| Ch5 贪心算法 | 11.5 采样策略 | 算法本质 |
|-------------|--------------|---------|
| **每步最优** | **贪心采样** | 局部最优 |
| **陷入循环** | **重复陷阱** | 贪心局限 |
| **全局次优** | **单调生成** | 缺乏探索 |
| **随机改进** | **温度采样** | 探索vs利用 |

**算法启示**：

> 温度采样是"贪心vs随机"权衡的算法化。
> 类似随机算法（Ch5）的思想：允许次优选择以避免陷阱。

---

## 11.5.4 RAG：两阶段检索流程

### 算法定义

```
RAG（Retrieval-Augmented Generation）：

阶段1：检索
  输入：用户问题
  输出：相关文档列表
  
  算法：向量相似度搜索
  
  流程：
    1. 编码问题：query_vec = encoder(query)
    2. 搜索相似文档：
       for doc in knowledge_base:
           doc_vec = encoder(doc)
           sim = cosine(query_vec, doc_vec)
    3. 排序取Top-K

阶段2：生成
  输入：问题 + 检索文档
  输出：答案
  
  流程：
    1. 组装上下文：
       context = query + "\n参考资料：\n" + docs
    2. 生成答案：
       answer = generator(context)
```

### 与Ch3对照：检索演进

| Ch3 传统检索 | 11.5 RAG检索 | 演进点 |
|-------------|--------------|-------|
| **关键词匹配** | **向量相似度** | 精确→语义 |
| **单一索引** | **向量数据库** | 结构升级 |
| **硬返回** | **软融合** | 结果处理 |
| **无生成** | **检索+生成** | 流程扩展 |

**两阶段算法本质**：

```
阶段1：检索（Ch3思想的泛化）
  传统：精确匹配，关键词索引
  RAG：语义匹配，向量索引
  
  相同点：都是查找问题
  不同点：匹配方式从精确→相似

阶段2：生成（注意力融合）
  检索文档拼接到输入
  Transformer注意力融合检索信息
  
  算法本质：信息融合（Ch4图的邻居聚合）

关键洞察：
  RAG = 检索算法 + 信息融合算法
```

---

## 11.5.5 上下文压缩：缓存淘汰策略

### 问题场景

```
场景：对话系统，历史累积

对话历史：10000字
当前窗口：4096 token
问题：前6000字被截断

关键信息可能在前6000字：
  用户偏好："我喜欢科幻电影"
  约束条件："预算不超过500元"
  
截断后果：
  偏好丢失 → 推荐不符合用户口味
  约束丢失 → 建议超出预算
```

### 压缩策略

```
策略1：滑动窗口（类似LRU）
  保留最近N个token
  删除最旧的token
  
  算法：
    if len(history) > max_len:
        history = history[-max_len:]
  
  问题：早期信息丢失

策略2：选择性保留（类似LFU）
  识别"重要"token，优先保留
  
  重要性指标：
    1. 接收的总注意力权重
    2. 对生成结果的影响度
    3. 人工标注的关键信息
  
  算法：
    importance = compute_importance(history)
    keep_indices = top_k(importance, max_len)
    compressed = history[keep_indices]

策略3：摘要压缩
  用LLM生成摘要替代历史
  
  算法：
    summary = llm.summarize(history)
    compressed = summary + recent_tokens
  
  优点：保留语义，节省空间
  问题：摘要质量依赖模型

策略4：分层压缩
  近期：完整保留（高精度）
  远期：摘要压缩（低精度）
  
  类似CPU缓存分层（L1/L2/L3）
```

### 与Ch2对照：缓存淘汰

| Ch2 缓存淘汰 | 11.5 上下文压缩 | 算法本质 |
|-------------|----------------|---------|
| **LRU** | **滑动窗口** | 时间淘汰 |
| **LFU** | **重要性保留** | 频率淘汰 |
| **空间约束** | **GPU内存限制** | 相同约束 |
| **过期策略** | **压缩策略** | 信息选择 |

---

## 11.5.6 与前章节关联

### 对照表：LLM算法 vs 经典算法

| 本节内容 | 关联章节 | 关联点 | 关联强度 |
|---------|---------|--------|---------|
| 温度采样 | Ch5 贪心算法 | 贪心vs随机权衡 | 强 |
| Top-K采样 | Ch10 蓄水池 | 候选范围限制 | 中 |
| RAG检索 | Ch3 查找 | 向量相似度搜索 | 强 |
| RAG融合 | Ch4 图传播 | 信息聚合 | 中 |
| 上下文压缩 | Ch2 缓存 | 淘汰策略 | 强 |
| Sink保留 | Ch4 中心节点 | 信息枢纽 | 中 |

### 知识卡片 C11-13：温度采样权衡

```
概念：温度采样是贪心vs随机权衡的算法化

数学：
  P'(x) = softmax(logits / T)
  
温度效果：
  T→0：贪心（确定）
  T→∞：均匀（随机）
  
算法本质：
  探索vs利用权衡
  
关联：
  Z-贪心局限（Ch5）
  Z-随机算法
```

### 知识卡片 C11-16：RAG两阶段流程

```
概念：RAG是检索+生成的两阶段流程

阶段1：检索
  向量相似度搜索
  类似Ch3查找（精确→语义）

阶段2：生成
  注意力融合检索信息
  类似Ch4聚合（邻居信息融合）

算法本质：
  两阶段协同
  
关联：
  Z-查找算法（Ch3）
  Z-信息聚合（Ch4）
```

---

## 11.5.7 可视化建议

### 1. 采样分布对比

```
图表内容：
  三种温度下的概率分布柱状图
  
  T=0.1：
    柱状图：最高词柱很高，其他几乎为0
    
  T=1.0：
    柱状图：有差异，但分布较平滑
    
  T=10：
    柱状图：所有柱接近，趋于均匀

标注：
  T低：确定性高，单调风险
  T高：多样性高，混乱风险
```

### 2. RAG两阶段流程图

```
流程展示：

  用户问题
     ↓
  ┌─────────────┐
  │ 阶段1：检索  │
  │ 向量编码    │
  │ 相似度搜索  │
  │ Top-K返回   │
  └─────────────┘
     ↓
  相关文档列表
     ↓
  ┌─────────────┐
  │ 阶段2：生成  │
  │ 上下文组装  │
  │ 注意力融合  │
  │ 答案生成    │
  └─────────────┘
     ↓
  最终答案

标注每个阶段的算法本质：
  检索：向量查找（Ch3泛化）
  融合：信息聚合（Ch4泛化）
```

### 3. 压缩策略对比

```
可视化三种压缩策略的效果：

滑动窗口：
  保留：最近N token
  丢失：早期关键信息
  效果：局部连贯，长距离丢失
  
选择性保留：
  保留：高重要性token
  丢失：低重要性token
  效果：关键信息保留，次要丢失
  
摘要压缩：
  保留：语义摘要
  丢失：具体细节
  效果：语义保留，细节丢失
```

---

## 11.5.8 代码示例

### 采样策略实现

```python
import numpy as np

def sample_with_temperature(logits, temperature=1.0):
    """
    温度采样
    
    logits: [vocab_size]
    temperature: 温度参数
    """
    # 温度调整
    scaled_logits = logits / temperature
    
    # softmax归一化
    exp_logits = np.exp(scaled_logits - np.max(scaled_logits))
    probs = exp_logits / np.sum(exp_logits)
    
    # 采样
    token = np.random.choice(len(probs), p=probs)
    
    return token

def sample_top_k(logits, k):
    """
    Top-K采样
    
    logits: [vocab_size]
    k: 只从top-k候选中采样
    """
    # 找到top-k
    top_k_indices = np.argsort(logits)[-k:]
    top_k_logits = logits[top_k_indices]
    
    # 归一化
    exp_logits = np.exp(top_k_logits - np.max(top_k_logits))
    probs = exp_logits / np.sum(exp_logits)
    
    # 采样
    selected_idx = np.random.choice(k, p=probs)
    
    return top_k_indices[selected_idx]

def sample_top_p(logits, p):
    """
    Top-P（Nucleus）采样
    
    logits: [vocab_size]
    p: 累积概率阈值
    """
    # 按概率降序排序
    probs = np.exp(logits - np.max(logits))
    probs = probs / np.sum(probs)
    
    sorted_indices = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_indices]
    
    # 找到累积概率超过p的位置
    cum_probs = np.cumsum(sorted_probs)
    cutoff_idx = np.searchsorted(cum_probs, p)
    
    # 只从累积概率≤p的候选中采样
    nucleus_indices = sorted_indices[:cutoff_idx+1]
    nucleus_probs = probs[nucleus_indices]
    nucleus_probs = nucleus_probs / np.sum(nucleus_probs)
    
    # 采样
    selected_idx = np.random.choice(len(nucleus_indices), p=nucleus_probs)
    
    return nucleus_indices[selected_idx]

# 测试对比
def test_sampling():
    """
    测试不同采样策略
    """
    logits = np.array([3.0, 2.0, 1.0, 0.1])
    
    print("原始logits:", logits)
    
    # 温度采样对比
    for T in [0.1, 1.0, 10.0]:
        probs = np.exp(logits/T) / np.sum(np.exp(logits/T))
        print(f"温度{T}分布:", probs)
    
    # Top-K
    for k in [2, 3]:
        token = sample_top_k(logits, k)
        print(f"Top-{k}采样:", token)
    
    # Top-P
    for p in [0.9, 0.8]:
        token = sample_top_p(logits, p)
        print(f"Top-P={p}采样:", token)

test_sampling()
```

### RAG实现

```python
class SimpleRAG:
    """
    简化RAG实现（教学版）
    """
    def __init__(self, encoder, generator, knowledge_base):
        self.encoder = encoder
        self.generator = generator
        self.knowledge_base = knowledge_base
        
        # 预编码知识库
        self.doc_vectors = self.encode_knowledge_base()
    
    def encode_knowledge_base(self):
        """
        预编码所有文档
        """
        vectors = []
        for doc in self.knowledge_base:
            vec = self.encoder.encode(doc)
            vectors.append(vec)
        return np.array(vectors)
    
    def retrieve(self, query, top_k=5):
        """
        检索阶段：向量相似度搜索
        """
        # 编码查询
        query_vec = self.encoder.encode(query)
        
        # 计算相似度
        similarities = self.doc_vectors @ query_vec
        
        # 排序取top_k
        top_indices = np.argsort(similarities)[-top_k:]
        
        # 返回文档
        retrieved_docs = [self.knowledge_base[i] for i in top_indices]
        
        return retrieved_docs, similarities[top_indices]
    
    def generate(self, query, retrieved_docs):
        """
        生成阶段：基于检索文档生成答案
        """
        # 组装上下文
        context = f"问题：{query}\n\n参考资料：\n"
        for i, doc in enumerate(retrieved_docs):
            context += f"{i+1}. {doc}\n"
        context += "\n答案："
        
        # 生成答案
        answer = self.generator.generate(context)
        
        return answer
    
    def answer(self, query, top_k=5):
        """
        RAG完整流程
        """
        # 检索
        docs, scores = self.retrieve(query, top_k)
        
        # 生成
        answer = self.generate(query, docs)
        
        return answer, docs, scores

# 模拟组件
class MockEncoder:
    def encode(self, text):
        # 简化：随机向量（实际用预训练模型）
        return np.random.randn(512)

class MockGenerator:
    def generate(self, context):
        # 简化：返回固定答案
        return "这是基于检索资料的答案。"

# 使用示例
knowledge_base = [
    "KV-cache是一种缓存策略，用于优化Transformer生成。",
    "自注意力是可学习的相似度检索。",
    "线性注意力将复杂度从O(n²)降到O(n×d²)。"
]

encoder = MockEncoder()
generator = MockGenerator()
rag = SimpleRAG(encoder, generator, knowledge_base)

query = "什么是KV-cache？"
answer, docs, scores = rag.answer(query)
print(f"答案：{answer}")
print(f"检索文档：{docs}")
```

---

## 11.5.9 练习设计

### 基础理解题（3题）

#### 练习 1：温度采样计算

```
logits = [2.0, 1.0, 0.5]

任务：
a) T=0.5时的概率分布？
b) T=2.0时的概率分布？
c) 分析温度对生成的影响

计算：
a) T=0.5：
  scaled = [4.0, 2.0, 1.0]
  exp = [54.6, 7.4, 2.7]
  P = [54.6/64.7, 7.4/64.7, 2.7/64.7]
    ≈ [0.84, 0.11, 0.04]
  
  效果：概率更陡峭，选第一个词概率84%
  
b) T=2.0：
  scaled = [1.0, 0.5, 0.25]
  exp = [2.7, 1.6, 1.3]
  P ≈ [0.49, 0.29, 0.22]
  
  效果：概率更平坦，选第一个词概率49%
  
c) 影响分析：
  T低：确定性高，单调风险
  T高：多样性高，混乱风险
  建议T=0.7-1.5平衡
```

#### 练习 2：Top-K vs Top-P

```
概率分布：[0.4, 0.3, 0.2, 0.1]

任务：
a) Top-K=2的候选token？
b) Top-P=0.8的候选token？
c) 分析两种方法的区别

分析：
a) Top-K=2：
  只保留前2个概率最高的token
  候选：token1（0.4）、token2（0.3）
  重新归一化：
    P' = [0.4/0.7, 0.3/0.7] = [0.57, 0.43]
  
b) Top-P=0.8：
  累积概率：
    token1: 0.4
    token1+2: 0.7
    token1+2+3: 0.9  ← 超过0.8
  
  候选：token1、token2、token3
  重新归一化：
    P' = [0.4/0.9, 0.3/0.9, 0.2/0.9]
  
c) 区别：
  Top-K：固定候选数量
  Top-P：动态候选数量（根据分布）
  
  分布集中时Top-P候选少
  分布分散时Top-P候选多
  
  Top-P更灵活自适应
```

#### 练习 3：RAG流程分析

```
查询："什么是KV-cache？"
知识库：[文档1, 文档2, ..., 文档100]

任务：
a) 检索阶段如何工作？
b) 生成阶段如何工作？
c) 如何改进检索质量？

分析：
a) 检索阶段：
  1. 编码查询：query_vec = encoder(query)
  2. 编码文档：for doc in KB, doc_vec = encoder(doc)
  3. 相似度：sim = cosine(query_vec, doc_vec)
  4. 排序：取Top-K相似文档
  
b) 生成阶段：
  1. 组装上下文：query + retrieved_docs
  2. 注意力融合：query关注检索文档
  3. 生成答案：基于融合信息生成
  
c) 改进检索：
  1. 更好的编码器（语义理解更强）
  2. 混合检索（关键词+向量）
  3. 重排序（二次筛选）
  4. 多轮检索（根据答案补充检索）
```

### 方法应用题（2题）

#### 练习 4：采样策略设计

```
场景：对话生成

需求：
  - 避免重复
  - 保持相关性
  - 有一定创造性

任务：
a) 设计采样策略
b) 选择参数（温度、Top-K、Top-P）
c) 实现并测试

设计：
a) 策略组合：
  温度采样 + Top-P采样 + 重复惩罚
  
  重复惩罚：
    if token in recent_tokens:
        logits[token] -= penalty
  
b) 参数建议：
  温度：T=0.9（略高于1，保持多样性）
  Top-P：p=0.95（保留95%概率质量）
  重复惩罚：penalty=1.0（降低重复词概率）
  
c) 实现测试：
  测试对话生成，观察：
    是否有重复？
    是否相关？
    是否有创造性？
```

#### 练习 5：上下文压缩

```
场景：长对话压缩

输入：10000字对话
窗口：4096 token

任务：
a) 设计压缩策略
b) 实现重要性评分
c) 评估压缩质量

设计：
a) 策略：摘要 + 选择性保留混合
  
  近期1000字：完整保留
  中期：摘要压缩
  远期：选择性保留关键信息

b) 重要性评分算法：
  def compute_importance(tokens, model):
      # 方法1：注意力权重总和
      attention_sum = sum(model.get_attention(tokens), axis=0)
      
      # 方法2：信息熵（熵低=信息密集）
      entropy = compute_entropy(tokens)
      
      # 方法3：关键词检测
      keywords = detect_keywords(tokens)
      
      # 综合评分
      importance = 0.5*attention_sum + 0.3*entropy + 0.2*keywords
      
      return importance

c) 评估方法：
  测试压缩后的生成质量：
    关键信息是否保留？
    对话连贯性？
    信息完整性？
```

### LLM协同题（1题）

#### 练习 6：RAG系统设计审查

```
让LLM设计RAG系统架构

任务：
a) 提供需求描述
b) 让LLM生成架构设计
c) 审查方案质量

审查要点：
┌─────────────────────────────────────────────┐
│ 检索效率：                                  │
│   是否考虑大规模知识库？                    │
│   是否有向量索引优化？                      │
│                                            │
│ 生成质量：                                  │
│   检索文档如何融合？                        │
│   是否有答案验证机制？                      │
│                                            │
│ 系统复杂度：                                │
│   是否易于实现？                            │
│   是否有容错机制？                          │
└─────────────────────────────────────────────┘

提交审查报告
```

---

## 11.5.10 设计反思

### 教学要点总结

| 要点 | 教学策略 |
|------|---------|
| **直觉先行** | 从生成单调场景引入采样策略问题 |
| **算法视角** | 采样、RAG、压缩还原为经典算法 |
| **问题驱动** | War Story展示生成失败案例 |
| **跨章节关联** | 对照Ch5贪心、Ch3查找、Ch2缓存 |
| **可视化** | 采样分布对比、RAG流程图 |

### 常见误解澄清

| 误解 | 澄清 |
|------|------|
| "温度神秘参数" | 温度是贪心vs随机权衡的数学化 |
| "RAG只是检索" | RAG是检索+融合的两阶段流程 |
| "压缩只是截断" | 压缩是缓存淘汰策略的应用 |

### 知识卡片清单

| 编号 | 卡片标题 | 本节位置 |
|------|---------|---------|
| C11-13 | 温度采样权衡 | 11.5.3 |
| C11-14 | Top-K/Top-P采样 | 11.5.3 |
| C11-15 | 上下文压缩策略 | 11.5.5 |
| C11-16 | RAG两阶段流程 | 11.5.4 |
| C11-18 | 注意力Sink现象 | 11.5.5 |
| C11-20 | 采样分布可视化 | 11.5.7 |

---

*下一节：11.6 综合练习 —— 理解→应用→诊断→设计*
