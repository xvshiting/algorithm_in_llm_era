# 3.11 从排序到 LLM 采样：随机性是设计

## 这一节，你能解决什么问题

学完这一节，你能够：

1. **理解排序在 LLM 时代的隐藏角色**——它是采样、筛选、去重的基石
2. **分析 Temperature、Top-k、Top-p 的本质**——排序 + 截断 + 随机选择
3. **判断不同场景下的采样参数选择**——不是"越高越好"或"越低越好"
4. **设计"概率换取效率"的验证策略**——类比哈希的设计哲学
5. **为实际业务选择排序策略**——结合数据规模、稳定性、最坏情况等约束

---

## 问题情境

### 场景一：LLM 输出为什么会重复？

你让 GPT 写一首诗。设置 Temperature=0（确定性输出）。

结果：每次输出完全相同，而且可能陷入重复模式。

**问题**：为什么不总是选最高概率的 token？

答案：确定性选择会导致重复、无聊的输出。需要引入随机性。

### 场景二：Top-k 和 Top-p 怎么选？

agent 告诉你：设置 Top-k=50，或者 Top-p=0.9。

你问：这两个参数有什么区别？什么时候用哪个？

agent 说：试一下就知道了。

**问题**：有没有系统性的理解方式？

答案：它们都是"排序 + 截断"策略，只是截断规则不同。

### 场景三：100 万条用户行为日志去重

你收到 100 万条用户行为日志，需要去重后分析。

日志格式：`timestamp, user_id, action, details`

**问题**：用哈希去重，还是先排序再去重？

答案：取决于内存约束。内存足够 → 哈希；内存紧张 → 排序。

---

## 直观思路

### 排序的隐藏角色

排序不只是"从小到大排列"。在 LLM 时代，排序是：

1. **采样的前置**：Top-k 先排序，再截断
2. **去重的基石**：排序后相同元素相邻，O(n) 去重
3. **推荐的核心**：按得分排序，取 Top-N

**关键洞察**：排序 + 截断 是一种通用的"筛选高质量候选"模式。

### 随机性的设计哲学

哈希教给我们：

> 随机性不是缺陷，是可以主动引入的设计。

哈希用随机性换取期望性能。LLM 用随机性换取多样性。

**类比**：

| 哈希设计 | LLM 采样 |
|----------|----------|
| 随机哈希函数 | Temperature |
| Bloom Filter 多候选 | Top-k 保留多个 |
| 可验证假阳性 | 可验证采样结果 |
| 期望 O(1) 查找 | 期望多样性 + 质量 |

---

## 规范定义

### LLM 采样的三阶段模型

**输入**：LLM 输出的 log-probabilities，词汇表大小为 V

**输出**：采样的 token

**三阶段**：

```
1. 排序阶段：将所有 token 按概率排序
   复杂度：O(V log V)

2. 截断阶段：保留部分候选
   Top-k：保留前 k 个
   Top-p：保留累计概率达到 p 的候选
   复杂度：O(k) 或 O(V)

3. 随机选择阶段：Temperature 重整后随机采样
   复杂度：O(1)
```

### Temperature 的数学定义

设原始概率为 p₁, p₂, ..., pₖ，Temperature 为 T。

**重整后的概率**：

```
q_i = exp(log(p_i) / T) / Σ_j exp(log(p_j) / T)
    = p_i^(1/T) / Σ_j p_j^(1/T)
```

**特殊值**：

- T = 0：确定性选择（选最高概率）
- T = 1：原始概率分布
- T → ∞：均匀分布

**效果**：

- T < 1：概率差异放大，倾向高概率 token
- T > 1：概率差异缩小，低概率 token 更有机会

### Top-k 和 Top-p 的定义

**Top-k**：保留概率最高的 k 个 token

```
Top_k(tokens, probs, k):
    sorted = sort_by_prob(tokens, probs)  # O(V log V)
    return sorted[:k]                     # O(k)
```

**Top-p（Nucleus Sampling）**：保留累计概率达到 p 的 token

```
Top_p(tokens, probs, p):
    sorted = sort_by_prob(tokens, probs)  # O(V log V)
    result = []
    cum_prob = 0
    for token, prob in sorted:
        result.append((token, prob))
        cum_prob += prob
        if cum_prob >= p:
            break
    return result
```

### 排序去重 vs 哈希去重

**排序去重**：

```
Sort_Dedup(records):
    sort(records)                    # O(n log n)
    result = []
    for i in range(len(records)):
        if i == 0 or records[i] != records[i-1]:
            result.append(records[i])
    return result                    # O(n)
总复杂度：O(n log n)，空间：O(1)（原地）或 O(n)（需要结果数组）
```

**哈希去重**：

