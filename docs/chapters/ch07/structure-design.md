# Ch7 图算法——网络的数学语言

## 章节结构设计

> **核心叙事**：图是网络的数学语言——如何高效地探索、连接、优化网络结构

---

## 设计哲学对照

| 原则 | 本章落实 |
|------|----------|
| 问题驱动 | 每节从真实网络问题出发（社交网络、地图导航、物流配送） |
| 直觉先于形式 | 先画图模拟遍历，再定义 BFS/DFS 形式化 |
| 展示推理过程 | 从朴素方案→发现问题→优化方案，展示算法发现的思考过程 |
| 解释难点 | "为什么 DFS 发现后向边等价于有环""为什么 Dijkstra 不能处理负权" |
| 例子递进 | 最小示例 → 反例陷阱 → 变式应用 → 真实问题 |
| 练习多样化 | 基础理解、方法应用、错误诊断、方案比较、开放设计、LLM协同 |
| 认知闭环 | 解决什么问题？核心方法？为什么正确？代价？何时不适用？ |

---

## 章节导航结构

```
7.1 图的表示——从地图到邻接表
    └─ 问题：如何在计算机中表示道路网络？

7.2 BFS 与 DFS——探索网络的两种策略
    └─ 问题：如何遍历网络中的所有节点？

7.3 拓扑排序与 SCC——有向无环图的结构
    └─ 问题：如何确定任务的执行顺序？如何识别强依赖？

7.4 最小生成树——以最小成本连通网络
    └─ 问题：如何用最少的边连接所有节点？

7.5 最短路径——寻找最优路径
    └─ 问题：如何找到两点之间的最短路径？

7.6 网络流——资源分配的数学
    └─ 问题：如何最大化网络中的资源流量？

7.7 设计图而非算法——建模的艺术
    └─ 问题：如何将现实问题建模为图问题？

7.8 综合练习
```

---

## 各节七步结构规划

### 7.1 图的表示——从地图到邻接表

**问题情境**
> 2024 年某导航公司发现，同样的地图数据，用不同表示方法存储，内存占用相差 10 倍。为什么？

**直观思路**
- 地图是什么？路口 + 道路 = 顶点 + 边
- 邻接矩阵：直观但稀疏图浪费空间
- 邻接表：按需存储，适合稀疏图

**规范定义**
- 图的形式定义：G = (V, E)
- 邻接矩阵表示：空间 O(V²)
- 邻接表表示：空间 O(V + E)
- 边列表表示：适合边迭代

**算法实现**
```python
# 三种表示的 Python 实现
class AdjacencyMatrix:
    def __init__(self, n):
        self.matrix = [[0] * n for _ in range(n)]
    
    def add_edge(self, u, v, weight=1):
        self.matrix[u][v] = weight

class AdjacencyList:
    def __init__(self, n):
        self.adj = [[] for _ in range(n)]
    
    def add_edge(self, u, v, weight=1):
        self.adj[u].append((v, weight))
```

**正确性分析**
- 三种表示等价性证明：可以相互转换
- 操作正确性：添加/删除/查询边

**复杂度分析**
| 操作 | 邻接矩阵 | 邻接表 |
|------|----------|--------|
| 空间 | O(V²) | O(V+E) |
| 查边 | O(1) | O(deg(v)) |
| 遍历邻居 | O(V) | O(deg(v)) |

**变式练习**
1. 给定 1000 个城市的道路网络，选择哪种表示？
2. 实现邻接矩阵和邻接表的相互转换

**例子递进**
- 最小示例：4 个顶点、3 条边的无向图
- 反例陷阱：邻接矩阵存完全图 vs 链状图的空间对比
- 变式应用：有权图、有向图、带自环图的表示
- 真实问题：社交网络（邻接表）、棋盘游戏（邻接矩阵）

**LLM 连接切入点**
- 让 LLM 选择图的表示方式，评价其选择依据
- LLM 生成图数据结构代码，检查是否正确处理有向/无向

---

### 7.2 BFS 与 DFS——探索网络的两种策略

