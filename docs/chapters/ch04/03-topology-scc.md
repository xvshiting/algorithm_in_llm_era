# 4.3 拓扑排序与强连通分量

> "有向图的结构分析，从 DAG 和 SCC 开始。"
> — 本章核心观点

---

## 学习目标

- 掌握拓扑排序的两种方法
- 理解 DAG 与拓扑排序的关系
- 掌握 SCC 的 Kosaraju 和 Tarjan 算法
- 理解 SCC 压缩 DAG 的应用

---

## 拓扑排序

### 定义

拓扑排序是对有向无环图（DAG）顶点的线性排序，使得对于每条边 u → v，u 在排序中出现在 v 之前。

### 前提条件

**图必须无环**。如果图有环，不存在拓扑排序。

### Kahn 算法（入度法）

```
1. 计算所有顶点的入度
2. 将入度为 0 的顶点加入队列
3. 取出队列顶点，加入排序结果
4. 将其所有邻居的入度减 1
5. 如果邻居入度变为 0，加入队列
6. 重复 3-5 直到队列为空
7. 如果排序结果包含所有顶点，成功；否则图有环
```

```python
from collections import deque

def kahn_topo_sort(graph, n):
    in_degree = [0] * n
    for u in range(n):
        for v in graph.neighbors(u):
            in_degree[v] += 1
    
    queue = deque([u for u in range(n) if in_degree[u] == 0])
    result = []
    
    while queue:
        u = queue.popleft()
        result.append(u)
        for v in graph.neighbors(u):
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
    
    if len(result) == n:
        return result  # 拓扑排序成功
    else:
        return None  # 图有环
```

**时间复杂度**：O(V + E)

**优点**：天然包含环检测。

---

### DFS 逆后序法

```
1. 对图进行 DFS
2. 记录顶点的完成时间
3. 按完成时间逆序排列
4. 逆序即为拓扑排序
```

```python
def dfs_topo_sort(graph, n):
    visited = [False] * n
    result = []
    
    def dfs(u):
        visited[u] = True
        for v in graph.neighbors(u):
            if not visited[v]:
                dfs(v)
        result.append(u)  # 完成时加入
    
    for u in range(n):
        if not visited[u]:
            dfs(u)
    
    return result[::-1]  # 逆序
```

**时间复杂度**：O(V + E)

**注意**：此方法**不自动检测环**，需要额外处理。

---

### Kahn vs DFS

| 维度 | Kahn | DFS |
|------|------|-----|
| 环检测 | 自动 | 需额外处理 |
| 实现 | 迭代 | 递归 |
| 空间 | O(V) | O(V)（栈深度） |
| 适用 | 需要环检测 | 已知 DAG |

---

## 强连通分量（SCC）

### 定义

强连通分量是有向图中**最大**的强连通子图。强连通意味着任意两个顶点互相可达。

### SCC 压缩

将每个 SCC 压缩为一个顶点，得到的图是 **DAG**。这是分析有向图结构的基本工具。

### Kosaraju 算法

**核心思想**：两遍 DFS。

```
第一遍：对原图 G 进行 DFS，记录完成时间（逆后序）
第二遍：对逆图 G^T 按逆后序进行 DFS，每棵 DFS 树是一个 SCC
```

```python
def kosaraju_scc(graph, n):
    # 第一遍 DFS
    visited = [False] * n
    finish_order = []
    
    def dfs1(u):
        visited[u] = True
        for v in graph.neighbors(u):
            if not visited[v]:
                dfs1(v)
        finish_order.append(u)
    
    for u in range(n):
        if not visited[u]:
            dfs1(u)
    
    # 构建逆图
    reverse_graph = build_reverse_graph(graph, n)
    
    # 第二遍 DFS
    visited = [False] * n
    sccs = []
    
    def dfs2(u, scc):
        visited[u] = True
        scc.append(u)
        for v in reverse_graph.neighbors(u):
            if not visited[v]:
                dfs2(v, scc)
    
    for u in reversed(finish_order):
        if not visited[u]:
            scc = []
            dfs2(u, scc)
            sccs.append(scc)
    
    return sccs
```

**时间复杂度**：O(V + E)

**正确性直觉**：
- 逆后序保证"出口"顶点先处理
- 逆图中，能从"出口"返回的顶点构成 SCC

---

### Tarjan 算法

**核心思想**：单遍 DFS + lowlink 值。

```
对每个顶点 u：
- 记录发现时间 d[u]
- 计算 lowlink[u] = min(d[u], min d[v] for v reachable from u)
- 如果 lowlink[u] == d[u]，u 是 SCC 的根
```

```python
def tarjan_scc(graph, n):
    index = 0
    d = [-1] * n
    low = [0] * n
    on_stack = [False] * n
    stack = []
    sccs = []
    
    def strongconnect(u):
        nonlocal index
        d[u] = low[u] = index
        index += 1
        stack.append(u)
        on_stack[u] = True
        
        for v in graph.neighbors(u):
            if d[v] == -1:  # 未访问
                strongconnect(v)
                low[u] = min(low[u], low[v])
            elif on_stack[v]:
                low[u] = min(low[u], d[v])
        
        if low[u] == d[u]:  # SCC 根
            scc = []
            while True:
                v = stack.pop()
                on_stack[v] = False
                scc.append(v)
                if v == u:
                    break
            sccs.append(scc)
    
    for u in range(n):
        if d[u] == -1:
            strongconnect(u)
    
    return sccs
```

**时间复杂度**：O(V + E)

**优点**：单遍 DFS，效率更高。

---

## 应用场景

### 拓扑排序应用

| 应用 | 建模 |
|------|------|
| 课程排课 | 课程 → 顶点，先修 → 边 |
| 任务调度 | 任务 → 顶点，依赖 → 边 |
| 编译依赖 | 文件 → 顶点，include → 边 |

### SCC 应用

| 应用 | 建模 |
|------|------|
| 网页排名 | 网页 → 顶点，链接 → 边，SCC 是强连通社区 |
| 2-SAT | 变量 → 顶点，蕴含 → 边，SCC 检测矛盾 |
| 社交网络 | 用户 → 顶点，关注 → 边，SCC 是强连通圈 |

---

## LLM 融合点

### 任务 1：环检测

```
问题描述：
某课程先修关系如下：
C1 → C2 → C3 → C1

让 LLM 实现拓扑排序。
```

**判断**：LLM 是否正确检测到环并返回错误？

### 任务 2：SCC 应用

```
问题：
某社交网络有 5 个用户，关注关系：
1 → 2, 2 → 3, 3 → 1, 3 → 4, 4 → 5, 5 → 4

求：
1. 所有 SCC
2. SCC 压缩后的 DAG
```

---

## 小结

**拓扑排序**：
- Kahn 算法：入度法，自动环检测
- DFS 逆后序：完成时间逆序
- 前提：图必须无环

**强连通分量**：
- Kosaraju：两遍 DFS
- Tarjan：单遍 DFS + lowlink
- SCC 压缩后是 DAG

**常见错误**：
- 拓扑排序忽略环检测
- SCC 边界情况（单顶点）

---

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapter 22
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapter 5