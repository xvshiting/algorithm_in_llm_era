# 3.11 从哈希到 LLM 采样：随机性是设计

## 这一节，你能解决什么问题

学完这一节，你能够：

1. **理解哈希设计原则如何应用于 LLM 采样**
2. **分析 Temperature、Top-k、Top-p 的本质**——排序 + 截断 + 随机选择
3. **判断不同场景下的采样参数选择**
4. **设计"概率换取效率"的验证策略**

---

## 问题情境

LLM 生成时为什么要"采样"而不是"选最高概率"？

如果总是选最高概率 token，输出会变得重复、无聊。

但如果随机采样，可能选到低概率 token，输出变得混乱。

**问题**：怎么平衡"确定性"和"随机性"？

答案在哈希的设计哲学里。

---

## 直观思路

哈希教给我们：

> 随机性不是缺陷，是可以主动引入的设计。

哈希用随机性换取期望性能。LLM 用随机性换取多样性。

**关键洞察**：两者都是"概率换取效率"。

---

## 规范定义

### LLM 采样三阶段

1. **排序**：LLM 输出 log-probabilities，按概率排序
2. **截断**：Top-k、Top-p 保留部分候选
3. **随机选择**：Temperature 重整后随机采样

### 与哈希的对照

| 哈希设计 | LLM 采样 |
|----------|----------|
| 随机哈希函数 | Temperature |
| Bloom Filter 假阳性 | Top-k 多候选 |
| 可验证假阳性 | 可验证采样结果 |

---

## 算法实现

### 排序阶段

```python
# LLM 输出 log-probabilities
log_probs = model.output_logits  # 每个 token 的 log-prob

# 排序（确定性）
sorted_tokens = sorted(log_probs.items(), key=lambda x: -x[1])
```

### 截断阶段

```python
# Top-k 截断
def top_k(sorted_tokens, k):
    return sorted_tokens[:k]

# Top-p 截断
def top_p(sorted_tokens, p):
    result = []
    cum_prob = 0
    for token, prob in sorted_tokens:
        result.append((token, prob))
        cum_prob += exp(prob)
        if cum_prob >= p:
            break
    return result
```

### 随机选择阶段

```python
# Temperature 重整
def temperature_scale(probs, T):
    if T == 0:
        return deterministic_select(probs)  # 选最高
    scaled = [exp(p / T) for p in probs]
    normalized = [s / sum(scaled) for s in scaled]
    return random_choice(normalized)
```

---

## 这个方法是怎么想到的

### 为什么需要随机性？

**问题**：确定性选择 → 重复、无聊

**洞察**：引入随机性 → 多样性

**关键**：控制随机性的程度

### Temperature 的作用

- T = 0：确定性（选最高）
- T → ∞：均匀随机
- T = 1：标准采样

类比哈希的"随机哈希函数"——控制随机程度。

---

## 正确性分析

### 为什么 Top-k 类似 Bloom Filter？

Bloom Filter：
- 保留多个候选（假阳性）
- 验证后排除

Top-k：
- 保留多个候选
- 随机选择后验证

两者都是"多候选 + 验证"模式。

### 为什么假阴性不可接受？

Bloom Filter：假阴性会漏掉真实存在。

LLM 采样：假阴性（漏掉高概率 token）会降低输出质量。

---

## 复杂度分析

LLM 采样复杂度：

- 排序：O(n log n)（n 是词汇表大小）
- 截断：O(k) 或 O(n)
- 随机选择：O(1)

优化：用堆实现 Top-k → O(n log k)

---

## 什么时候不该用这个方法

### 该用低 Temperature 的情况

- 需要确定性输出
- 任务导向（翻译、代码）

### 该用高 Temperature 的情况

- 需要多样性
- 创意导向（写作、对话）

---

## 本节小结

**解决了什么问题？**

理解 LLM 采样的本质，类比哈希设计。

**核心方法是什么？**

排序 + 截断 + 随机选择。概率换取效率。

**为什么正确？**

随机性控制输出多样性。验证控制质量。

**适用场景？**

LLM 输出采样、验证策略设计。

---

## 练习

### 基本理解

**练习 1**：解释 Temperature 的作用。T=0 和 T=∞ 的区别。

**练习 2**：为什么 Top-k 类似 Bloom Filter 的设计哲学？

### 方法应用

**练习 3**：设计一个采样策略，平衡确定性和多样性。

### 方案比较

**练习 4**：对比不同采样策略：

| 策略 | 确定性 | 多样性 | 适用场景 |
|------|--------|--------|----------|
| Temperature=0 | | | |
| Temperature=1 | | | |
| Top-k=50 | | | |
| Top-p=0.9 | | | |

---

**上一节：[3.10 综合练习](/chapters/ch03/10-exercises)**

**下一章：[第4章 图算法](/chapters/ch04-graph-algorithms)**
