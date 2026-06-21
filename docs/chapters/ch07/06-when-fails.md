# 7.6 贪心何时失败

## 这一节回答什么问题？

你已经学会了贪心在活动选择、Huffman 编码、最小生成树上多么高效。但问题来了：**什么时候不该用贪心？**

错误判断贪心的适用范围，是算法设计中最常见的陷阱之一。

---

## 问题情境：背包问题

假设你是一个盗贼，背包装载能力是 50kg。仓库里有：

| 物品 | 重量 | 价值 | 性价比 |
|------|------|------|--------|
| 黄金 | 10kg | 60万 | 6万/kg |
| 白银 | 20kg | 100万 | 5万/kg |
| 钻石 | 30kg | 120万 | 4万/kg |

**贪心策略**：按性价比排序，优先拿性价比最高的。

黄金（性价比 6）→ 白银（性价比 5）→ 钻石（性价比 4）

结果：黄金 + 白银 = 30kg，价值 160 万。

**最优解**：白银 + 钻石 = 50kg，价值 220 万！

贪心失败了！

---

## 为什么会失败？0-1 背包 vs 分数背包

### 分数背包：贪心有效

如果物品可以分割（比如金粉、沙子），贪心策略完美：

```python
def fractional_knapsack(capacity: int, items: List[Tuple[int, int]]) -> float:
    """
    分数背包问题
    
    物品可分割，贪心策略按性价比排序即可。
    
    Args:
        capacity: 背包容量
        items: 物品列表，每个元素是 (weight, value)
        
    Returns:
        最大价值（可以是分数）
    """
    # 按性价比降序排序
    items = sorted(items, key=lambda x: x[1] / x[0], reverse=True)
    
    total_value = 0
    remaining = capacity
    
    for weight, value in items:
        if remaining >= weight:
            # 完全拿走
            total_value += value
            remaining -= weight
        else:
            # 分割拿走
            total_value += value * (remaining / weight)
            break
    
    return total_value
```

**为什么正确？**
- 物品可分割意味着可以"填满"背包
- 性价比排序保证了每单位重量都取最大价值
- 没有浪费任何空间

### 0-1 背包：贪心失败

如果物品不可分割（要么全拿，要么不拿），贪心策略会出错：

```python
def knapsack_01_greedy(capacity: int, items: List[Tuple[int, int]]) -> int:
    """
    0-1 背包的贪心策略（错误示范）
    
    ⚠️ 这个策略不能保证最优解！
    """
    items = sorted(items, key=lambda x: x[1] / x[0], reverse=True)
    
    total_value = 0
    remaining = capacity
    
    for weight, value in items:
        if remaining >= weight:
            total_value += value
            remaining -= weight
    
    return total_value


def knapsack_01_dp(capacity: int, items: List[Tuple[int, int]]) -> int:
    """
    0-1 背包的动态规划解法（正确）
    
    时间复杂度: O(n * W)，其中 W 是容量
    空间复杂度: O(n * W) 或优化到 O(W)
    """
    n = len(items)
    # dp[i][w] = 前 i 个物品，容量 w 时的最大价值
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        weight, value = items[i - 1]
        for w in range(capacity + 1):
            # 不选第 i 个物品
            dp[i][w] = dp[i - 1][w]
            # 选第 i 个物品（如果放得下）
            if w >= weight:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - weight] + value)
    
    return dp[n][capacity]
```

**为什么贪心失败？**
- 贪心选择了高性价比物品，但可能挤占了本可以装下更高总价值组合的空间
- "局部最优"（选性价比最高的）不等于"全局最优"（背包总价值最大）

**失败的本质**：
- **最优子结构失效**：子问题的最优解不一定能组合成原问题的最优解
- **贪心选择性质失效**：存在最优解不包含贪心选择

---

## 失败案例二：最大独立集

**问题**：给定一个图，找出最大的顶点子集，使得子集中任意两点不相邻。

**贪心策略**：每次选度数最小的顶点，删除其邻居，重复。

```python
def max_independent_set_greedy(adj: Dict[int, Set[int]]) -> Set[int]:
    """
    最大独立集的贪心策略（错误示范）
    
    ⚠️ 这个策略不能保证最优解！
    
    Args:
        adj: 邻接表表示的图
        
    Returns:
        独立集（可能不是最大的）
    """
    result = set()
    remaining = set(adj.keys())
    
    while remaining:
        # 贪心：选度数最小的顶点
        min_vertex = min(remaining, key=lambda v: len(adj[v] & remaining))
        result.add(min_vertex)
        # 删除该顶点及其邻居
        remaining -= {min_vertex} | (adj[min_vertex] & remaining)
    
    return result
```

