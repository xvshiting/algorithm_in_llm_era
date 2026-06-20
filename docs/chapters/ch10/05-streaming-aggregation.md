# 10.5 流式聚合：在线算法的决策边界

> **核心问题**：数据还在流动时，如何做出不可撤销的决策？

---

## 开场问题：秘书招聘

想象你在招聘秘书，有N个候选人按随机顺序面试：

```
规则：
  1. 面试后必须立即决定录用或不录用
  2. 不能回头录用之前拒绝的人
  3. 目标：选中最好的候选人

困惑：
  - 面试第1个候选人：录取吗？如果录取，后面可能有更好的
  - 面试第10个候选人：录取吗？已经拒绝了9个，万一后面更差？
  - 面试最后一个：必须录取吗？可能不如之前拒绝的
  
如何在信息不完整时做出最优决策？
```

### 静态方案的问题

```python
# 静态方案：面试所有人，选最好的
def hire_best(all_candidates):
    best = max(all_candidates, key=lambda x: x.score)
    return best
```

**问题**：静态方案假设可以"回头"，但规则不允许！

**困惑**：如何在数据还在流动时做出不可撤销的决策？

---

## 在线算法的定义

### 什么是在线算法？

**在线算法**：数据逐个到达，必须对每个数据做出不可撤销的决策。

**与流式算法的关系**：

| 维度 | 流式算法 | 在线算法 |
|------|----------|----------|
| 数据到达 | 流式到达 | 流式到达 |
| 操作类型 | 维护统计量 | **做出决策** |
| 可撤销性 | 可以更新统计量 | **不可撤销** |
| 典型问题 | 频率估计、基数估计 | 最优选择、资源分配 |

### 在线算法的核心挑战

**信息不完整**：决策时看不到完整数据。

```
面试第k个候选人时：
  知道：前k个候选人的信息
  不知道：后(N-k)个候选人是谁
  
决策：录取或不录取
后果：不可撤销（不能回头）
```

---

## 秘书问题详解

### 问题形式化

```
输入：N个候选人，按随机顺序面试
约束：面试后必须立即决定录用或不录用
目标：最大化选中最好候选人的概率

假设：
  - 每个候选人有一个分数（面试时可见）
  - 分数随机分布
  - 目标：选中分数最高的候选人
```

### 朴素策略分析

**策略1：立即录取第一个**

```python
def hire_first(candidate):
    if is_first(candidate):
        hire(candidate)  # 录取第一个
```

**成功率**：1/N（最好的人恰好是第一个的概率）

**策略2：录取遇到的第一个"看起来不错"的人**

```python
def hire_good(candidate):
    if candidate.score > threshold:
        hire(candidate)
```

**问题**：如何设定阈值？

### 最优策略：观察-选择策略

**直觉**：先观察一部分，记住最好的，然后选择第一个比观察期更好的。

```python
def secretary_strategy(candidates, N):
    """秘书问题的最优策略"""
    k = int(N / math.e)  # 观察前 N/e 个
    
    # 观察期：记住最好的
    best_in_observation = None
    for i in range(k):
        candidate = candidates[i]
        if best_in_observation is None or candidate > best_in_observation:
            best_in_observation = candidate
    
    # 选择期：录取第一个比观察期更好的
    for i in range(k, N):
        candidate = candidates[i]
        if candidate > best_in_observation:
            return candidate  # 录取
    
    # 没找到更好的，录取最后一个
    return candidates[-1]
```

**成功率**：约 1/e ≈ 36.8%

---

## 为什么观察 N/e 个？

### 数学证明直觉

设观察 k 个，选择第一个比观察期更好的。

```
选中最好候选人的条件：
  1. 最好候选人在选择期（位置 > k）
  2. 在最好候选人之前，没有候选人超过观察期的最好
  
设最好候选人在位置 i（i > k）：
  观察期最好 = 前 k 个中最好的
  
条件：位置 k+1 到 i-1 的候选人都不如观察期最好
  
概率计算：
  P(选中最好) = Σ_{i=k+1}^{N} P(最好在位置i) × P(前i-1个中，前k个是最好的)
  
  = Σ_{i=k+1}^{N} (1/N) × (k/(i-1))
  
  = (k/N) × Σ_{i=k+1}^{N} (1/(i-1))
  
  ≈ (k/N) × ln(N/k)
  
求最大值：
  f(k) = (k/N) × ln(N/k)
  
  f'(k) = ln(N/k) - 1
  
  最优：ln(N/k) = 1 → N/k = e → k = N/e
```

