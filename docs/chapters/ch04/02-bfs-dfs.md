# 4.2 BFS 与 DFS

> "遍历是所有图算法的基础。"
> — CLRS

---

## 学习目标

- 掌握 BFS 和 DFS 的实现与应用
- 理解 DFS 边分类及其理论意义
- 掌握白色路径定理
- 判断 BFS 和 DFS 的适用场景

---

## BFS：广度优先搜索

### 核心思想

从起点出发，**逐层**向外扩展。使用队列（FIFO）保证先进先出。

### 算法框架

```python
from collections import deque

def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    distance = {start: 0}
    parent = {start: None}
    
    while queue:
        u = queue.popleft()
        for v in graph.neighbors(u):
            if v not in visited:
                visited.add(v)
                queue.append(v)
                distance[v] = distance[u] + 1
                parent[v] = u
    
    return distance, parent
```

### 时间复杂度

- **O(V + E)**：每个顶点入队一次，每条边检查一次

### 应用

| 应用 | 说明 |
|------|------|
| 无权最短路径 | BFS 保证找到最短路径 |
| 连通分量 | 从未访问顶点启动 BFS |
| 二着色 | 判断是否为二部图 |
| 层次遍历 | 生成 BFS 树 |

### BFS 树性质

- BFS 树的深度 = 无权最短路径长度
- BFS 树的层数从 0 开始
- 同层顶点距离起点相同

---

## DFS：深度优先搜索

### 核心思想

从起点出发，**尽可能深入**，遇到死胡同就回溯。使用栈（递归或显式）保证后进先出。

### 算法框架

```python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    print(start)  # 处理顶点
    for v in graph.neighbors(start):
        if v not in visited:
            dfs(graph, v, visited)
    return visited
```

### 带时间戳的 DFS

```python
time = 0

def dfs_visit(graph, u, color, d, f, parent):
    global time
    time += 1
    d[u] = time      # 发现时间
    color[u] = 'GRAY'
    
    for v in graph.neighbors(u):
        if color[v] == 'WHITE':
            parent[v] = u
            dfs_visit(graph, v, color, d, f, parent)
    
    color[u] = 'BLACK'
    time += 1
    f[u] = time      # 完成时间
```

### 时间复杂度

- **O(V + E)**：每个顶点访问一次，每条边检查一次

### 应用

| 应用 | 说明 |
|------|------|
| 环检测 | 后向边表示有环 |
| 拓扑排序 | 逆后序排列 |
| 强连通分量 | Kosaraju 算法 |
| 关节点 | Tarjan 算法 |

---

## DFS 边分类

CLRS 的独有贡献：基于发现时间（d）和完成时间（f）对边进行分类。

### 四种边类型

| 边类型 | 定义 | 含义 |
|--------|------|------|
| 树边 | v 是 u 的 DFS 树子节点 | 正常的 DFS 遍历 |
| 后向边 | u → v，v 是 u 的祖先 | **有环** |
| 前向边 | u → v，v 是 u 的后代（非树边） | 跳过某些节点 |
| 交叉边 | u → v，v 既非祖先也非后代 | 连接不同分支 |

### 判定规则

设 u → v 是一条边：

```
如果 v 是 WHITE（未发现）：
    u → v 是树边

如果 v 是 GRAY（已发现，未完成）：
    u → v 是后向边
    → 发现环！

如果 v 是 BLACK（已完成）：
    如果 d[u] < d[v]：前向边
    如果 d[u] > d[v]：交叉边
```

### 关键定理

**定理**：DFS 发现后向边当且仅当图有环。

**证明**：
- （→）后向边 u → v 意味着 v 是 u 的祖先，DFS 树中存在 v → ... → u 的路径，加上 u → v 形成环。
- （←）如果有环，DFS 会沿环遍历，最后一条边指向灰色顶点，形成后向边。

---

## 白色路径定理

### 定理内容

**白色路径定理**：顶点 v 是顶点 u 的后代，当且仅当在发现 u 时，存在一条从 u 到 v 的全由白色顶点组成的路径。

### 含义

- 白色 = 未发现
- 白色路径 = 完全未被探索的路径
- v 是 u 的后代 ⟺ 发现 u 时，u 到 v 有白色路径

### 应用

用于证明 DFS 树的性质，如：
- 括号定理（区间嵌套）
- 后代区间定理（后代的时间区间嵌套在祖先的时间区间内）

---

## BFS vs DFS

| 维度 | BFS | DFS |
|------|-----|-----|
| 数据结构 | 队列（FIFO） | 栈（LIFO） |
| 空间复杂度 | O(V) | O(V) |
| 时间复杂度 | O(V + E) | O(V + E) |
| 最短路径 | 无权最短 | 不保证 |
| 回溯检测 | 否 | 是（后向边） |
| 适用场景 | 层次遍历、最短路 | 环检测、拓扑排序 |

---

## LLM 融合点

### 任务 1：让 LLM 实现环检测

```
要求：用 DFS 实现环检测

输入：邻接表表示的图
输出：是否有环

要求：
1. 使用颜色标记（WHITE/GRAY/BLACK）
2. 检测后向边
3. Python 实现
```

**判断 LLM 是否正确**：
- 是否使用三色标记？
- 是否正确判断后向边？
- 边界情况（空图、单顶点）是否处理？

### 任务 2：让 LLM 解释边分类

```
给定图的 DFS 时间戳：
顶点:  1   2   3   4   5
d[]:   1   2   3   6   4
f[]:   8   7   6   7   5

边：
1 → 2, 1 → 4, 2 → 3, 2 → 5, 3 → 1, 4 → 4

问题：对每条边，判断是树边、后向边、前向边还是交叉边。
```

---

## 小结

**BFS 核心点**：
- 逐层扩展，队列保证先进先出
- 无权最短路径
- 二着色检测

**DFS 核心点**：
- 尽可能深入，栈保证后进先出
- 边分类：树边、后向边、前向边、交叉边
- 后向边 ⟺ 有环
- 白色路径定理

**选择指南**：
- 需要最短路径 → BFS
- 需要环检测、拓扑排序 → DFS
- 需要遍历所有顶点 → 两者皆可

---

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapter 22
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapter 5