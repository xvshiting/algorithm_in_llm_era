# 4.5 最短路径

> "Dijkstra 的证明是归纳法的经典应用。"
> — CLRS

---

## 学习目标

- 掌握 Dijkstra、Bellman-Ford、Floyd-Warshall 算法
- 理解 Dijkstra 的归纳正确性证明
- 理解 Bellman-Ford 的路径松弛性质
- 判断算法适用场景

---

## 问题定义

### 单源最短路径

给定图 G 和源点 s，求 s 到所有其他顶点的最短路径。

### 全源最短路径

求任意两个顶点之间的最短路径。

---

## Dijkstra 算法

### 适用条件

**所有边权重非负**。

### 核心思想

维护已确定最短路径的顶点集合 S，每次从 S 扩展一个顶点。

### 算法步骤

```
1. 初始化：d[s] = 0，d[v] = ∞ 对其他顶点
2. 维护优先队列 Q，存储未确定顶点
3. 从 Q 中取出 d 最小的顶点 u
4. 对 u 的每个邻居 v：
   如果 d[u] + w(u,v) < d[v]：
       更新 d[v] = d[u] + w(u,v)
5. 将 u 加入 S
6. 重复 3-5 直到 Q 为空
```

### 实现

```python
import heapq

def dijkstra(graph, n, start):
    dist = [float('inf')] * n
    dist[start] = 0
    pq = [(0, start)]
    visited = [False] * n
    
    while pq:
        d, u = heapq.heappop(pq)
        if visited[u]:
            continue
        visited[u] = True
        for v, w in graph.neighbors(u):
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    
    return dist
```

### 时间复杂度

- 优先队列实现：O(E log V)
- 邻接矩阵实现：O(V²)

### 正确性证明（归纳法）

**定理**：每次从 Q 中取出顶点 u 时，d[u] 就是 s 到 u 的最短路径长度。

**证明思路**：

```
归纳假设：前 k 步取出的顶点，其 d 值都是正确的最短路径长度。
归纳步骤：第 k+1 步取出 u。

设 s 到 u 的真实最短路径为 p。
路径 p 上必有某顶点 y 在 S 中，某顶点 x 不在 S 中（y → x）。
当 y 加入 S 时，d[x] 被更新为 d[y] + w(y,x) ≤ 真实最短路径。
因此 d[x] ≤ d[u]（因为 u 是 Q 中 d 最小的）。
又因为 u 在 Q 中 d 最小，d[u] ≤ d[x]。
所以 d[u] = d[x] = 真实最短路径。

归纳完成。
```

---

## Bellman-Ford 算法

### 适用条件

**可以有负权边，能检测负权环**。

### 核心思想

对所有边进行 V-1 次松弛。

### 算法步骤

```
1. 初始化：d[s] = 0，d[v] = ∞ 对其他顶点
2. 对 i = 1 到 V-1：
   对每条边 (u, v)：
       如果 d[u] + w(u,v) < d[v]：
           更新 d[v] = d[u] + w(u,v)
3. 检测负权环：
   对每条边 (u, v)：
       如果 d[u] + w(u,v) < d[v]：
           存在负权环
```

### 实现

```python
def bellman_ford(edges, n, start):
    dist = [float('inf')] * n
    dist[start] = 0
    
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
    
    # 检测负权环
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            return None  # 存在负权环
    
    return dist
```

### 时间复杂度

- O(VE)

### 路径松弛性质

**定理**：如果从 s 到 v 的最短路径有 k 条边，则 Bellman-Ford 第 k 次迭代后 d[v] 正确。

**证明**：每次迭代松弛至少一条最短路径上的边。

---

## Floyd-Warshall 算法

### 适用条件

**全源最短路径，可以有负权边**（但不能有负权环）。

### 核心思想

动态规划。定义 dp[k][i][j] 为"只使用顶点 1..k 作为中间顶点，i 到 j 的最短路径"。

### 状态转移

```
dp[k][i][j] = min(dp[k-1][i][j], dp[k-1][i][k] + dp[k-1][k][j])
```

### 实现

```python
def floyd_warshall(graph, n):
    dist = [[float('inf')] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, w in graph.edges():
        dist[u][v] = w
    
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    
    return dist
```

### 时间复杂度

- O(V³)

---

## 算法选择指南

| 条件 | 算法 | 复杂度 |
|------|------|--------|
| 单源，非负权，稀疏 | Dijkstra | O(E log V) |
| 单源，非负权，稠密 | Dijkstra (矩阵) | O(V²) |
| 单源，可能有负权 | Bellman-Ford | O(VE) |
| 全源，稀疏 | Johnson | O(VE log V) |
| 全源，稠密 | Floyd-Warshall | O(V³) |

---

## LLM 融合点

### 任务：算法选择

```
场景：
- 顶点数：10000
- 边数：50000
- 边权重：非负
- 问题：从顶点 1 到所有顶点的最短路径

问题：
1. 应该用哪个算法？
2. 为什么不用其他算法？
3. 实现 Python 代码
```

**判断 LLM 回答是否正确**：
- 是否选择 Dijkstra？
- 是否考虑稀疏性（E < V²）？
- 是否理解负权问题？

### 任务：负权检测

```
场景：
- 边权重可能有负值
- 需要检测负权环

问题：
1. 应该用哪个算法？
2. 如何检测负权环？
```

---

## 小结

**Dijkstra**：
- 非负权
- O(E log V)
- 归纳法正确性证明

**Bellman-Ford**：
- 可负权，检测负权环
- O(VE)
- 路径松弛性质

**Floyd-Warshall**：
- 全源最短路
- O(V³)
- DP 状态转移

**常见错误**：负权用 Dijkstra。

---

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapters 24-25
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapter 6