**关键洞察**：
- 观察太少 → 不知道什么是"好"
- 观察太多 → 错过了最好的
- 最优平衡点：观察 N/e ≈ 37%

### 成功率计算

当 k = N/e 时：

```
P(选中最好) ≈ 1/e ≈ 0.368
```

**意义**：即使看不到完整数据，也能保证36.8%的概率选中最好的人！

---

## 竞争比分析

### 什么是竞争比？

**定义**：在线算法的竞争比 = 在线算法结果 / 离线最优结果

```
离线最优：面试所有人，选最好的 → 成功率 = 100%
在线最优：观察-选择策略 → 成成功率 = 36.8%

竞争比 = 36.8% / 100% = 0.368
```

### 竞争比的解读

**竞争比 0.368 意味着什么？**

```
即使不知道未来，也能保证至少 36.8% 的最优解！

对比：
  随机选择 → 成功率 = 1/N ≈ 0（当N很大时）
  在线最优 → 成成功率 = 36.8%（与N无关！）
```

**关键洞察**：竞争比是与问题规模无关的常数，说明在线算法有"结构性优势"。

### 不同问题的竞争比

| 问题 | 在线最优竞争比 | 离线最优 |
|------|---------------|----------|
| 秘书问题 | 1/e ≈ 0.368 | 1.0 |
| 在线装载 | 2.0（首次适应） | 1.0 |
| 在线页面置换 | k（LRU，缓存大小k） | 0（最优） |
| 在线调度 | 2.0（列表调度） | 1.0 |

---

## 经典在线问题

### 1. 在线装载问题

**问题**：物品逐个到达，必须立即决定装入哪个箱子，目标最小化箱子数量。

```python
def online_packing(items, box_capacity):
    """首次适应算法"""
    boxes = []
    
    for item in items:
        # 找第一个能装下的箱子
        for box in boxes:
            if box.capacity >= item.size:
                box.add(item)
                break
        
        # 没找到，开新箱子
        else:
            new_box = Box(box_capacity)
            new_box.add(item)
            boxes.append(new_box)
    
    return boxes
```

**竞争比**：2.0（最多用离线最优的2倍箱子）

### 2. 在线页面置换

**问题**：缓存有限，访问序列未知，目标最小化缺页次数。

```python
def lru_replace(cache, page):
    """LRU算法：淘汰最久未使用的页面"""
    if page in cache:
        # 更新使用时间
        cache.move_to_front(page)
        return 0  # 无缺页
    else:
        # 缺页：淘汰最久未使用的
        if len(cache) >= cache.max_size:
            cache.pop()  # 淘汰最后一个（最久未用）
        cache.append(page)
        return 1  # 缺页
```

**竞争比**：k（缓存大小k时，最多缺页k倍于最优）

### 3. 在线调度

**问题**：任务逐个到达，必须立即分配到机器，目标最小化完成时间。

```python
def list_scheduling(tasks, machines):
    """列表调度：分配到当前负载最小的机器"""
    for task in tasks:
        # 找负载最小的机器
        min_machine = min(machines, key=lambda m: m.load)
        min_machine.add(task)
    
    return max(m.load for m in machines)  # 最大完成时间
```

**竞争比**：2.0（最多用离线最优的2倍时间）

---

## 在线算法的设计策略

### 1. 保守策略

**思想**：假设未来最坏情况，保证最坏情况下的性能。

```python
def conservative_approach(item):
    # 假设后面都是最坏的
    worst_case = estimate_worst_case()
    if can_handle_worst_case(item, worst_case):
        accept(item)
    else:
        reject(item)
```

**优点**：保证最坏情况性能
**缺点**：可能过于悲观，错过好机会

### 2. 随机策略

**思想**：用随机化避免被"恶意输入"针对。

```python
def randomized_approach(item):
    # 随机决策，避免最坏情况
    if random.random() < 0.5:
        accept(item)
    else:
        observe(item)  # 继续观察
```

**优点**：期望竞争比更好
**缺点**：结果不确定

### 3. 预测策略

**思想**：利用历史信息预测未来。

```python
def predictive_approach(item, history):
    # 用历史数据预测未来
    prediction = predict(history)
    
    if item.score > prediction.threshold:
        accept(item)
    else:
        observe(item)
```

**优点**：可能比保守策略更好
**缺点**：依赖预测质量，预测错误可能失败

