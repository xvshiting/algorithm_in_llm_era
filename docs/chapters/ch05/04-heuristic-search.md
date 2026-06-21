# 5.4 启发式搜索——从最优到"够好"

## 问题情境：复杂启发反而更差

### 顶点覆盖问题的反直觉结果

**问题**：找最小顶点集合，覆盖所有边。

**解法 A**：简单启发（最大匹配）
```
算法：找最大匹配，取匹配端点
近似比：2（解最多是最优的 2 倍）
时间：O(m)（边数）
```

**解法 B**：复杂启发（贪心度数）
```
算法：每次选度数最大的顶点
近似比：Θ(log n)（可能比最优差 log n 倍）
时间：O(n log n)
```

**困惑**：为什么"更聪明"的贪心度数算法，近似比反而更差？

### 第一次尝试：爬山法

小明想了个简单方法：从随机解开始，每次改进一点。

```python
def hill_climbing(initial):
    """爬山法"""
    current = initial
    while True:
        neighbors = get_neighbors(current)
        best = min(neighbors, key=cost)
        if cost(best) < cost(current):
            current = best
        else:
            break  # 无改进，停止
    return current
```

小明用在 TSP 上测试，发现一个问题：**总是困在局部最优**，无法到达全局最优。

### 困惑：为什么局部最优这么难逃离？

小红画了个图：

```
代价函数地形

   ↗ 全局最优（最高峰）
  /
 /  ↗ 局部最优（小山峰）
/  /
   ↗ 当前解 → 爬山 → 局部最优（被困）
```

**直觉**：爬山法只接受"上升"，拒绝"下降"——困在小山峰，无法到达最高峰。

---

## 直观思路：允许"错误"转移

### 模拟退火的直觉

**类比**：金属退火
- 高温：分子剧烈运动，混乱排列
- 缓慢降温：分子逐渐有序，趋向低能量状态
- 偶尔"错误"：某些分子暂时回到高能量（为了跳出局部陷阱）

**应用到搜索**：
- 高温：随机游走，广泛探索
- 低温：贪心收敛，精细调整
- 接受"错误"：偶尔接受更差的解，跳出局部最优

### Metropolis 函数

**接受劣转移的概率**：

$$P(\text{accept}) = e^{-\Delta E / T}$$

其中：
- $\Delta E$：代价增加（新解比当前解差多少）
- $T$：当前温度

**直觉解释**：
- 高温 $T$：$P \approx 1$ → 接受几乎所有转移（混乱）
- 低温 $T$：$P \approx 0$ → 只接受改进（有序）
- $\Delta E$ 大：$P$ 小 → 差很多的解不太可能接受
- $\Delta E$ 小：$P$ 大 → 差一点的解可能接受

---

## 规范定义：局部搜索框架

### 邻域与局部最优

**邻域**：解的"附近"所有解（通过小扰动可达）。

**局部最优**：邻域中没有更优解的点。

**全局最优**：整个解空间中最优的点。

### 模拟退火算法

```python
def simulated_annealing(initial, neighbor, cost, T0=1000, alpha=0.99):
    """模拟退火"""
    current = initial
    best = current
    T = T0
    
    while T > T_min:
        # 生成邻居
        new = neighbor(current)
        delta = cost(new) - cost(current)
        
        # 判断接受
        if delta < 0 or random() < exp(-delta / T):
            current = new
            if cost(new) < cost(best):
                best = new
        
        T *= alpha  # 冷却
    
    return best
```

---

## 代价函数设计：部分信用

### 为什么需要部分信用？

**问题**：中间状态难以评价。

**示例**：
- TSP 部分路径：未完成回路，如何评价？
- SAT 部分赋值：未赋值所有变量，如何评价？

**关键**：代价函数必须给中间状态**部分信用**。

### TSP 的代价函数

```python
def cost_with_penalty(path, cities, distances):
    """带惩罚的代价函数"""
    # 已选路径
    length = total_length(path, distances)
    
    # 未访问城市惩罚
    unvisited = [c for c in cities if c not in path]
    penalty = len(unvisited) * 10
    
    return length + penalty
```

