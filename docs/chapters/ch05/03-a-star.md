# 5.3 A* 搜索——用启发函数"看见未来"

## 问题情境：同样的最优解，效率差距百倍

### TSP 的三种解法

**10 城市 TSP**：找一条访问所有城市并返回起点的最短路径。

**解法 A**：朴素回溯
```
搜索节点：3,628,800 (10! - 1)
运行时间：47 秒
结果：最优解 ✓
```

**解法 B**：A* + 差启发函数
```
启发函数：已选路径长度
搜索节点：1,842,600
运行时间：23 秒
结果：最优解 ✓（但比回溯更慢！）
```

**解法 C**：A* + 好启发函数
```
启发函数：已选路径 + MST下界
搜索节点：28,450
运行时间：0.3 秒
结果：最优解 ✓
```

**困惑**：同样是 A*，为什么效率差距 100 倍？启发函数的质量为什么这么重要？

### 第一次尝试：分支限界

小明想了个改进：用**优先队列**代替栈，优先探索"最有希望"的分支。

```python
def branch_and_bound(cities):
    """分支限界"""
    pq = PriorityQueue()
    pq.put((0, [cities[0]]))  # (下界, 当前路径)
    
    while pq:
        bound, path = pq.get()
        
        if len(path) == len(cities):
            return path  # 找到完整解
        
        for city in cities:
            if city not in path:
                new_path = path + [city]
                new_bound = len(new_path)  # 当前长度作为下界
                pq.put((new_bound, new_path))
```

小明运行后发现：比朴素回溯还慢！

**原因**：下界只考虑已选路径，没有估计剩余代价 → 下界太松 → 无法有效剪枝。

### 困惑：如何估计"剩余代价"？

小红意识到关键：**好的下界应该估计"还需要多少代价才能完成"**。

但问题是：未选城市如何排列、如何连接——这是未知！

**直觉**：如果能"放松约束"，允许违反某些规则，就能得到一个更简单的问题——其最优解可以作为下界。

---

## 直观思路：松弛问题求下界

### 松弛的直觉

**类比**：规划旅行预算
- 真实问题：机票+酒店+餐饮+门票+交通（复杂）
- 松弛问题：只算机票+酒店（简单，下界）

**应用到 TSP**：
- 真实问题：找访问所有城市的回路
- 松弛问题：只找访问所有城市的路径（无需回路）
- 更松弛：只找覆盖所有城市的 MST（最小生成树）

**下界计算**：
$$\text{下界} = \text{已选路径长度} + \text{MST代价} + \text{返回起点估计}$$

### 为什么 MST 是下界？

**直觉理解**：访问未选城市至少需要 MST 代价（覆盖所有城市）。

**严格证明**：TSP 回路删除任一条边 → 得到路径 → 路径覆盖所有城市 → 路径代价 ≥ MST 代价。

### 从下界到 A*

小红想到：用优先队列管理所有部分解，按下界排序，优先探索下界最小的分支。

```python
def astar_tsp(cities, distances):
    """A* 求解 TSP"""
    pq = PriorityQueue()
    start = cities[0]
    initial_bound = lower_bound([start], cities, distances)
    pq.put((initial_bound, [start]))
    
    best_cost = float('inf')
    best_path = None
    
    while pq:
        bound, path = pq.get()
        
        # 最优性剪枝：当前下界已超过最优解
        if bound >= best_cost:
            continue
        
        if len(path) == len(cities):
            # 完整解：计算实际代价
            cost = total_length(path + [start], distances)
            if cost < best_cost:
                best_cost = cost
                best_path = path
            continue
        
        # 扩展分支
        for city in cities:
            if city not in path:
                new_path = path + [city]
                new_bound = lower_bound(new_path, cities, distances)
                if new_bound < best_cost:
                    pq.put((new_bound, new_path))
    
    return best_path
```

---

## 规范定义：A* 算法

### 核心公式

**A* 评估每个节点 $n$ 的"前景"**：

$$f(n) = g(n) + h(n)$$

其中：
- $g(n)$：已完成的实际代价
- $h(n)$：估计的剩余代价（启发函数）
- $f(n)$：经过 $n$ 的估计总代价

### 可容许性：保证最优

**定义**：启发函数 $h(n)$ 是可容许的，如果对所有节点 $n$：

$$h(n) \leq h^*(n)$$

其中 $h^*(n)$ 是从 $n$ 到目标的实际最小代价。

**定理**：如果 $h(n)$ 可容许，A* 保证找到最优解。