---

## 秘书问题的变体

### 变体1：多次选择

可以录用 k 个候选人，目标最大化选中最好 k 个的概率。

```python
def multi_hire_strategy(candidates, N, k):
    """录用k个秘书的策略"""
    # 观察期
    observation_size = int(N / math.e)
    best_k = []
    
    for i in range(observation_size):
        candidate = candidates[i]
        if len(best_k) < k or candidate > min(best_k):
            best_k = maintain_top_k(best_k, candidate, k)
    
    threshold = min(best_k)
    
    # 选择期
    hired = []
    for i in range(observation_size, N):
        if len(hired) < k and candidates[i] > threshold:
            hired.append(candidates[i])
    
    return hired
```

### 变体2：已知分数分布

如果知道候选人分数的分布：

```python
def known_distribution_strategy(candidates, distribution):
    """已知分布的策略"""
    threshold = distribution.mean + distribution.std
    
    for candidate in candidates:
        if candidate.score > threshold:
            return candidate
    
    return candidates[-1]  # 最后兜底
```

**成功率**：可以更高（利用额外信息）

---

## 在线算法的边界

### 什么时候在线算法无法竞争？

1. **信息完全未知**：无法做出任何假设
   - 例如：完全随机、无规律的输入
   - 解决：用随机策略

2. **决策代价不等**：错误决策代价过高
   - 例如：录取错误的人导致重大损失
   - 解决：更保守的策略

3. **竞争比要求高**：无法达到理想的竞争比
   - 例如：要求竞争比 > 0.5
   - 解决：接受现实，或获取更多信息

### 在线算法与流式算法的区别

> **💡 与分布式算法的区别**
> 
> 在线算法关注的是"决策约束"（不可撤销），而流式算法关注的是"空间约束"（内存有限）。
> 
> 分布式在线算法需要多机协调决策，可能面临更强的约束。

| 维度 | 在线算法 | 流式算法 |
|------|----------|----------|
| 核心约束 | **决策不可撤销** | **内存有限** |
| 操作类型 | 决策 | 维护统计量 |
| 典型问题 | 最优选择 | 频率估计 |

---

## 实际应用：实时竞价系统

### 问题分析

```
场景：广告实时竞价
规则：
  1. 看到一个广告请求
  2. 必须立即决定是否竞价、出价多少
  3. 不能回头修改决策
  
目标：最大化广告收益
约束：预算有限
```

### 秘书问题类比

```
广告请求 = 女候选人
是否竞价 = 是否录用
出价高低 = 录用决策

类比：
  观察前N/e个请求，记住最好的收益
  选择第一个收益超过观察期的请求
```

### 方案设计

```python
class RTBSystem:
    """实时竞价系统"""
    def __init__(self, budget, observation_ratio=0.37):
        self.budget = budget
        self.observation_ratio = observation_ratio
        
        self.observed_best = 0
        self.observation_count = 0
        self.observation_budget = budget * observation_ratio
        
        self.hired_count = 0
    
    def process_bid_request(self, request, estimated_value):
        """处理竞价请求"""
        # 观察期
        if self.observation_budget > 0:
            # 观察但不竞价
            self.observed_best = max(self.observed_best, estimated_value)
            self.observation_budget -= 1
            return None  # 不竞价
        
        # 选择期
        if estimated_value > self.observed_best and self.budget > 0:
            bid_price = min(estimated_value * 0.8, self.budget)
            self.budget -= bid_price
            return bid_price  # 竞价
        
        return None  # 不竞价
```

---

## 小结

### 核心收获

1. **在线算法定义**：数据逐个到达，决策不可撤销
2. **秘书问题**：观察 N/e 个，选择第一个更好的，成功率 1/e
3. **竞争比**：在线最优 / 离线最优，衡量在线算法质量
4. **设计策略**：保守、随机、预测三种策略
5. **适用边界**：信息完全未知、决策代价不等时难以竞争

### 检查你的理解

1. 在线算法与流式算法的区别是什么？
2. 秘书问题的最优策略是什么？（观察-选择）
3. 为什么观察 N/e 个？（数学证明直觉）
4. 什么是竞争比？如何解读？

---

## 下一步

学会了在线决策后，让我们看看LLM时代的流式挑战：[10.6 LLM流式视角](06-llm-streaming-view.md)

LLM流式视角将探讨：LLM的流式生成本质和上下文窗口约束。