---

## 正确性与复杂度分析

### 收敛性（概率意义）

**定理**：模拟退火在无限时间后概率收敛到全局最优。

**前提**：温度调度合适（足够慢）。

**实际**：有限时间内可能不收敛 → 只能期望"够好"的解。

### 复杂度

| 算法 | 时间 | 空间 |
|-----|-----|-----|
| **爬山法** | $O(k \cdot n)$ | $O(n)$ |
| **模拟退火** | $O(k \cdot n)$ | $O(n)$ |
| **A*** | 取决于 $h$ | 取决于 $h$ |

**关键洞察**：模拟退火时间可控（迭代次数），空间最优 $O(n)$。

---

## 反例：贪心度数为什么更差？

### 构造反例

**经典结论**：贪心度数顶点覆盖的近似比是 Θ(log n)，远差于最大匹配的常数 2。

**关键洞察**：贪心度数按"最高度数优先"选择，但高度数顶点不一定是最优选择。

**正确反例思路**：

贪心度数的核心问题是：它选择"覆盖最多边"的顶点，但这些边可能本来可以用更少的顶点覆盖。

考虑一个星图（star graph）的**反面例子**（展示贪心**正确**的情况）：
- 星图：中心顶点连接所有叶子顶点
- 贪心选择中心顶点（度数最高）→ 1 个顶点覆盖所有边
- 最优解也是 1 个顶点（中心）
- **结论**：星图中贪心度数**恰好最优**

那贪心何时更差？需要一个让贪心"分散选择"而非"集中选择"的反例。

**标准反例**（Johnson 1974，顶点覆盖 Θ(log n) 近似比）：

通过归约到 Set Cover 问题构造：

```
设集合系统：U = {元素1, ..., 元素n}
集合 S1, S2, ..., Sm 各覆盖 U 的部分

构造图：
- 左边：每个集合 Si 对应一个顶点 vi
- 右边：每个元素对应一个顶点 uj
- 边：(vi, uj) 当元素 uj ∈ Si

贪心度数执行：
- 每次选度数最大的顶点（覆盖最多未覆盖元素）
- 这等价于 Set Cover 的贪心！
- 已知 Set Cover 贪心近似比 Θ(log n)

最优顶点覆盖：
- 对应最优 Set Cover 选择
- 可能远小于贪心选择
```

**关键区别**：贪心度数"看起来聪明"（选高度数），但高度数顶点可能覆盖的是"分散的边"，而非"集中的边"。

**对比星图**：
- 星图：中心顶点高度数，且覆盖所有边 → 贪心最优 ✓
- Set Cover 图：高度数顶点覆盖分散边 → 贪心选太多 ✗

---

## 练习

### 基本理解

1. **直觉解释**：为什么模拟退火叫"退火"？

2. **对比分析**：爬山法和模拟退火的区别是什么？

3. **温度作用**：高温和低温分别起什么作用？

### 方法应用

4. **SA 实现**：实现 TSP 的模拟退火求解器。

5. **参数实验**：测试不同 $T_0$、$\alpha$ 的效果。

6. **代价函数设计**：为 SAT 设计一个代价函数。

### 错误诊断

7. **诊断错误**：温度调度太快会发生什么？

8. **代价函数错误**：如果代价函数不给部分信用，会发生什么？

### 方案比较

9. **爬山 vs SA**：对比两种方法的效率和解质量。

10. **贪心度数 vs 匹配**：解释为什么复杂启发更差。

### 开放设计

11. **改进思路**：如何改进爬山法，避免局部最优陷阱？

12. **自适应温度**：设计一个动态调整温度的策略。

---

> **过渡**：搜索策略的本质是什么？从 DFS 到 A*，从回溯到 SA——我们看到的是同一思想的演进。下一节：**LLM 推理与搜索策略的同构性**。

---

**参考文献**：
- Kirkpatrick S, Gelatt C D, Vecchi M P. Optimization by Simulated Annealing[J]. Science, 1983.
- Vazirani V V. Approximation Algorithms[M]. Springer, 2001.
---
---