**问题情境**
> 你在一个陌生的城市，想找到最近的地铁站。应该"逐圈搜索"还是"沿着一条路走到底"？

**直观思路**
- BFS = 水波扩散 = 找无权最短路径
- DFS = 深入探索 = 找路径存在性
- 类比：BFS 像地毯式搜索，DFS 像追踪猎物

**规范定义**
- BFS 形式定义：队列维护已发现但未探索的节点
- DFS 形式定义：递归或栈实现，优先深入
- 时间戳：发现时间 d[v]、完成时间 f[v]

**算法实现**
```python
def bfs(G, s):
    """BFS 返回从 s 到各点的距离"""
    dist = {v: float('inf') for v in G}
    dist[s] = 0
    queue = deque([s])
    while queue:
        u = queue.popleft()
        for v in G[u]:
            if dist[v] == float('inf'):
                dist[v] = dist[u] + 1
                queue.append(v)
    return dist

def dfs(G):
    """DFS 返回时间戳和边分类"""
    time = 0
    d, f, parent = {}, {}, {}
    
    def visit(u):
        nonlocal time
        time += 1
        d[u] = time
        for v in G[u]:
            if v not in d:
                parent[v] = u
                visit(v)
        time += 1
        f[u] = time
    
    for u in G:
        if u not in d:
            parent[u] = None
            visit(u)
    return d, f, parent
```

**正确性分析**
- BFS 正确性：归纳证明距离正确性
- DFS 边分类：树边/后向边/前向边/交叉边
- **核心定理**：后向边存在 ⟺ 图有环（白色/灰色/黑色路径定理）

**复杂度分析**
- BFS：O(V + E)，每个顶点和边访问一次
- DFS：O(V + E)

**变式练习**
1. 手动模拟 BFS 和 DFS 在给定图上的执行过程
2. 证明 DFS 发现后向边当且仅当图有环
3. 用 BFS 实现"社交网络中两个人之间的最短距离"

**例子递进**
- 最小示例：3 个顶点的链状图
- 反例陷阱：BFS 找最短路径 vs 有权图上的错误
- 变式应用：BFS 检测二分图、DFS 找关节点
- 真实问题：迷宫求解（DFS）、社交网络距离（BFS）

**LLM 连接切入点**
- 让 LLM 解释 BFS 和 DFS 的区别，检查是否理解"层次"vs"深度"
- 让 LLM 用 DFS 检测环，观察其是否正确理解后向边条件

---

### 7.3 拓扑排序与 SCC——有向无环图的结构

**问题情境**
> 课程有先修要求：操作系统需要先修数据结构和计算机组成，数据结构需要先修程序设计。如何确定选课顺序？如果存在循环依赖怎么办？

**直观思路**
- 拓扑排序 = 任务调度顺序
- 环检测 = 发现循环依赖
- SCC 分解 = 识别"必互达"的节点群

**规范定义**
- DAG 定义：有向无环图
- 拓扑排序定义：线性排序，所有边 (u,v) 满足 u 在 v 前
- SCC 定义：强连通分量，相互可达的最大节点集

**算法实现**
```python
def kahn_toposort(G):
    """Kahn 算法：入度为 0 的顶点逐步删除"""
    in_degree = {v: 0 for v in G}
    for u in G:
        for v in G[u]:
            in_degree[v] += 1
    
    queue = deque([v for v in G if in_degree[v] == 0])
    order = []
    
    while queue:
        u = queue.popleft()
        order.append(u)
        for v in G[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                queue.append(v)
    
    return order if len(order) == len(G) else None  # None 表示有环

def kosaraju_scc(G):
    """Kosaraju 算法：两遍 DFS"""
    # 第一遍：原图 DFS，记录完成时间
    visited = set()
    finish_order = []
    
    def dfs1(u):
        visited.add(u)
        for v in G[u]:
            if v not in visited:
                dfs1(v)
        finish_order.append(u)
    
    for u in G:
        if u not in visited:
            dfs1(u)
    
    # 第二遍：逆图按逆后序遍历
    G_rev = {v: [] for v in G}
    for u in G:
        for v in G[u]:
            G_rev[v].append(u)
    
    visited.clear()
    sccs = []
    
    def dfs2(u, scc):
        visited.add(u)
        scc.append(u)
        for v in G_rev[u]:
            if v not in visited:
                dfs2(v, scc)
    
    for u in reversed(finish_order):
        if u not in visited:
            scc = []
            dfs2(u, scc)
            sccs.append(scc)
    
    return sccs
```