**证明（简化）**：
设最优解代价为 $C^*$。当 A* 找到最优解时：
- 所有 $f(n) > C^*$ 的节点都在优先队列中（未被扩展）
- 最优路径上所有节点 $n$ 都有 $f(n) \leq C^*$（因为 $h(n) \leq h^*(n)$）
- 因此必然优先扩展最优路径上的节点

### 一致性：更强的条件

**定义**：启发函数 $h(n)$ 是一致的，如果对所有相邻节点 $n, n'$：

$$h(n) \leq c(n, n') + h(n')$$

其中 $c(n, n')$ 是从 $n$ 到 $n'$ 的转移代价。

**意义**：$f(n)$ 沿着路径单调递增 → 不会重复扩展同一节点。

---

## 算法实现：TSP 的 A* 求解器

### 下界计算

```python
def lower_bound(path, cities, distances):
    """计算部分解的下界"""
    # g(n): 已选路径长度
    if len(path) < 2:
        g = 0
    else:
        g = total_length(path, distances)
    
    # h(n): MST 下界
    remaining = [c for c in cities if c not in path]
    h = compute_mst(remaining, distances)
    
    # 连接当前终点到剩余城市
    if len(path) > 0 and len(remaining) > 0:
        h += min(distances[path[-1], c] for c in remaining)
    
    # 返回起点
    if len(remaining) > 0:
        h += min(distances[c, path[0]] for c in remaining)
    else:
        h += distances[path[-1], path[0]]
    
    return g + h

def compute_mst(cities, distances):
    """Prim 算法计算 MST"""
    if len(cities) <= 1:
        return 0
    
    mst_cost = 0
    visited = {cities[0]}
    remaining = set(cities[1:])
    
    while remaining:
        min_edge = float('inf')
        for u in visited:
            for v in remaining:
                if distances[u, v] < min_edge:
                    min_edge = distances[u, v]
                    best = v
        mst_cost += min_edge
        visited.add(best)
        remaining.remove(best)
    
    return mst_cost
```

### 搜索过程追踪

**4 城市 TSP**（距离矩阵）：
```
    A   B   C   D
A   0   10  15  20
B   10  0   35  25
C   15  35  0   30
D   20  25  30  0
```

```
初始：PQ = [(35, [A])]  # MST(A,B,C,D) + 返回 = 25+10

扩展 [A]：
候选：[A,B], [A,C], [A,D]
下界：
  [A,B]: g=10 + MST(C,D)+连接+返回 = 10+30+15+15 = 70
  [A,C]: g=15 + MST(B,D)+连接+返回 = 15+35+15+10 = 75
  [A,D]: g=20 + MST(B,C)+连接+返回 = 20+35+10+15 = 80
PQ = [(70,[A,B]), (75,[A,C]), (80,[A,D])]

扩展 [A,B]：
候选：[A,B,C], [A,B,D]
下界：
  [A,B,C]: g=45 + D→A = 45+20 = 65
  [A,B,D]: g=35 + C→A = 35+15 = 50
PQ = [(50,[A,B,D]), (65,[A,C]), (65,[A,B,C]), (75,[A,C]), (80,[A,D])]

扩展 [A,B,D]：
候选：[A,B,D,C]
下界：g=65 + C→A = 65+15 = 80
完整解！代价 = A→B→D→C→A = 10+25+30+15 = 80

当前最优：80
PQ 最小：50 < 80，继续搜索...

（类似过程）

最终最优：A→B→D→C→A = 80
```

---

## 启发函数设计：三种策略

### 策略 1：松弛问题

**思路**：简化约束，得到更容易求解的问题。

| 松弛程度 | 下界质量 | 计算代价 |
|---------|---------|---------|
| 无松弛（$h=0$） | 最松 | $O(1)$ |
| MST松弛 | 中等 | $O(n^2)$ |
| 强松弛（精确估计） | 最紧 | $O(n!)$ |

**权衡**：下界越紧，计算越慢。好的启发函数应该"足够紧且足够快"。

### 策略 2：模式数据库

**思路**：预计算子问题的最优解，作为下界。

**示例**：15-puzzle
- 预计算：部分数字的最优移动距离（模式数据库）
- 应用：查询数据库，累加多个模式的下界
- 效果：下界更紧，搜索更快

### 策略 3：抽象化

**思路**：将原问题映射到更简单的问题，求解后映射回来。

**示例**：路径规划
- 原问题：城市路网
- 抽象问题：高速公路网（只保留主干）
- 下界：高速公路网的路径长度

---

## 正确性与复杂度分析

### 最优性保证

**前提**：$h(n)$ 可容许

**保证**：A* 找到最优解（如果存在）

**代价**：优先队列峰值可能很大（取决于 $h(n)$ 质量）

### 空间复杂度

| 算法 | 空间 | 说明 |
|-----|-----|-----|
| **DFS** | $O(n)$ | 栈深度 |
| **BFS** | $O(b^n)$ | 队列峰值 |
| **A*** | 取决于 $h$ | PQ峰值 = 未扩展节点数 |

**关键洞察**：
- $h(n)$ 好 → PQ峰值小 → 空间效率高
- $h(n)$ 差 → PQ峰值大 → 可能比 BFS 还慢

### IDA*：空间优化

**思路**：A* + 迭代加深 DFS

```python
def ida_star(initial):
    """迭代加深 A*"""
    threshold = h(initial)
    
    while True:
        result = dfs_with_threshold(initial, threshold)
        if result == "FOUND":
            return result
        if result == float('inf'):
            return None
        threshold = result  # 增加阈值
```

**空间**：$O(n)$（与 DFS 相同）
**时间**：略高于 A*（重复搜索）

---

## 变式与反例

### 反例：不可容许的启发函数

**示例**：$h(n) = 2 \times h^*(n)$（高估）

**后果**：A* 可能错过最优解。

**原因**：$f(n) = g(n) + 2h^*(n)$ 可能超过最优解代价 → 剪掉最优分支。

### 变式：路径规划

**启发函数**：曼哈顿距离、欧几里得距离

```python
def manhattan(pos, goal):
    """曼哈顿距离"""
    return abs(pos.x - goal.x) + abs(pos.y - goal.y)
```

**可容许性**：曼哈顿距离 ≤ 实际路径长度（假设无障碍）。

---

## 常见错误诊断

### 错误 1：不可容许启发函数

```python
# 错误示例：高估剩余代价
def h_wrong(state, goal):
    return 2 * manhattan(state, goal)  # 高估！
```

**后果**：可能错过最优解。

### 错误 2：忘记最优性剪枝

```python
# 错误示例：不剪枝
while pq:
    bound, path = pq.get()
    # 缺少：if bound >= best_cost: continue
    ...
```

**后果**：继续探索已超过最优解的分支 → 浪费时间。

### 错误 3：下界计算错误

```python
# 错误示例：下界计算不准确
def lower_bound_wrong(path):
    return len(path)  # 只算路径长度，忽略剩余
```

**后果**：下界太松 → 剪枝效果差 → 效率低。

---

## 练习

### 基本理解

1. **直觉解释**：为什么 MST 是 TSP 的下界？

2. **公式理解**：$f(n) = g(n) + h(n)$，为什么这样定义？

3. **可容许性**：用例子说明：如果 $h(n)$ 高估，A* 会错过什么？

### 方法应用

4. **下界计算**：手工计算 4 城市 TSP 的 MST 下界。

5. **A* 追踪**：追踪 A* 搜索过程，画出优先队列状态。

6. **启发函数设计**：为路径规划设计一个启发函数（如欧几里得距离）。

### 错误诊断

7. **诊断错误**：给定一个"高估启发函数"，分析后果。

8. **剪枝失败**：如果忘记最优性剪枝，会发生什么？

9. **下界太松**：分析下界太松导致的效率问题。

### 方案比较

10. **DFS vs A* vs IDA***：对比三种算法的效率。

11. **启发函数对比**：对比 $h=0$、MST、强松弛的效果。

12. **空间权衡**：A* 空间峰值 vs IDA* 时间成本。

### 开放设计

13. **启发函数设计**：为 Sudoku 设计一个 A* 启发函数。

14. **自适应启发**：设计一个动态调整启发函数的 Agent。

15. **LLM 连接**：GoT 的思想聚合与 A* 的路径合并有何相似？

---

> **过渡**：A* 保证最优，但如果问题太复杂，最优解代价太高——我们可能只要"够好"的解。下一节：**启发式搜索与局部搜索**——从最优到"够好"。

---

**参考文献**：
- Hart P E, Nilsson N J, Raphael B. A Formal Basis for the Heuristic Determination of Minimum Cost Paths[J]. IEEE SSC, 1968.
- Russell S, Norvig P. Artificial Intelligence: A Modern Approach[M]. 4th ed. Pearson, 2020.