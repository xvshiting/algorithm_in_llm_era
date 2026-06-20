# 4.4 最小生成树

> "切割性质是 MST 算法的理论基石。"
> — CLRS

---

## 学习目标

- 掌握 Kruskal 和 Prim 算法
- 理解切割性质及其证明
- 掌握并查集的实现与复杂度分析
- 判断 Kruskal 和 Prim 的适用场景

---

## MST 定义

### 问题

给定连通无向图 G = (V, E) 和边权重函数 w，找到一棵生成树 T，使得 T 的总权重最小。

### 性质

- MST 包含 V-1 条边
- MST 连接所有顶点
- MST 不包含环

---

## 切割性质

### 定理

设 (A, B) 是图的任意切割（将顶点分为两个集合）。设 e 是跨越切割的**轻量级边**（权重最小）。则 e 必在某棵 MST 中。

### 证明思路

```
假设 e 不在任何 MST 中。
取某棵 MST T，T 必有边 f 跨越切割（否则不连通）。
用 e 替换 f，得到树 T'。
w(e) ≤ w(f)，所以 w(T') ≤ w(T)。
T' 也是 MST，e 在 T' 中。
矛盾。
```

### 意义

切割性质是 Kruskal 和 Prim 的理论基础：
- **Kruskal**：每次选最小边，只要不形成环（边跨越"已选顶点"和"未选顶点"的切割）
- **Prim**：每次选连接已选集合和未选集合的最小边

---

## Kruskal 算法

### 核心思想

贪心选择最小边，只要不形成环。

### 算法步骤

```
1. 按权重排序所有边
2. 初始化空集合 T
3. 对每条边 e（按权重从小到大）：
   如果 e 的两端不在同一连通分量（不形成环）：
       将 e 加入 T
4. T 最终是 MST
```

### 关键：并查集

判断两个顶点是否在同一连通分量，需要高效的连通性维护。**并查集（Union-Find）** 是最优解。

### 并查集实现

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    
    def find(self, x):
        # 路径压缩
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False  # 已连通
        # 按秩合并
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True  # 合并成功
```

### Kruskal 实现

```python
def kruskal(edges, n):
    edges.sort(key=lambda e: e[2])  # 按权重排序
    uf = UnionFind(n)
    mst = []
    
    for u, v, w in edges:
        if uf.union(u, v):  # 不连通，可加入
            mst.append((u, v, w))
            if len(mst) == n - 1:
                break
    
    return mst
```

### 时间复杂度

- 排序：O(E log E)
- 并查集：O(E α(V))，其中 α 是反 Ackermann 函数，α ≤ 4 对所有实际 V
- 总：O(E log E) 或 O(E log V)

---

## Prim 算法

### 核心思想

从一个顶点开始，每次选择连接已选集合和未选集合的最小边。

### 算法步骤

```
1. 选一个起始顶点 s
2. 初始化已选集合 S = {s}
3. 维护优先队列 Q，存储候选边（连接 S 和 V-S）
4. 从 Q 中取出最小边 e = (u, v)，v 不在 S
5. 将 v 加入 S，更新 Q（添加 v 的邻居边）
6. 重复 4-5 直到 S = V
```

### Prim 实现

```python
import heapq

def prim(graph, n, start=0):
    mst = []
    visited = [False] * n
    pq = [(0, start, -1)]  # (weight, vertex, parent)
    
    while pq:
        w, u, parent = heapq.heappop(pq)
        if visited[u]:
            continue
        visited[u] = True
        if parent != -1:
            mst.append((parent, u, w))
        for v, weight in graph.neighbors(u):
            if not visited[v]:
                heapq.heappush(pq, (weight, v, u))
    
    return mst
```

### 时间复杂度

- 优先队列操作：O(E log V)
- 总：O(E log V)

---

## Kruskal vs Prim

| 维度 | Kruskal | Prim |
|------|---------|------|
| 适用图 | 稀疏图 | 稠密图 |
| 数据结构 | 并查集 | 优先队列 |
| 时间复杂度 | O(E log E) | O(E log V) |
| 边排序 | 需要 | 不需要 |
| 实现 | 边列表 | 邻接表 |

**选择指南**：
- E << V² → Kruskal
- E ≈ V² → Prim（或邻接矩阵版 Prim，O(V²)）

---

## 并查集复杂度分析

### 关键定理

并查集（按秩合并 + 路径压缩）的时间复杂度为 **O(m α(n))**。

### α(n) 是什么？

α(n) 是反 Ackermann 函数，定义为：

```
A(k, j) 是 Ackermann 函数
α(n) = min{k : A(k, k) ≥ n}
```

对于所有实际 n（n ≤ 2^65536），α(n) ≤ 4。

### 意义

α(n) 是宇宙中最慢增长的非恒定函数。这意味着并查集几乎可以认为是 O(m)。

---

## LLM 融合点

### 任务：实现并查集

```
要求：
1. 实现 UnionFind 类
2. 支持 find、union 操作
3. 使用路径压缩和按秩合并
4. 测试代码

测试：
- 1000 个顶点
- 10000 次 union 和 find 操作
- 计算总时间
```

**判断 LLM 是否正确**：
- 是否实现路径压缩？
- 是否实现按秩合并？
- 是否理解 α(n) ≤ 4？

---

## 小结

**切割性质**：轻量级边过切割必在某棵 MST 中。

**Kruskal**：
- 贪心 + 并查集
- O(E log E)
- 适用稀疏图

**Prim**：
- 贪心 + 优先队列
- O(E log V)
- 适用稠密图

**并查集**：
- 按秩合并 + 路径压缩
- O(m α(n))
- α(n) ≤ 4

---

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapter 23
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapter 6