## 变式与反例详解

### 变式 1：自适应模拟退火

**问题**：固定温度调度可能不适合所有问题。

**改进思路**：
1. **基于接受率调整**：监测接受率 $r$，若 $r$ 过低则提高温度
2. **基于改进率调整**：若长时间无改进，重新加热

```python
def adaptive_sa(initial, neighbor, cost):
    """自适应模拟退火"""
    current = initial
    best = current
    T = T0
    no_improve = 0
    
    while T > T_min:
        new = neighbor(current)
        delta = cost(new) - cost(current)
        
        # 计算接受率
        accept_rate = count_accepts / total_tries
        
        # 自适应调整
        if accept_rate < 0.1:
            T *= 1.5  # 重新加热
        elif accept_rate > 0.5:
            T *= 0.95  # 加速冷却
        
        if delta < 0 or random() < exp(-delta / T):
            current = new
            if cost(new) < cost(best):
                best = new
                no_improve = 0
            else:
                no_improve += 1
        
        # 长时间无改进，重置
        if no_improve > threshold:
            T = T0 * 0.5
            no_improve = 0
    
    return best
```

**效果**：对复杂问题可提高 10-20% 解质量。

---

### 变式 2：多起点模拟退火

**问题**：单起点可能困于局部最优。

**改进思路**：从多个起点并行运行 SA，取最优解。

```python
def multi_start_sa(cost_func, num_starts=10):
    """多起点模拟退火"""
    results = []
    for _ in range(num_starts):
        initial = random_solution()
        result = simulated_annealing(initial)
        results.append(result)
    return min(results, key=cost_func)
```

**效果**：以计算成本换取解质量。

---

### 变式 3：混合策略（SA + 局部搜索）

**问题**：SA 后期收敛慢。

**改进思路**：SA 探索 + 爬山法精细调整。

```python
def hybrid_sa(initial):
    """混合策略"""
    # 第一阶段：SA 探索
    result = simulated_annealing(initial, T0=1000, T_min=10)
    
    # 第二阶段：爬山法精细调整
    result = hill_climbing(result)
    
    return result
```

---

### 反例详解：贪心度数为何更差

#### 为什么贪心度数近似比是 Θ(log n)

**核心问题**：贪心按"度数从大到小"选择顶点，但高度数不等于"高效覆盖"。

**正确分析**：

贪心度数算法：
1. 每轮选择当前度数最大的顶点
2. 将该顶点加入覆盖集，删除其所有关联边
3. 更新剩余顶点的度数
4. 重复直到无边

**关键缺陷**：高度数顶点可能覆盖的是"分散的边"，而非"集中的边"。

---

#### Set Cover 归约：正确反例

**标准证明**（Johnson 1974）：

贪心度数顶点覆盖 → Set Cover 贪心 → Θ(log n) 近似比

**构造**：给定 Set Cover 实例，构造顶点覆盖图。

```
Set Cover 实例：
- 元素集 U = {e1, ..., en}
- 集合族 S1, ..., Sm（每个 Si ⊆ U）

构造二部图 G = (L, R, E)：
- L = {v1, ..., vm}（每个集合对应一个顶点）
- R = {u1, ..., un}（每个元素对应一个顶点）
- E = {(vi, uj) : ej ∈ Si}

关键观察：
- 覆盖 G 的所有边 ⟺ 选择集合覆盖 U
- 左边顶点覆盖边 ⟺ 集合覆盖元素
```

**贪心执行对应**：
```
贪心度数在 G 上：
1. 选择度数最大的 vi（覆盖最多未覆盖元素）
2. 这等价于 Set Cover 贪心选择最大覆盖集！

已知结论：
- Set Cover 贪心近似比 Θ(log n)
- 因此顶点覆盖贪心度数近似比 Θ(log n)
```

---

#### 对比：星图的情况

**星图**（Star Graph）：中心顶点连接所有叶子。