**正确性分析**
- 拓扑排序存在性：DAG ⟺ 拓扑排序存在
- Kahn 算法正确性：归纳证明
- Kosaraju 算法正确性：两遍 DFS 的等价性

**复杂度分析**
- Kahn 拓扑排序：O(V + E)
- Kosaraju SCC：O(V + E)
- Tarjan SCC：O(V + E)，单遍 DFS

**变式练习**
1. 判断给定有向图是否有环，如有则输出环
2. 用 SCC 分解分析网页排名中的"链接农场"
3. 设计一个任务调度系统，支持依赖检测

**例子递进**
- 最小示例：3 门课程的依赖关系
- 反例陷阱：循环依赖 → 拓扑排序失败
- 变式应用：编译依赖分析、课程排课系统
- 真实问题：Makefile 的依赖解析、Excel 公式依赖计算

**LLM 连接切入点**
- 让 LLM 解释"为什么两遍 DFS 能找 SCC"
- 让 LLM 设计一个任务调度系统，检查是否考虑环检测

---

### 7.4 最小生成树——以最小成本连通网络

**问题情境**
> 某电信公司要在 10 个城市间铺设光缆，成本与距离成正比。如何用最小总成本连通所有城市？

**直观思路**
- MST = 以最小边权和连通所有节点
- 贪心策略：每次选最小的安全边
- "安全边"：加入后不形成环的边

**规范定义**
- 生成树定义：连通无向图的生成子图，恰有 V-1 条边
- 切割性质：对于任何切割，轻量级边属于某棵 MST
- MST 存在性：连通图必有 MST

**算法实现**
```python
def kruskal_mst(G, weights):
    """Kruskal 算法：贪心 + 并查集"""
    edges = sorted(weights.keys(), key=lambda e: weights[e])
    uf = UnionFind(G)
    mst = []
    
    for u, v in edges:
        if uf.find(u) != uf.find(v):
            uf.union(u, v)
            mst.append((u, v))
    
    return mst

def prim_mst(G, weights, start=0):
    """Prim 算法：贪心 + 优先队列"""
    import heapq
    
    mst = []
    visited = set([start])
    edges = [(weights[(start, v)], start, v) for v in G[start]]
    heapq.heapify(edges)
    
    while edges and len(visited) < len(G):
        w, u, v = heapq.heappop(edges)
        if v not in visited:
            visited.add(v)
            mst.append((u, v, w))
            for next_v in G[v]:
                if next_v not in visited:
                    heapq.heappush(edges, (weights[(v, next_v)], v, next_v))
    
    return mst
```

**正确性分析**
- 切割性质证明：轻量级边必在某 MST 中
- Kruskal 正确性：基于切割性质的归纳
- Prim 正确性：基于切割性质的归纳

**复杂度分析**
- Kruskal：O(E log E) 或 O(E α(V)) 用并查集
- Prim：O(E log V) 用二叉堆，O(E + V log V) 用斐波那契堆

**变式练习**
1. 用切割性质证明 Kruskal 的正确性
2. 对比 Kruskal 和 Prim 在稀疏图 vs 稠密图上的效率
3. 实现 MST 并可视化

**例子递进**
- 最小示例：4 个城市的道路网络
- 反例陷阱：为什么"选最小边"不能直接用于最短路径？
- 变式应用：最小瓶颈生成树、次小生成树
- 真实问题：电路设计、网络设计

**LLM 连接切入点**
- 让 LLM 解释 Kruskal 和 Prim 的区别
- 让 LLM 判断一个边是否是"安全边"

