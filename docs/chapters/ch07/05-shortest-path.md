# 7.5 最短路径——寻找最优路径

> **问题情境**：地图导航：从A到B的最短路线是什么？如果有些道路有"负权"（如送快递有补贴），还能用Dijkstra吗？

---

## 问题情境：导航系统的选择

小明使用导航软件，发现一个问题：
- 从家到公司，导航推荐路线A（10分钟）
- 但路线B有"送快递补贴"（送快递能赚5分钟），实际只需5分钟
- 为什么导航没推荐路线B？

导航软件用的是Dijkstra算法，只能处理正权边。遇到负权边，Dijkstra失效！

**这一节要回答的核心问题**：**如何找到两点间的最短路径？Dijkstra为什么不能处理负权边？负权情况怎么办？**

---

## 直观思路：城市辐射 vs 波浪传播

### Dijkstra：城市辐射

想象从起点城市向外辐射：
- 先占领最近的城市（距离已知）
- 从已占领城市出发，向外辐射
- 每次选最近的未占领城市，更新其距离
- 逐步辐射，直到找到终点

**Dijkstra算法**：
- 贪心策略：每次选距离最小的未访问节点
- 优先队列维护"已发现但未访问"的节点
- 更新邻居距离：如果经过当前节点更近，更新

**关键类比**：Dijkstra像城市辐射，从中心向外扩张，先占领近的。

### Bellman-Ford：波浪传播

想象波浪反复传播：
- 每轮传播：所有节点向邻居发送距离信息
- 邻居收到后，如果更近，更新自己的距离
- 反复传播，直到距离不再变化（收敛）

**Bellman-Ford算法**：
- 动态规划：迭代松弛所有边
- 每轮：遍历所有边，尝试更新距离
- V-1轮后收敛（最多V-1步到达任何节点）

**关键类比**：Bellman-Ford像波浪传播，反复迭代直到稳定。

### Floyd-Warshall：全知视角

想象全知视角，枚举所有中转站：
- 对于每对节点(i, j)，尝试所有中转站k
- 经过k是否比直达更近？更新距离
- 枚举所有中转站，得到最优路径

**Floyd-Warshall算法**：
- 动态规划：状态是距离矩阵
- 状态转移：d[i][j] = min(d[i][j], d[i][k] + d[k][j])

**关键类比**：Floyd-Warshall像全知视角，枚举所有可能中转站。

---

## 规范定义：最短路径问题

### 单源最短路径

**定义（单源最短路径）**：给定源点s，找到s到所有其他节点的最短路径。

**形式化**：
- 输入：加权图G = (V, E, w)，源点s
- 输出：距离数组dist[v] = s到v的最短距离，路径数组parent[v]用于重建路径

### 全源最短路径

**定义（全源最短路径）**：找到所有节点对之间的最短路径。

**形式化**：
- 输入：加权图G = (V, E, w)
- 输出：距离矩阵dist[i][j] = i到j的最短距离

### 负权边和负环

**负权边**：边权重为负数的边。

**负环**：环的边权之和为负。

**关键定理**：
- 如果图有负环，最短路径不存在（可以无限绕圈减小距离）
- Bellman-Ford能检测负环

---

## 算法实现：Dijkstra、Bellman-Ford、Floyd-Warshall

### Dijkstra算法

```python
import heapq

def dijkstra(G, s):
    """
    Dijkstra算法：非负权图的单源最短路径
    
    参数：
        G：邻接表表示的图
        s：源点
    
    返回：
        dist：距离字典
        parent：父节点字典
    """
    n = len(G)
    dist = {v: float('inf') for v in range(n)}
    parent = {v: None for v in range(n)}
    
    dist[s] = 0
    pq = [(0, s)]  # (距离, 节点)
    
    while pq:
        d, u = heapq.heappop(pq)
        
        if d > dist[u]:
            continue  # 已找到更短路径，跳过
        
        for v, w in G[u]:
            weight = w
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight
                parent[v] = u
                heapq.heappush(pq, (dist[v], v))
    
    return dist, parent
```

### Bellman-Ford算法