```
结构：
- 中心顶点 c，度数 = n-1
- 叶子顶点 l1, ..., ln-1，度数 = 1

贪心度数执行：
1. 选择 c（度数最高）
2. 所有边被覆盖
3. 结果：{c}，大小 = 1

最优解：
- {c} 就是最优（覆盖所有边只需 1 个顶点）

结论：星图中贪心度数 **恰好最优**
```

**为什么星图是"贪心友好"？**

- 中心顶点高度数 + 覆盖所有边
- 没有其他顶点能替代中心的作用

**为什么 Set Cover 图是"贪心敌对"？**

- 高度数顶点覆盖的边"分散"
- 多个低度数顶点可以"共同"覆盖这些边（效率更高）

---

#### 具体数值示例（小规模）

**Set Cover 影射示例**：

```
U = {e1, e2, e3, e4, e5, e6}
S1 = {e1, e2, e3}（覆盖 3 个）
S2 = {e4, e5, e6}（覆盖 3 个）
S3 = {e1}（覆盖 1 个）
S4 = {e2}（覆盖 1 个）
...
S6 = {e6}（覆盖 1 个）

贪心 Set Cover：
1. 选 S1（覆盖 3 个）→ 剩余 {e4, e5, e6}
2. 选 S2（覆盖 3 个）→ 完成
结果：2 个集合

如果最优解存在？
- 最优可能也是 {S1, S2} = 2 个
- 但存在更复杂实例，贪心选更多
```

**关键洞察总结**：

1. **贪心度数近似比 Θ(log n)**，无常数保证
2. **最大匹配近似比恒为 2**，有常数保证
3. **星图情况**：贪心度数恰好最优（但这不是常态）
4. **Set Cover 影射**：展示贪心的本质缺陷

---

## 复杂度分析详解

### 时间复杂度

**模拟退火时间复杂度**：

$$T = O(I \times C_{neighbor})$$

其中：
- $I$：总迭代次数
- $C_{neighbor}$：生成邻居的代价

**迭代次数估算**：

假设冷却调度 $T_{k+1} = \alpha \cdot T_k$，从 $T_0$ 到 $T_{min}$：

$$I = \frac{\log(T_{min}/T_0)}{\log \alpha}$$

典型值：$T_0 = 1000$，$T_{min} = 1$，$\alpha = 0.99$

$$I = \frac{\log(1/1000)}{\log(0.99)} \approx \frac{-6.9}{-0.01} \approx 690$$

---

### 空间复杂度

| 算法 | 空间复杂度 | 说明 |
|-----|----------|------|
| 爬山法 | $O(n)$ | 只存当前解 |
| 模拟退火 | $O(n)$ | 当前解 + 最优解 |
| A* | $O(b^d)$ | 开放列表可能很大 |
| IDA* | $O(d)$ | 深度优先，空间最优 |

**关键洞察**：SA 空间最优，适合大规模问题。

---

### 收敛性分析

**定理**（概率收敛）：

若温度调度满足：
$$\sum_{k=1}^{\infty} \exp\left(-\frac{\Delta E_{min}}{T_k}\right) = \infty$$

则模拟退火概率收敛到全局最优。

**实际含义**：
- 温度下降足够慢（$\alpha$ 接近 1）
- 有足够时间探索

**有限时间保证**：无保证！实际只能期望"够好"的解。

---

### 参数敏感性分析

| 参数 | 敏感性 | 影响 |
|-----|-------|------|
| $T_0$ | 中 | 太低 → 探索不足 |
| $\alpha$ | 高 | 太低 → 冷却太快 |
| $T_{min}$ | 低 | 主要影响终止条件 |
| 邻域函数 | 高 | 决定搜索空间结构 |

**调参建议**：
1. 先用小实例调参
2. 固定 $\alpha = 0.99$，调 $T_0$
3. 观察接受率，调整策略

---

## 代价函数设计深入

### 部分信用的必要性

**问题**：搜索中间状态如何评价？

**错误示例**：TSP 只计算已访问路径长度
- 问题：未访问城市无法评价
- 结果：搜索方向不明确

**正确方法**：已访问长度 + 未访问惩罚