```
Hash_Dedup(records):
    seen = HashSet()
    result = []
    for record in records:
        if record not in seen:
            seen.add(record)
            result.append(record)
    return result
总复杂度：O(n) 期望，空间：O(n)
```

---

## 算法实现

### Top-k 采样实现

```python
import numpy as np

def top_k_sampling(logits, k, temperature=1.0):
    """
    Top-k 采样
    
    参数：
        logits: LLM 输出的 logits (shape: [vocab_size])
        k: 保留的候选数量
        temperature: 温度参数
    
    返回：
        采样的 token 索引
    """
    # 1. Temperature 缩放
    if temperature > 0:
        logits = logits / temperature
    else:
        # T=0: 确定性选择
        return np.argmax(logits)
    
    # 2. 排序
    sorted_indices = np.argsort(logits)[::-1]  # 降序
    
    # 3. 截断
    top_k_indices = sorted_indices[:k]
    top_k_logits = logits[top_k_indices]
    
    # 4. Softmax 归一化
    probs = np.exp(top_k_logits - np.max(top_k_logits))  # 数值稳定
    probs = probs / np.sum(probs)
    
    # 5. 随机采样
    return top_k_indices[np.random.choice(len(top_k_indices), p=probs)]
```

### Top-p 采样实现

```python
def top_p_sampling(logits, p, temperature=1.0):
    """
    Top-p (Nucleus) 采样
    
    参数：
        logits: LLM 输出的 logits (shape: [vocab_size])
        p: 累计概率阈值
        temperature: 温度参数
    
    返回：
        采样的 token 索引
    """
    # 1. Temperature 缩放
    if temperature > 0:
        logits = logits / temperature
    else:
        return np.argmax(logits)
    
    # 2. Softmax 得到概率
    exp_logits = np.exp(logits - np.max(logits))
    probs = exp_logits / np.sum(exp_logits)
    
    # 3. 排序
    sorted_indices = np.argsort(probs)[::-1]
    sorted_probs = probs[sorted_indices]
    
    # 4. 截断（累计概率达到 p）
    cum_probs = np.cumsum(sorted_probs)
    cutoff_idx = np.searchsorted(cum_probs, p) + 1
    
    top_p_indices = sorted_indices[:cutoff_idx]
    top_p_probs = sorted_probs[:cutoff_idx]
    
    # 5. 重新归一化
    top_p_probs = top_p_probs / np.sum(top_p_probs)
    
    # 6. 随机采样
    return top_p_indices[np.random.choice(len(top_p_indices), p=top_p_probs)]
```

### 排序去重实现

```python
def sort_dedup(records, key_func=None):
    """
    排序去重
    
    参数：
        records: 记录列表
        key_func: 用于比较的键函数（可选）
    
    返回：
        去重后的列表
    """
    if key_func:
        sorted_records = sorted(records, key=key_func)
    else:
        sorted_records = sorted(records)
    
    result = []
    for i, record in enumerate(sorted_records):
        if i == 0:
            result.append(record)
        else:
            prev = sorted_records[i-1] if key_func is None else key_func(sorted_records[i-1])
            curr = record if key_func is None else key_func(record)
            if curr != prev:
                result.append(record)
    
    return result
```

---

## 这个方法是怎么想到的

### 从哈希设计到 LLM 采样

**哈希的设计问题**：如何处理冲突？

**方案一**：完美哈希（无冲突）
- 需要预处理，空间可能很大
- 适用场景：静态数据集

**方案二**：链表/开放寻址（处理冲突）
- 期望 O(1)，最坏 O(n)
- 需要处理冲突

**方案三**：Bloom Filter（允许假阳性）
- 多个哈希函数，保留多个候选
- 验证后排除假阳性
- **关键洞察**：概率换取效率

**类比到 LLM 采样**：

**问题**：如何选择下一个 token？

**方案一**：确定性选择（Temperature=0）
- 无随机性
- 问题：重复、无聊

**方案二**：完全随机
- 太混乱

**方案三**：Top-k/Top-p（保留多候选，随机选择）
- 类似 Bloom Filter 的"多候选 + 验证"
- **关键洞察**：排序确定候选，随机选择增加多样性

### 为什么排序是核心？

**观察**：Top-k 和 Top-p 都需要排序。

排序后：
1. 高概率 token 在前
2. 可以快速截断（取前 k 或累计 p）
3. 可以高效去重（相同元素相邻）

**核心模式**：

```
排序 → 截断 → 随机选择
```

这个模式不仅用于 LLM 采样，还用于：
- 推荐：排序 → 取 Top-N → 随机打散
- 去重：排序 → 相邻比较 → 去重
- 采样：排序 → 按概率分布采样