**反例**：

```
    1 --- 2 --- 3 --- 4 --- 5
```

- 贪心：选度数最小的是顶点 1 或 5（度数为 1）
  - 选 1，删除 {1, 2}，剩下 {3, 4, 5}
  - 选 3 或 5，假设选 5，删除 {4, 5}，剩下 {3}
  - 选 3
  - 结果：{1, 3, 5}，大小为 3

- 最优解：{1, 3, 5} 或 {2, 4}
  - 实际上这个例子贪心碰巧对了...

更好的反例：

```
    1 --- 2
     \   /
      \ /
       3
       |
       4
       |
       5
```

顶点 3 的度数是 3，顶点 1, 2, 4, 5 的度数是 1 或 2。

贪心可能选：先选 1 或 2（度数最小=1），然后...

这个问题的复杂性在于：最大独立集是 NP-hard 问题，不存在多项式时间精确算法（除非 P=NP）。

---

## 失败案例三：加权活动选择

**问题**：选择不重叠的活动，使得总权重最大。

**贪心策略**：按结束时间排序，选最早结束的？

不，这忽略了权重！

**尝试的贪心策略**：按权重排序，选权重最大的？

```python
def weighted_activity_selection_greedy(activities: List[Tuple[int, int, int]]) -> List[int]:
    """
    加权活动选择的贪心策略（错误示范）
    
    ⚠️ 这个策略不能保证最优解！
    
    Args:
        activities: 活动列表，每个元素是 (start, end, weight)
        
    Returns:
        选择的活动索引列表
    """
    # 按权重降序排序
    sorted_acts = sorted(enumerate(activities), key=lambda x: x[1][2], reverse=True)
    
    selected = []
    last_end = -1
    
    for idx, (start, end, weight) in sorted_acts:
        if start >= last_end:
            selected.append(idx)
            last_end = end
    
    return selected


def weighted_activity_selection_dp(activities: List[Tuple[int, int, int]]) -> Tuple[int, List[int]]:
    """
    加权活动选择的动态规划解法（正确）
    
    时间复杂度: O(n log n)
    """
    n = len(activities)
    # 按结束时间排序
    sorted_indices = sorted(range(n), key=lambda i: activities[i][1])
    
    # p[i] = 与活动 i 不冲突的最大 j（j < i）
    def find_compatible(i: int) -> int:
        """二分查找找最大兼容活动"""
        target = activities[sorted_indices[i]][0]
        left, right = 0, i - 1
        result = -1
        while left <= right:
            mid = (left + right) // 2
            if activities[sorted_indices[mid]][1] <= target:
                result = mid
                left = mid + 1
            else:
                right = mid - 1
        return result
    
    # dp[i] = 前 i 个活动的最大权重和
    # dp[i] = max(dp[i-1], weight[i] + dp[p[i]])
    dp = [0] * (n + 1)
    choices = [[] for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        # 不选活动 i-1
        skip = dp[i - 1]
        # 选活动 i-1
        j = find_compatible(i - 1)
        take = activities[sorted_indices[i - 1]][2] + (dp[j + 1] if j >= 0 else 0)
        
        if take > skip:
            dp[i] = take
            choices[i] = choices[j + 1] + [sorted_indices[i - 1]]
        else:
            dp[i] = skip
            choices[i] = choices[i - 1]
    
    return dp[n], choices[n]
```

**反例**：

```
活动 A: [1, 10], 权重 100
活动 B: [2, 3], 权重 20
活动 C: [4, 5], 权重 20
活动 D: [6, 7], 权重 20
活动 E: [8, 9], 权重 20
```

- 贪心（按权重）：选 A，权重 100
- 最优解：选 B, C, D, E，权重 80
- 等等，100 > 80，贪心对了？

换一个例子：

```
活动 A: [1, 100], 权重 1
活动 B: [2, 3], 权重 10
活动 C: [4, 5], 权重 10
...（假设有 50 个这样的短活动，总权重 500）
```

- 贪心（按权重）：选所有短活动，总权重 500
- 这是最优的...

再换一个例子：

```
活动 A: [1, 10], 权重 15
活动 B: [2, 4], 权重 10
活动 C: [5, 7], 权重 10
活动 D: [8, 10], 权重 10
```