```python
def cost_partial(path, cities, distances):
    """部分路径代价函数"""
    visited_length = sum(distances[path[i]][path[i+1]] 
                         for i in range(len(path)-1))
    
    unvisited = [c for c in cities if c not in path]
    
    # MST 下界作为未访问部分的估计
    if unvisited:
        mst_estimate = compute_mst(unvisited, distances)
        penalty = mst_estimate + min_return_edge(path, unvisited, distances)
    else:
        penalty = distances[path[-1]][path[0]]  # 回到起点
    
    return visited_length + penalty
```

---

### SAT 代价函数设计

**SAT 问题**：给变量赋值，使所有子句满足。

**代价函数**：未满足子句数

```python
def sat_cost(assignment, clauses):
    """SAT 代价函数：未满足子句数"""
    unsatisfied = 0
    for clause in clauses:
        satisfied = any(assignment.get(var, False) == polarity 
                       for var, polarity in clause)
        if not satisfied:
            unsatisfied += 1
    return unsatisfied
```

**部分赋值处理**：
- 未赋值变量 → 随机赋值测试
- 或使用子句权重（未满足高权重 → 惩罚）

---

### 图着色代价函数

**问题**：给图顶点着色，相邻顶点不同色，最小化颜色数。

**代价函数**：

```python
def coloring_cost(coloring, graph):
    """图着色代价函数"""
    # 惩罚 1：冲突（相邻同色）
    conflicts = 0
    for u, v in graph.edges():
        if coloring[u] == coloring[v]:
            conflicts += 1
    
    # 惩罚 2：颜色数
    num_colors = len(set(coloring.values()))
    
    # 加权组合
    return conflicts * 100 + num_colors
```

**关键**：冲突惩罚权重 >> 颜色数，确保优先消解冲突。

---

## LLM 与搜索策略的对应

### 贪心解码 vs 爬山法

| 贪心解码 | 爬山法 |
|---------|-------|
| 每步选最高概率 token | 每步选最优邻居 |
| 局部最优陷阱 | 局部最优陷阱 |
| 重复输出 | 困于山峰 |

**解决**：温度采样 ↔ 模拟退火

---

### Chain-of-Thought vs DFS

| Chain-of-Thought | DFS |
|-----------------|-----|
| 线性推理链 | 单路径搜索 |
| 无回溯 | 可回溯（但通常不） |
| 快速但易错 | 快速但不保证 |

---

### Tree-of-Thought vs 回溯 + 剪枝

| Tree-of-Thought | 回溯 + 剪枝 |
|----------------|------------|
| 多候选思维 | 多分支搜索 |
| 评估函数剪枝 | 约束剪枝 |
| 探索-利用平衡 | 效率-正确性平衡 |

**关键对应**：ToT 的"思考-评估-选择"对应搜索的"生成-评估-剪枝"。

---

### Graph-of-Thought vs 复杂搜索

| Graph-of-Thought | 复杂搜索 |
|-----------------|---------|
| 思维图结构 | 搜索图结构 |
| 思维融合 | 状态合并 |
| 循环推理 | 迭代改进 |

**更复杂的问题**：需要 GoT 对应更复杂的搜索策略（如 AND-OR 图搜索）。

---

## 练习（补充至 18 题）

### 基本理解

**1. 直觉解释**：为什么模拟退火叫"退火"？

**核心思路**：类比金属退火过程。

**答案要点**：
- 金属退火：高温 → 缓慢降温 → 低能量状态
- 算法对应：高温（随机探索）→ 降温（收敛）→ 解（低能量）

---

**2. 对比分析**：爬山法和模拟退火的区别是什么？

**核心思路**：是否接受劣转移。

**答案要点**：
| 特性 | 爬山法 | 模拟退火 |
|-----|-------|---------|
| 接受劣转移 | 否 | 是（概率） |
| 局部最优 | 困住 | 可逃逸 |
| 确定性 | 是 | 否（随机） |

---

**3. 温度作用**：高温和低温分别起什么作用？

**核心思路**：探索与利用的平衡。

**答案要点**：
- 高温：$P \approx 1$，广泛探索
- 低温：$P \approx 0$，精细调整

