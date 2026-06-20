# 4.6 最大流

> "最大流最小割定理是网络流的理论核心。"
> — CLRS

---

## 学习目标

- 掌握 Ford-Fulkerson 方法
- 理解最大流最小割定理
- 了解推送-重贴标签算法
- 理解二部匹配与最大流的联系

---

## 问题定义

### 网络流

给定有向图 G，源点 s，汇点 t，每条边有容量 c(u,v)。

**流** 是一个函数 f，满足：
1. **容量约束**：0 ≤ f(u,v) ≤ c(u,v)
2. **流量守恒**：对所有中间顶点 v，流入 = 流出

### 最大流问题

求从 s 到 t 的最大流量。

---

## Ford-Fulkerson 方法

### 核心概念

**增广路径**：从 s 到 t 的路径，路径上每条边都有剩余容量。

**残余图**：G_f 包含原边和反向边，反向边容量 = 当前流量（用于"撤销"）。

### 算法框架

```
1. 初始化流量为 0
2. 在残余图中找增广路径 p
3. 沿 p 增加流量（取 p 上最小剩余容量）
4. 更新残余图
5. 重复 2-4 直到没有增广路径
```

### 增广路径选择

增广路径的选择影响效率：

| 选择方法 | 时间复杂度 |
|----------|------------|
| BFS（最短路径） | O(VE²) |
| DFS | 可能不收敛（整数流则 O(E|f*|)） |
| 最大容量 | O(E² log C) |

### 实现（Edmonds-Karp，BFS 增广）

```python
from collections import deque

def edmonds_karp(capacity, n, s, t):
    flow = [[0] * n for _ in range(n)]
    total_flow = 0
    
    while True:
        # BFS 找增广路径
        parent = [-1] * n
        parent[s] = s
        q = deque([s])
        while q and parent[t] == -1:
            u = q.popleft()
            for v in range(n):
                if parent[v] == -1 and capacity[u][v] - flow[u][v] > 0:
                    parent[v] = u
                    q.append(v)
        
        if parent[t] == -1:  # 没有增广路径
            break
        
        # 计算增广量
        aug = float('inf')
        v = t
        while v != s:
            u = parent[v]
            aug = min(aug, capacity[u][v] - flow[u][v])
            v = u
        
        # 更新流量
        v = t
        while v != s:
            u = parent[v]
            flow[u][v] += aug
            flow[v][u] -= aug
            v = u
        
        total_flow += aug
    
    return total_flow, flow
```

---

## 最大流最小割定理

### 定义

**割** (S, T) 是将顶点分为两个集合，s ∈ S，t ∈ T。

**割容量** = Σ c(u,v) 对所有 u ∈ S, v ∈ T。

### 定理

**最大流 = 最小割容量**

```
|f| = c(S, T) 对某个割 (S, T)
```

### 证明思路

```
1. |f| ≤ c(S, T) 对任何割（流不能超过割容量）
2. Ford-Fulkerson 结束时，残余图中 s 可达的顶点集合 S
   构成一个割，且 |f| = c(S, T)
3. 因此 |f| = 最小割容量
```

### 意义

- 最大流问题 ⟺ 最小割问题
- 最小割可从最大流算法的残余图直接得到

---

## 推送-重贴标签算法

### 核心思想

不找增广路径，而是维护"预流"，逐步推进到合法流。

### 关键概念

**预流**：允许中间顶点有"超额流量"。

**高度函数**：h(s) = |V|, h(t) = 0, h(u) ≤ h(v) + 1 对所有残余边。

**推送**：如果 u 有超额流量且 h(u) > h(v)，将流量推送到 v。

**重贴标签**：如果 u 有超额流量但不能推送，增加 h(u)。

### 时间复杂度

- O(V²E)

### 优势

- 不需要找增广路径
- 适合稠密图

---

## 二部匹配

### 问题

给定二部图 G = (X, Y, E)，求最大匹配（最大的一对一配对）。

### 建模为最大流

```
1. 添加源点 s，连接所有 X 中的顶点（容量 1）
2. 添加汇点 t，连接所有 Y 中的顶点（容量 1）
3. X → Y 的边容量为 1
4. 最大流 = 最大匹配
```

### 实现

```python
def bipartite_matching(edges, x_size, y_size):
    n = x_size + y_size + 2
    s = x_size + y_size
    t = x_size + y_size + 1
    
    capacity = [[0] * n for _ in range(n)]
    
    # s 连接 X
    for i in range(x_size):
        capacity[s][i] = 1
    
    # Y 连接 t
    for j in range(y_size):
        capacity[x_size + j][t] = 1
    
    # X → Y
    for x, y in edges:
        capacity[x][x_size + y] = 1
    
    total_flow, flow = edmonds_karp(capacity, n, s, t)
    
    # 提取匹配
    matching = []
    for x in range(x_size):
        for y in range(y_size):
            if flow[x][x_size + y] == 1:
                matching.append((x, y))
    
    return matching
```

---

## 应用场景

| 应用 | 建模 |
|------|------|
| 物流运输 | 工厂/仓库 → 流网络 |
| 任务分配 | 工人/任务 → 二部匹配 |
| 网络带宽 | 路由器/链路 → 流网络 |

---

## LLM 融合点

### 任务：二部匹配建模

```
场景：
- 5 个候选人，5 个职位
- 候选人 1 适合职位 A, C
- 候选人 2 适合职位 A, B
- 候选人 3 适合职位 B, D
- 候选人 4 适合职位 C, E
- 候选人 5 适合职位 D, E

问题：
1. 建模为二部图
2. 建模为网络流问题
3. 求最大匹配
```

---

## 小结

**Ford-Fulkerson**：
- 增广路径法
- O(VE²)（BFS 增广）
- 最大流最小割定理

**推送-重贴标签**：
- O(V²E)
- 不找增广路径
- 适合稠密图

**二部匹配**：
- 建模为最大流
- 容量均为 1

---

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapter 26
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapter 8