---

### 7.5 最短路径——寻找最优路径

**问题情境**
> 地图导航：从 A 到 B 的最短路线是什么？如果有些道路有"负权"（如送快递有补贴），还能用 Dijkstra 吗？

**直观思路**
- Dijkstra = 贪心 + 优先队列，类似 BFS 扩展
- Bellman-Ford = 松弛所有边，能检测负环
- Floyd-Warshall = 动态规划，求全源最短路

**规范定义**
- 单源最短路径：从源点 s 到所有点的最短路
- 全源最短路径：任意两点间的最短路
- 负环：权和为负的环

**算法实现**
```python
def dijkstra(G, weights, s):
    """Dijkstra 算法：非负权图"""
    import heapq
    
    dist = {v: float('inf') for v in G}
    dist[s] = 0
    pq = [(0, s)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v in G[u]:
            w = weights.get((u, v), weights.get((v, u), float('inf')))
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    
    return dist

def bellman_ford(G, weights, s):
    """Bellman-Ford 算法：可处理负权"""
    dist = {v: float('inf') for v in G}
    dist[s] = 0
    
    for _ in range(len(G) - 1):
        for u in G:
            for v in G[u]:
                w = weights.get((u, v), float('inf'))
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
    
    # 检测负环
    for u in G:
        for v in G[u]:
            w = weights.get((u, v), float('inf'))
            if dist[u] + w < dist[v]:
                return None  # 存在负环
    
    return dist
```

**正确性分析**
- Dijkstra 正确性：归纳证明，基于最优子结构
- Bellman-Ford 正确性：路径松弛性质
- **关键定理**：Dijkstra 为什么不能处理负权？——贪心选择被破坏

**复杂度分析**
- Dijkstra：O(E log V) 或 O(V²) 稠密图
- Bellman-Ford：O(VE)
- Floyd-Warshall：O(V³)

**变式练习**
1. 构造 Dijkstra 在负权图上失败的例子
2. 实现全源最短路径算法，对比 Dijkstra 调用 V 次和 Floyd-Warshall
3. 设计一个带有"过路费"（负权）的最短路径问题

**例子递进**
- 最小示例：3 个城市的道路网络
- 反例陷阱：Dijkstra 遇负权失效
- 变式应用：带负权的最短路、检测负环
- 真实问题：地图导航、货币套利（负环检测）

**LLM 连接切入点**
- 让 LLM 解释"Dijkstra 为什么不能处理负权"
- 让 LLM 选择最短路径算法，检查是否考虑负权情况

---

### 7.6 网络流——资源分配的数学

**问题情境**
> 供水系统：从水源到用户，管道有容量限制。最大能输送多少水？

**直观思路**
- 流 = 沿路径输送资源
- 最大流 = 找到最优输送方案
- 增广路径 = 找到还能容纳更多流的路径

**规范定义**
- 流网络定义：有向图，每条边有容量
- 可行流条件：容量约束 + 流量守恒
- 最大流最小割定理：最大流 = 最小割容量

**算法实现**
```python
def ford_fulkerson(G, capacity, s, t):
    """Ford-Fulkerson 方法"""
    def bfs_find_path(residual, s, t):
        """在残量图中找增广路径"""
        parent = {s: None}
        queue = deque([s])
        
        while queue:
            u = queue.popleft()
            for v in residual[u]:
                if v not in parent and residual[u][v] > 0:
                    parent[v] = u
                    if v == t:
                        return parent
                    queue.append(v)
        return None
    
    # 构建残量图
    residual = {u: {v: 0 for v in G} for u in G}
    for u in G:
        for v in G[u]:
            residual[u][v] = capacity[(u, v)]
    
    max_flow = 0
    
    while True:
        parent = bfs_find_path(residual, s, t)
        if not parent:
            break
        
        # 找最小残量
        path_flow = float('inf')
        v = t
        while v != s:
            u = parent[v]
            path_flow = min(path_flow, residual[u][v])
            v = u
        
        # 更新残量
        v = t
        while v != s:
            u = parent[v]
            residual[u][v] -= path_flow
            residual[v][u] += path_flow
            v = u
        
        max_flow += path_flow
    
    return max_flow
```