---

### 方法应用

**4. SA 实现**：实现 TSP 的模拟退火求解器。

**参考代码**：
```python
import random
import math

def sa_tsp(cities, distances, T0=1000, alpha=0.99):
    """TSP 模拟退火"""
    n = len(cities)
    current = list(range(n))
    random.shuffle(current)
    best = current[:]
    T = T0
    
    def cost(path):
        return sum(distances[path[i]][path[(i+1)%n]] 
                   for i in range(n))
    
    def neighbor(path):
        """2-opt 邻域"""
        new = path[:]
        i, j = sorted(random.sample(range(n), 2))
        new[i:j+1] = reversed(new[i:j+1])
        return new
    
    while T > 0.1:
        new = neighbor(current)
        delta = cost(new) - cost(current)
        
        if delta < 0 or random.random() < math.exp(-delta / T):
            current = new
            if cost(new) < cost(best):
                best = new[:]
        
        T *= alpha
    
    return best, cost(best)
```

---

**5. 参数实验**：测试不同 $T_0$、$\alpha$ 的效果。

**实验设计**：
- 固定问题：10 城市 TSP
- 变化参数：$T_0 \in \{100, 1000, 10000\}$，$\alpha \in \{0.9, 0.95, 0.99\}$
- 记录：最优解质量、收敛迭代数

**典型结果**：
- $T_0=100, \alpha=0.9$：探索不足，解质量差
- $T_0=1000, \alpha=0.99$：平衡，解质量好
- $T_0=10000, \alpha=0.999$：探索充分，但计算成本高

---

**6. 代价函数设计**：为 SAT 设计一个代价函数。

**答案要点**：
```python
def sat_cost(assignment, clauses, weights=None):
    """SAT 代价函数"""
    if weights is None:
        weights = {clause: 1 for clause in clauses}
    
    total = 0
    for clause in clauses:
        satisfied = any(
            assignment.get(var, None) == polarity 
            for var, polarity in clause
        )
        if not satisfied:
            total += weights[clause]
    
    # 未赋值变量惩罚
    unassigned = sum(1 for var in assignment if assignment[var] is None)
    
    return total + unassigned * 0.1
```

---

### 错误诊断

**7. 诊断错误**：温度调度太快会发生什么？

**核心思路**：探索不足 → 局部最优。

**答案要点**：
- $\alpha = 0.5$：温度快速下降
- 约 10 次迭代后接近 0
- 结果：几乎没有探索，困于局部最优
- 修复：$\alpha \geq 0.99$

---

**8. 代价函数错误**：如果代价函数不给部分信用，会发生什么？

**核心思路**：搜索无方向。

**答案要点**：
- 问题：中间状态无法评价
- 结果：SA 变成随机游走
- 修复：加入部分信用（如下界估计）

---

**9. 邻域函数设计错误**：如果邻域函数只生成一个邻居，会发生什么？

**核心思路**：搜索空间受限。

**答案要点**：
- 问题：每次只有一个选择
- 结果：退化为确定性搜索
- 修复：邻域函数应生成多个邻居（或至少随机）

---

### 方案比较

**10. 爬山 vs SA**：对比两种方法的效率和解质量。

**答案要点**：
| 特性 | 爬山法 | 模拟退火 |
|-----|-------|---------|
| 时间 | 快 | 较慢 |
| 解质量 | 局部最优 | 可能全局最优 |
| 实现 | 简单 | 需调参 |

**权衡**：小问题用爬山，大问题用 SA。

---

**11. 贪心度数 vs 匹配**：解释为什么复杂启发更差。

**核心思路**：贪心度数被"高度数诱惑"，但高度数不等于高效覆盖。

**答案要点**：
- 贪心度数：每次选度数最大的顶点
- 问题：高度数顶点可能覆盖分散的边，而非集中的边
- 反例：通过 Set Cover 归约，贪心近似比 Θ(log n)
- 对比：星图中贪心恰好最优（特殊情况）
- 最大匹配：有理论保证，近似比恒为 2

---