```python
def bellman_ford(G, s):
    """
    Bellman-Ford算法：可处理负权的单源最短路径
    
    参数：
        G：邻接表表示的图
        s：源点
    
    返回：
        dist：距离字典（或None，表示有负环）
        parent：父节点字典
    """
    n = len(G)
    dist = {v: float('inf') for v in range(n)}
    parent = {v: None for v in range(n)}
    
    dist[s] = 0
    
    # V-1轮松弛
    for _ in range(n - 1):
        for u in range(n):
            for v, w in G[u]:
                weight = w
                if dist[u] + weight < dist[v]:
                    dist[v] = dist[u] + weight
                    parent[v] = u
    
    # 检测负环
    for u in range(n):
        for v, w in G[u]:
            weight = w
            if dist[u] + weight < dist[v]:
                return None, None  # 存在负环
    
    return dist, parent
```

### Floyd-Warshall算法

```python
def floyd_warshall(G):
    """
    Floyd-Warshall算法：全源最短路径
    
    参数：
        G：邻接表表示的图
    
    返回：
        dist：距离矩阵
    """
    n = len(G)
    
    # 初始化距离矩阵
    dist = [[float('inf')] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    
    for u in range(n):
        for v, w in G[u]:
            dist[u][v] = w
    
    # 动态规划：枚举中转站
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    
    return dist
```

---

## 正确性分析：为什么Dijkstra不能处理负权

### Dijkstra正确性（非负权）

**定理**：在非负权图中，Dijkstra正确计算最短距离。

**证明（归纳法）**：
- Dijkstra每次选距离最小的未访问节点u
- 设u被访问时，dist[u]是最短距离
- 为什么？因为所有未访问节点的距离 ≥ dist[u]
- 经过任何未访问节点的路径 ≥ dist[u]
- 因此dist[u]是最短距离，归纳成立

### Dijkstra为什么不能处理负权？

**经典反例**：

```
    S → A → T
    S → B
    B → A

边权重：
    S→A: 1, A→T: 4, S→B: 1, B→A: -2
```

**Dijkstra（O(V²)实现）执行过程**：

1. 从S开始，dist[S]=0
2. 访问S，更新邻居：dist[A]=1, dist[B]=1
3. **关键：dist[A]=dist[B]=1，两者并列最小。假设先选A访问**
4. 访问A，标记为"已确认"，更新T：dist[T]=1+4=5
5. 访问B，更新A：dist[A]=1-2=-1，但A已被"确认"，无法更新！
6. 最终结果：dist[T]=5

**实际最短路径**：S→B→A→T，距离=1-2+4=3

**Dijkstra返回错误答案！**

错误原因：
- Dijkstra假设：第一次访问节点u时，dist[u]已是最短距离
- 贪心选择的正确性依赖于"所有边权非负"
- 负权边破坏了这个假设：后续可能发现更短的路径
- 节点被标记"已确认"后，无法再更新

**关键洞察**：负权边可能让"已访问节点"的距离变小，破坏贪心选择。

### Bellman-Ford正确性

**定理**：Bellman-Ford在V-1轮后收敛（无负环）。

**证明**：
- 最短路径最多有V-1条边（否则有环）
- 每轮松弛至少让一条边的距离更新
- V-1轮后，所有最短路径都松弛完毕
- 如果还能松弛，说明存在负环

---

## 复杂度分析

| 算法 | 时间复杂度 | 适用场景 |
|------|-----------|---------|
| Dijkstra | O(E log V) 或 O(V²) | 非负权，单源 |
| Bellman-Ford | O(V·E) | 负权，单源，负环检测 |
| Floyd-Warshall | O(V³) | 全源 |

---

## 变式练习

### 练习1：手动模拟Dijkstra

给定加权图：
```
    A -- B -- C
    |    |    |
    D -- E -- F

边权重：
    A→B: 4, A→D: 2, B→C: 3, B→E: 1, D→E: 3, C→F: 2, E→F: 5
```

从A开始，手动模拟Dijkstra，找到到F的最短路径。

### 练习2：负权反例