- 贪心（按权重降序）：B(10), C(10), D(10), 总权重 30
- 但 B, C, D 都与 A 冲突...
- 实际上贪心选 B, C, D 对了

真正的问题：

```
活动 A: [1, 10], 权重 20
活动 B: [2, 5], 权重 15
活动 C: [6, 9], 权重 15
```

- 贪心（按权重降序）：选 A（权重 20），结束
- 或者：选 B, C（总权重 30） ← 更优！

**贪心失败**：局部选权重最高的 A，导致无法选 B 和 C，错失更优解。

---

## 贪心失败的三种根本原因

### 1. 缺乏最优子结构

**定义**：问题的最优解包含子问题的最优解。

**反例**：最长简单路径问题
- 子问题：从 u 到 v 的最长路径
- 如果 u → w → v 是最优解，那么 u → w 的最长路径必须是路径的一部分
- 但"u → w 的最长路径"不一定能拼成 u → v 的最长路径

### 2. 贪心选择性质不成立

**定义**：存在一个最优解包含贪心选择。

**反例**：0-1 背包
- 贪心选择：性价比最高的物品
- 存在最优解不包含性价比最高的物品（例子中的黄金）

### 3. 子问题重叠但不独立

**定义**：贪心假设每步选择后，剩余问题独立求解即可。

**反例**：某些问题看似可以贪心，但子问题之间存在依赖关系。

---

## 判断贪心是否适用的清单

| 检查项 | 是 | 否 |
|--------|-----|-----|
| 问题能建模为拟阵吗？ | ✓ 贪心必然有效 | 需要进一步验证 |
| 有贪心选择性质吗？ | 可能适用贪心 | ✗ 不要用贪心 |
| 有最优子结构吗？ | 可能适用贪心 | ✗ 不要用贪心 |
| 子问题独立吗？ | 可能适用贪心 | 考虑 DP |
| 能举出贪心失败的反例吗？ | ✗ 不要用贪心 | 值得尝试 |

---

## LLM 时代映射

LLM 的**贪心解码** = 每步选最高概率 token。

这正是贪心算法的同一陷阱：**局部最优不保证全局最优**。

**贪心解码的问题**：

```python
# 贪心解码
def greedy_decode(model, prompt, max_tokens=100):
    tokens = tokenize(prompt)
    for _ in range(max_tokens):
        logits = model(tokens)
        next_token = argmax(logits[-1])  # 贪心：选最高概率
        tokens.append(next_token)
        if next_token == EOS:
            break
    return detokenize(tokens)
```

贪心解码可能：
- 陷入重复模式（如 "the the the..."）
- 不探索替代路径
- 错过更好的表达方式

**改进方法**：

| 方法 | 思想 | 对应算法 |
|------|------|----------|
| Beam Search | 保留 top-k 候选 | 均匀拟阵上的贪心 |
| Nucleus Sampling | 从高概率集合中采样 | 随机化 |
| Temperature | 调整概率分布 | 随机化 |

**Beam Search 与拟阵的联系**：

Beam Search 保留 top-k 候选，这可以看作在**均匀拟阵**上的贪心：
- 基础集：所有可能的 token 序列
- 独立集：大小 ≤ k 的序列集合
- 贪心：每步保留 top-k 扩展

但 Beam Search 仍然不是最优的——它只是"更好的贪心"。

---

## 本节小结

### 这一节解决了什么问题？
贪心什么时候不该用？

### 核心洞察是什么？
贪心失败的三种原因：无最优子结构、无贪心选择性质、子问题重叠。

### 如何判断？
检查问题结构——是否存在这三类障碍。举反例是最直接的验证方法。

### LLM 启示
理解贪心何时有效，就是理解何时可以信任 LLM 的单步最优选择。贪心解码的局限性，正是需要 Beam Search、Temperature 等技术的原因。

---

## 习题

1. **概念题**：为什么分数背包贪心有效，而 0-1 背包贪心失效？关键区别是什么？

2. **证明题**：证明最小生成树问题满足贪心选择性质和最优子结构。

3. **编程题**：实现一个贪心失败检测器：给定问题实例，判断贪心是否能得到最优解。

4. **思考题**：如果一个问题贪心失败，我们可以用哪些策略改进？（提示：考虑随机化、回溯、DP）

5. **LLM 联系**：Beam Search 的 beam width 如何影响生成质量？beam width 越大越好吗？