**12. SA vs 遗传算法**：对比两种方法。

**答案要点**：
| 特性 | SA | 遗传算法 |
|-----|-----|---------|
| 解表示 | 单解 | 种群 |
| 探索方式 | 温度 | 交叉、变异 |
| 收敛速度 | 较慢 | 较快 |
| 参数 | 温度调度 | 选择、交叉、变异率 |

---

### 开放设计

**13. 改进爬山法**：如何避免局部最优陷阱？

**答案要点**：
1. **随机重启**：困住后重新开始
2. **模拟退火**：接受劣转移
3. **禁忌搜索**：记录已访问，避免重复
4. **多起点**：并行搜索

---

**14. 自适应温度**：设计一个动态调整温度的策略。

**答案要点**：
```python
def adaptive_temperature(T, accept_rate, improve_rate):
    """自适应温度调整"""
    if accept_rate < 0.1:
        return T * 1.5  # 太冷，加热
    elif accept_rate > 0.5:
        return T * 0.95  # 太热，加速冷却
    else:
        return T * 0.99  # 正常冷却
```

---

**15. 混合策略**：设计 SA + 局部搜索的混合算法。

**答案要点**：
1. **SA 前期**：高温探索，广泛搜索
2. **SA 后期**：低温收敛，精细调整
3. **爬山法最后**：确保达到局部最优

---

**16. 代价函数设计**：为课程安排问题设计代价函数。

**答案要点**：
```python
def scheduling_cost(schedule, constraints):
    """课程安排代价函数"""
    # 硬约束惩罚（冲突）
    conflicts = count_conflicts(schedule)
    
    # 软约束惩罚（偏好）
    preference_penalty = sum(
        schedule.get(course, None) != preferred_time
        for course, preferred_time in constraints.preferences.items()
    )
    
    return conflicts * 1000 + preference_penalty
```

---

**17. LLM 应用**：如何将 SA 思想应用于 LLM 解码？

**答案要点**：
1. **温度采样**：高温时高温度，低温时低温度
2. **接受劣转移**：允许偶尔选择低概率 token
3. **冷却调度**：生成过程中逐渐降低温度

---

**18. 搜索策略选择**：设计一个 Agent 根据问题特征选择搜索策略。

**答案要点**：
```python
def select_search_strategy(problem_features):
    """根据问题特征选择策略"""
    if problem_features.size == 'small':
        return 'exhaustive'  # 穷举
    elif problem_features.structure == 'convex':
        return 'hill_climbing'  # 爬山
    elif problem_features.structure == 'rugged':
        return 'simulated_annealing'  # SA
    elif problem_features.has_heuristic:
        return 'astar'  # A*
    else:
        return 'random_restart'  # 随机重启
```

---

## 总结

### 核心要点

1. **模拟退火本质**：允许"错误"转移，逃逸局部最优
2. **温度调度**：控制探索-利用平衡的关键参数
3. **代价函数**：部分信用使中间状态可评价
4. **与 LLM 对应**：搜索策略是 LLM 推理的底层思想

### 实践建议

1. **参数调优**：先小实例，后大实例
2. **邻域设计**：确保可达性和多样性
3. **代价函数**：反映目标，给部分信用
4. **混合策略**：SA 探索 + 爬山精细

---

> **过渡**：搜索策略的本质是什么？从 DFS 到 A*，从回溯到 SA——我们看到的是同一思想的演进。下一节：**LLM 推理与搜索策略的同构性**。

---

**参考文献**：
- Kirkpatrick S, Gelatt C D, Vecchi M P. Optimization by Simulated Annealing[J]. Science, 1983.
- Vazirani V V. Approximation Algorithms[M]. Springer, 2001.
- Geman S, Geman D. Stochastic Relaxation, Gibbs Distributions, and the Bayesian Restoration of Images[J]. IEEE TPAMI, 1984.
- Hajek B. Cooling Schedules for Optimal Annealing[J]. Mathematics of Operations Research, 1988.
- Johnson D S. Approximation algorithms for combinatorial problems[J]. Journal of Computer and System Sciences, 1974.