**正确性分析**
- 最大流最小割定理证明
- Ford-Fulkerson 正确性：基于增广路径
- 终止性：整数容量时终止

**复杂度分析**
- Ford-Fulkerson：O(E * f_max)，f_max 是最大流值
- Edmonds-Karp（BFS 增广）：O(VE²)

**变式练习**
1. 用最大流解决二部匹配问题
2. 设计一个多源多汇的网络流问题
3. 分析 Ford-Fulkerson 在非整数容量时的终止性

**例子递进**
- 最小示例：水源→管道→用户的简单网络
- 反例陷阱：Ford-Fulkerson 选择不当增广路径导致低效
- 变式应用：二部匹配、任务分配
- 真实问题：网络带宽分配、供应链优化

**LLM 连接切入点**
- 让 LLM 解释"最大流最小割定理"
- 让 LLM 用最大流解决二部匹配，检查建模正确性

---

### 7.7 设计图而非算法——建模的艺术

**问题情境**
> Skiena 的忠告："设计图，而非算法"。问题的建模比算法实现更重要。LLM 可以帮你写 BFS，但无法帮你判断"这个问题应该建模为图吗"。

**直观思路**
- 现实问题 → 图建模 → 标准算法自动解决
- 建模是创造性的，执行是机械的

**规范定义**
| 现实问题 | 图建模 | 标准算法 |
|----------|--------|----------|
| 任务调度 | DAG | 拓扑排序 |
| 路径规划 | 加权图 | 最短路径 |
| 资源分配 | 流网络 | 最大流 |
| 社交网络 | 无向图 | 连通分量、最短距离 |

**建模案例**
1. **课程排课** → DAG → 拓扑排序 + SCC 检测循环依赖
2. **地图导航** → 加权有向图 → Dijkstra 或 A*
3. **物流配送** → 多源多汇流网络 → 最大流
4. **社交网络推荐** → 二部图匹配 → 匈牙利算法或最大流

**变式练习**
1. 将"会议排期问题"建模为图问题
2. 将"航班路线优化"建模为图问题
3. 分析 LLM 在图建模上的能力边界

**LLM 连接切入点**
- **核心问题**：LLM 能做算法实现，但建模是人的工作
- 让 LLM 尝试建模一个复杂问题，评价其建模是否正确
- **警示**：建模错误比算法错误更致命

---

## 例子递进设计原则

每个概念遵循以下递进：

```
最小示例（3-5 节点）
    ↓
反例陷阱（为什么不能直接...）
    ↓
变式应用（改变条件后如何适应）
    ↓
真实问题（工业界实际场景）
```

### 设计要点

1. **最小示例**：能手动模拟，核心机制清晰
2. **反例陷阱**：展示朴素方法的失败，引出正确的形式化
3. **变式应用**：改变问题条件，展示算法的适用边界
4. **真实问题**：来自真实场景，建立"学以致用"的感知

---

## 练习分类设计

### 不再使用固定三层，而是多样化练习：

| 类型 | 目的 | 示例 |
|------|------|------|
| **问题情境与直觉** | 建立对问题本质的理解 | "为什么 BFS 找到的是无权最短路径？" |
| **方法应用与实现** | 掌握算法操作 | "实现 Kruskal 算法并分析复杂度" |
| **错误诊断与反例** | 识别常见错误 | "构造 Dijkstra 在负权图上失败的例子" |
| **方案比较与权衡** | 理解算法适用场景 | "对比邻接矩阵和邻接表的时间空间权衡" |
| **变式与边界条件** | 探索算法边界 | "如果边权有负数，Dijkstra 还能用吗？" |
| **开放设计** | 综合应用能力 | "设计一个课程排课系统，支持环检测和拓扑排序" |
| **综合应用** | 多算法联合 | "设计一个物流网络，同时考虑连通性和最大流量" |
| **思考题** | 深层理解 | "为什么 DFS 的时间戳能分类边？" |
| **LLM 协同实验** | 人机协作能力 | "让 LLM 解释 Kosaraju 算法，评价其正确性" |