---

## 正确性分析

### Top-k 采样的正确性

**定义**：Top-k 采样从概率最高的 k 个 token 中按温度调整后的概率采样。

**正确性要求**：
1. 保留的确实是概率最高的 k 个
2. 采样概率与温度调整后的分布一致

**证明**：

**断言1**：排序后前 k 个是概率最高的 k 个。

排序算法（如快排、归并）的正确性保证了：
- 输出按概率降序排列
- 所有元素都被排序

因此前 k 个确实是概率最高的 k 个。✓

**断言2**：采样概率与温度调整后的分布一致。

Softmax 的定义：
```
q_i = exp(s_i / T) / Σ_j exp(s_j / T)
```

其中 s_i 是 logits。

随机采样 `np.random.choice(k, p=q)` 服从分布 q。✓

**结论**：Top-k 采样正确实现了"从 top-k 中按温度调整分布采样"。

### Top-p 采样的正确性

**定义**：Top-p 采样保留累计概率达到 p 的最小候选集，从中按原始概率比例采样。

**正确性要求**：
1. 保留的候选累计概率 ≥ p
2. 删除任何保留的候选，累计概率将 < p
3. 采样概率正确

**证明**：

**断言1**：累计概率 ≥ p。

由 `cutoff_idx = np.searchsorted(cum_probs, p) + 1`：
- `searchsorted` 返回第一个 ≥ p 的位置
- `+1` 确保包含该元素
- 因此累计概率 ≥ p ✓

**断言2**：删除最后一个候选，累计概率可能 < p。

如果 cum_probs[cutoff_idx-1] ≥ p 但 cum_probs[cutoff_idx-2] < p：
- 删除最后元素后，累计概率 < p ✓

**断言3**：采样概率正确。

重新归一化：
```
q_i = p_i / Σ_j p_j
```

其中 j 是保留的候选。这正是条件概率 P(X=i | X 在保留集中)。✓

### 排序去重的正确性

**循环不变式**：

在 for 循环的每次迭代开始时，result 包含 sorted_records[0..i-1] 中的所有不同元素。

**证明**：

**初始化**：i=0，result 为空，包含 0 个不同元素。✓

**保持**：

假设迭代开始时 result 包含 sorted_records[0..i-1] 的所有不同元素。

迭代 i 时：
- 如果 curr == prev：当前元素已存在，跳过
- 如果 curr != prev：当前元素是新元素，加入 result

迭代后，result 包含 sorted_records[0..i] 的所有不同元素。✓

**终止**：i=n，result 包含 sorted_records[0..n-1] 的所有不同元素。✓

---

## 复杂度分析

### LLM 采样的复杂度

**排序阶段**：O(V log V)
- V 是词汇表大小（通常 10K-100K）
- 每次生成都需要排序

**优化方案**：

1. **Top-k 用堆**：O(V log k)
   ```python
   import heapq
   top_k = heapq.nlargest(k, logits)  # O(V log k)
   ```

2. **预计算 + 缓存**：如果 logits 分布稳定，可以预排序

3. **近似 Top-k**：O(V) 的选择算法

### 排序去重 vs 哈希去重

| 方法 | 时间复杂度 | 空间复杂度 | 适用场景 |
|------|-----------|-----------|----------|
| 排序去重 | O(n log n) | O(1) 或 O(n) | 内存紧张、数据可排序 |
| 哈希去重 | O(n) 期望 | O(n) | 内存充足、需要保留原顺序 |

**实际选择**：

- n=10^6，内存 100MB → 排序去重（原地）
- n=10^6，内存 1GB → 哈希去重（更快）
- n=10^9，内存 8GB → 外部排序 + 去重

---

## 什么时候不该用这个方法

### 该用低 Temperature 的情况

1. **代码生成**：需要确定性的正确代码
2. **翻译任务**：需要准确的翻译结果
3. **数学推理**：需要精确的逻辑推理
4. **生产系统**：需要可复现的输出

**原因**：这些场景需要确定性，随机性会降低质量。

### 该用高 Temperature 的情况

1. **创意写作**：需要多样性的故事、诗歌
2. **对话系统**：需要多样化的回复
3. **头脑风暴**：需要发散性思维
4. **数据增强**：需要生成多样化的训练数据

**原因**：这些场景需要多样性，确定性会导致重复。

### Top-k vs Top-p 的选择

| 场景 | 推荐 | 原因 |
|------|------|------|
| 词汇分布均匀 | Top-p | 自动适应候选数量 |
| 词汇分布尖锐 | Top-k | 固定候选数量更稳定 |
| 需要可控性 | Top-k | 明确候选数量 |
| 需要自适应性 | Top-p | 根据分布自动调整 |