验证经典负权反例：

```
    S → A → T
    S → B
    B → A

边权重：
    S→A: 1, A→T: 4, S→B: 1, B→A: -2
```

手动模拟Dijkstra，假设访问顺序是S→A→B：
- Dijkstra返回dist[T]=5
- 实际最短：S→B→A→T，距离=3
- 解释：为什么A被访问后无法更新

### 练习3：负环检测

给定图：
```
    A → B → C → A
    边权重：A→B: 1, B→C: 1, C→A: -3
```

检测负环：环权=1+1-3=-1（负环）

Bellman-Ford能检测。

---

## 本节小结

### 核心问题回答

**问题**：如何找到两点间的最短路径？负权情况怎么办？

**答案**：
- **Dijkstra**：贪心 + 优先队列，非负权图，单源
- **Bellman-Ford**：动态规划 + 松弛，负权图，负环检测
- **Floyd-Warshall**：动态规划，全源最短路径

### 关键洞察

1. **Dijkstra不能处理负权**：负权破坏贪心选择，已访问节点距离可能变小
2. **Bellman-Ford能处理负权**：反复松弛，直到收敛
3. **负环检测**：Bellman-Ford第V轮仍能松弛，说明有负环

### LLM时代视角

**神经Bellman-Ford**：

研究[NBF'21]显示，可以将Bellman-Ford的迭代结构嵌入神经网络：
- GNN的消息传递 = Bellman-Ford的松弛
- 用于知识图谱的多跳推理
- 神经网络"学习"最短路径计算

**关键洞察**：传统算法的迭代结构可被神经网络"学习"。

### 思考题

1. 为什么Dijkstra不能处理负权边？
2. Bellman-Ford为什么需要V-1轮？
3. Floyd-Warshall的时间复杂度为什么是O(V³)？
4. 如何检测负环？

---

## 本节练习题

### 问题情境与直觉

1. **直觉建立**：画一个3个城市的道路网络，手动模拟Dijkstra。

2. **负权理解**：为什么负权边让Dijkstra失效？关键是什么？

3. **策略选择**：以下场景选择哪种算法：
    - 地图导航（所有边为正）
    - 货币兑换（有套利机会，负环）
    - 全城市距离表（全源）

### 方法应用与实现

4. **实现练习**：实现Dijkstra算法，处理非负权图。

5. **负权处理**：实现Bellman-Ford算法，处理负权图并检测负环。

6. **全源最短路径**：实现Floyd-Warshall算法。

### 错误诊断与反例

7. **反例构造**：构造一个负权图，展示Dijkstra失败。关键：已访问节点距离被负权边减小。

8. **错误诊断**：某人用Dijkstra处理负权图，导致最短路径错误。如何检测并提示？

9. **边界条件**：如果图中没有从s到t的路径，算法返回什么？如何判断？

### 方案比较与权衡

10. **对比分析**：对比Dijkstra、Bellman-Ford、Floyd-Warshall的时间复杂度和适用场景。

11. **选择决策**：以下场景选择哪种算法：
    - 稀疏图，非负权（V=1万, E=2万）
    - 有负权边，无负环
    - 需要全源最短路径

### 变式与边界条件

12. **变式应用**：货币套利问题：找到负环意味着套利机会。

13. **最短路径计数**：除了找最短距离，还要找有几条最短路径。

14. **边界条件**：完全图（所有节点互相连接），全源最短路径用Floyd-Warshall还是Dijkstra调用V次？

### 开放设计

15. **导航系统**：设计一个导航系统，支持：
    - 输入起点和终点
    - 输出最短路径和距离
    - 处理负权边（如送货补贴）

### 综合应用

16. **知识图谱推理**：在知识图谱中，用最短路径算法找实体间的关系路径。

### LLM协同实验

17. **让LLM解释**：让LLM解释"Dijkstra为什么不能处理负权边"。观察其是否理解贪心选择被破坏。

18. **让LLM选择**：给LLM一个有负权边的图问题，让它选择算法。检查是否正确选择Bellman-Ford。

---

_本节完成于 2026-06-20_