### 每节练习数量建议

- 问题情境与直觉：2-3 题
- 方法应用与实现：2-3 题
- 错误诊断与反例：1-2 题
- 方案比较与权衡：1-2 题
- 变式与边界条件：2-3 题
- 开放设计：1 题
- 思考题：2-3 题
- LLM 协同实验：2-3 题

---

## LLM 连接切入点设计

### 本章独特的 LLM 时代视角

| 节 | LLM 能做什么 | LLM 不能做什么 | 人的价值 |
|----|-------------|---------------|---------|
| 7.1 图的表示 | 生成邻接表/邻接矩阵代码 | 判断哪种表示更合适 | 空间时间权衡判断 |
| 7.2 BFS/DFS | 实现 BFS/DFS 代码 | 理解"为什么后向边等价于环" | 形式化证明、反例构造 |
| 7.3 拓扑排序/SCC | 实现算法代码 | 判断问题是否适合拓扑排序 | 建模能力 |
| 7.4 MST | 实现 Kruskal/Prim | 判断"安全边"概念 | 正确性论证 |
| 7.5 最短路径 | 实现 Dijkstra | 判断负权情况处理 | 算法选择决策 |
| 7.6 网络流 | 实现最大流算法 | 建模为流网络 | 建模能力 |
| 7.7 设计图 | 辅助实现 | 建模决策 | 核心建模能力 |

### LLM 协同练习示例

1. **让 LLM 解释概念**：观察其解释是否准确、是否抓住核心
2. **让 LLM 选择算法**：检查是否考虑问题约束（如负权）
3. **让 LLM 建模问题**：评价建模是否正确——建模错误比算法错误更致命
4. **让 LLM 实现算法**：检查边界条件处理、复杂度是否符合预期
5. **让 LLM 生成反例**：检查反例是否有效

---

## 与其他章节的联系

### 前置知识
- Ch2 数据结构：数组、链表、栈、队列、堆、并查集
- Ch3 排序与查找：优先队列、有序数据结构
- Ch6 动态规划：Floyd-Warshall、Bellman-Ford 的 DP 视角

### 后续应用
- Ch8 贪心算法：MST 的贪心视角
- Ch9 NP 完备性：图问题的复杂性分类
- Ch11 Transformer：图神经网络视角

---

## 参考文献与资源

### 核心教材
- Cormen T H, et al. Introduction to Algorithms[M]. 4th ed. MIT Press, 2022. Chapters 22-26.
- Skiena S S. The Algorithm Design Manual[M]. 3rd ed. Springer, 2020. Chapter 6.
- Kleinberg J, Tardos E. Algorithm Design[M]. Pearson, 2005. Chapters 3-7.

### 可视化资源
- VisuAlgo: https://visualgo.net/
- Algorithm Visualizer: https://algorithm-visualizer.org/

### 在线课程
- MIT 6.006 Introduction to Algorithms
- Stanford CS161 Design and Analysis of Algorithms

---

## 写作风格检查清单

- [ ] 每节以问题情境开场，而非定义
- [ ] 解释"为什么这样定义"，而非重复定义
- [ ] 展示推理过程，包括错误尝试
- [ ] 类比精确（结构上对应），而非泛泛比喻
- [ ] 反例与边界条件同等重要
- [ ] 符号术语一致
- [ ] 认知负担控制（每节不超过 3 个新概念）
- [ ] 学习闭环：读者读完能回答"解决什么问题？核心方法？为什么正确？代价？何时不适用？"

---

## 下一步行动

1. **Nova**: 查阅 Kleinberg & Tardos 的叙事风格，特别是图算法章节的问题引入方式
2. **Dana**: 按照 structure-design.md 开始撰写各节内容
3. **Felix**: 完成后对照检查清单进行审核

---

_设计完成于 2026-06-20_