### 排序去重的陷阱

1. **无法保留原顺序**：如果需要保留原顺序，不能用排序去重
2. **比较函数复杂**：如果比较函数是 O(k)，总复杂度变成 O(nk log n)
3. **外部排序代价**：数据超过内存时，需要外部排序，代价更高

---

## LLM 时代排序算法选择的实际案例

### 案例一：大规模日志去重

**场景**：100 亿条日志，每条 100 字节，总计 1TB

**约束**：
- 内存：16GB
- 磁盘：充足
- 时间：需要在 24 小时内完成

**分析**：

1. **哈希去重**：需要 O(n) 内存 → 100 亿 × 哈希条目 ≈ 100GB，超过内存 ✗

2. **排序去重**：
   - 外部排序：O(n log n) 时间，O(memory) 内存
   - 多路归并：将数据分成 64 个 16GB 的块，排序后归并
   - 时间估算：读写磁盘 ~10 次 × 1TB = 10TB I/O
   - 在 SSD 上约 2-3 小时 ✓

**结论**：选择外部排序 + 去重。

### 案例二：实时推荐 Top-N

**场景**：每秒 10 万次查询，每次返回 Top-100

**约束**：
- 候选池：100 万
- 延迟：< 50ms
- 内存：充足

**分析**：

1. **每次排序**：O(n log n) = O(10^6 log 10^6) ≈ 2×10^7 次比较
   - 每秒 10^5 × 2×10^7 = 2×10^12 次比较
   - 太慢 ✗

2. **预排序 + Top-N**：
   - 预先按多个维度排序（热度、时间、个性化得分）
   - 每次查询从预排序列表中取 Top-100
   - 复杂度：O(100) = O(1) ✓

3. **堆维护 Top-N**：
   - 建堆 O(n)，取 Top-N O(n log k)
   - 适合动态更新的候选池 ✓

**结论**：预排序 + 堆维护。

### 案例三：LLM 推理优化

**场景**：LLM 推理，词汇表 10 万，每秒生成 100 token

**约束**：
- 延迟：< 100ms per token
- 计算：GPU 充足

**分析**：

1. **完整 Top-k 排序**：O(V log V) = O(10^5 log 10^5) ≈ 1.7×10^6 次操作
   - GPU 并行化后约 1ms ✓

2. **优化方案**：Flash Attention 已经优化了 softmax
   - 不需要完整排序，只需 Top-k
   - 用 partition 算法 O(V) ✓✓

**结论**：GPU 并行化 + partition 优化。

---

## 本节小结

**解决了什么问题？**

理解排序在 LLM 时代的隐藏角色，以及采样参数的本质。

**核心方法是什么？**

- 排序 + 截断 + 随机选择：通用的"筛选高质量候选"模式
- Temperature：控制随机程度
- Top-k/Top-p：排序后截断的不同策略

**为什么正确？**

排序保证候选质量，随机选择保证多样性。类比哈希的"概率换取效率"。

**适用场景？**

- LLM 输出采样
- 大规模数据去重
- 推荐 Top-N
- 任何需要"排序 → 截断"的场景

**能否自己使用？**

能。关键是：
- 理解 Temperature 的数学定义
- 理解 Top-k 和 Top-p 的区别
- 根据场景选择排序/哈希策略

---

## 练习

### 基本理解

**练习 1**：解释 Temperature 的作用。T=0 和 T=∞ 的区别是什么？数学上如何定义？

**练习 2**：为什么 Top-k 类似 Bloom Filter 的设计哲学？两者有什么共同点？

**练习 3**：排序去重和哈希去重的时间复杂度分别是什么？什么时候选择哪个？

### 方法应用

**练习 4**：设计一个采样策略，平衡确定性和多样性。给出 Temperature、Top-k、Top-p 的推荐组合。

**练习 5**：实现一个函数，比较 Top-k 和 Top-p 在不同分布下的候选数量差异。

### 方案比较

**练习 6**：对比不同采样策略：

| 策略 | 确定性 | 多样性 | 适用场景 |
|------|--------|--------|----------|
| Temperature=0 | | | |
| Temperature=1, Top-k=50 | | | |
| Temperature=0.8, Top-p=0.9 | | | |
| Temperature=1.2, Top-k=10 | | | |

### 开放设计

**练习 7**：设计一个"自适应 Temperature"策略：根据生成内容的类型（代码、文本、创意）自动调整 Temperature。

**练习 8**：给定 10 亿条数据，内存 4GB，设计一个去重方案。写出伪代码并分析复杂度。

---

**上一节：[3.10 综合练习](/chapters/ch03/10-exercises)**

**下一章：[第4章 图算法](/chapters/ch04-graph-algorithms)**
