# 9.8 分布式图计算：当邻居不在同一台机器

> **核心问题**：图算法如何在分布式环境下重新设计？

---

## War Story：分布式社交网络分析的教训

某公司需要分析社交网络数据，计算用户影响力（PageRank）。

**LLM给出的方案**：

```
LLM方案：
1. 把图数据存到数据库
2. 用SQL查询每个用户的粉丝
3. 迭代计算PageRank
```

看起来逻辑正确，但实际运行后：

- **第一次迭代**：执行SQL查询每个用户的粉丝 → 2小时
- **跨节点查询**：60%的边跨节点 → 每次查询都是网络请求
- **迭代不收敛**：迭代10轮后放弃 → 每轮都要重新查询
- **最终结果**：项目失败，改用Spark GraphX

**教训**：图算法的分布式设计需要专门的模型，不能简单套用数据库方案。

---

## 问题情境：从单机到分布式的图算法困境

### 单机图算法的简单性

回顾第4章的图算法，它们的实现都很直接：

| 算法 | 单机实现 | 核心数据结构 |
|------|---------|-------------|
| BFS | 队列驱动 | 队列存储待访问节点 |
| Dijkstra | 优先队列 | 优先队列存储(距离, 节点) |
| PageRank | 矩阵迭代 | 邻接矩阵或邻接表 |
| 连通分量 | 标记传播 | 标记数组 |

**共同特点**：所有数据在一台机器的内存中，直接访问邻居信息。

### 分布式环境下的困境

当图数据分布在多台机器时：

```
场景：社交网络图，100万用户，平均每人100朋友

单机方案：
  邻接表存储 → O(V+E) 空间
  PageRank迭代 → 每轮O(V+E) 计算
  简单直接

分布式困境：
  节点A在机器1，节点B在机器2
  A是B的朋友 → 这条边"跨节点"
  计算B的PageRank → 需要A的PR值
  → 机器2需要向机器1请求A的PR值
  
关键问题：
  1. 跨节点边比例 → 决定通信量
  2. 每轮迭代都要通信 → 通信轮数
  3. 如何设计消息传递 → 替代直接访问
```

### 三个核心挑战

**挑战1：邻居不在本地**

单机算法直接访问邻居：`for neighbor in graph[node]`

分布式需要：
1. 判断邻居在哪台机器
2. 发送请求获取邻居信息
3. 等待响应

**挑战2：同步与迭代**

图算法通常是迭代的：
- PageRank：迭代直到收敛
- BFS：按层扩展

每轮迭代都需要跨节点通信 → 通信轮数成为瓶颈。

**挑战3：负载不均**

图数据天然不均匀：
- 某名人有百万粉丝 → 该节点处理慢
- 某社区连接紧密 → 该分区负载高

---

## 直觉建立：从直接访问到消息传递

### 类比：信息传递的社交网络

想象你要在一个大型公司传播消息：

**方案1（单机思维）**：
- 把所有员工叫到一个大厅
- 每人告诉朋友消息
- 问题：人太多，大厅装不下

**方案2（分布式）**：
- 员工分布在不同办公楼
- 每人收到消息后：
  1. 处理消息（更新自己的状态）
  2. 发送消息给朋友（可能跨楼）
  3. 等待所有消息送达
  4. 进入下一轮
- 问题：跨楼消息需要传递时间

**核心变化**：
- 单机：直接访问邻居数据
- 分布式：通过消息传递获取邻居数据

---

## Pregel BSP模型

### 什么是BSP？

**BSP（Bulk Synchronous Parallel）**：整体同步并行模型。

核心思想：
1. 计算分为多个**超步（Superstep）**
2. 每个超步内：并行计算 + 消息传递
3. 超步结束：**全局同步Barrier**
4. 所有节点完成当前超步后，进入下一个超步

```
Superstep 0: 初始化
  ├── 每个节点设置初始状态
  ├── 发送消息给邻居
  └── Barrier同步

Superstep 1: 第一次迭代
  ├── 接收消息（来自上一超步）
  ├── 处理消息，更新状态
  ├── 发送新消息给邻居
  └── Barrier同步

Superstep 2: 第二次迭代
  ├── 接收消息
  ├── 处理消息，更新状态
  ├── 发送新消息
  └── Barrier同步

... 直到收敛
```

### Pregel模型详解

Google的Pregel框架实现了BSP模型用于图计算。

**核心概念**：

| 概念 | 说明 |
|------|------|
| **Vertex** | 图中的节点，存储状态 |
| **Edge** | 图中的边，连接节点 |
| **Message** | 节点间传递的信息 |
| **Superstep** | 一轮计算周期 |
| **Vote to Halt** | 节点声明不再活跃 |

**每个超步的处理逻辑**：

```python
def superstep(vertex, messages):
    """
    每个超步的处理函数
    
    参数：
    - vertex: 当前节点（包含状态）
    - messages: 从邻居收到的消息列表
    
    操作：
    1. 处理消息，更新节点状态
    2. 发送消息给邻居
    3. 可选：Vote to Halt
    """
    # 1. 处理消息
    for msg in messages:
        vertex.state = process(vertex.state, msg)
    
    # 2. 发送消息给邻居
    for neighbor in vertex.neighbors:
        send(neighbor, create_message(vertex.state))
    
    # 3. 如果收敛，可以停止
    if converged(vertex):
        vertex.vote_to_halt()
```

**关键约束**：
- 消息只能在下一个超步被接收
- 超步内不能看到其他节点的当前状态
- 只能通过消息传递共享信息

---

## 分布式PageRank

### 单机PageRank回顾

```python
def pagerank_single_machine(graph, iterations=100, damping=0.85):
    """
    单机PageRank实现
    """
    n = len(graph)
    pr = {node: 1/n for node in graph}  # 初始PR值
    
    for _ in range(iterations):
        new_pr = {}
        for node in graph:
            # PR = 随机跳转 + 从入边收集
            incoming = sum(pr[neighbor] / len(graph[neighbor]) 
                          for neighbor in get_incoming(graph, node))
            new_pr[node] = (1 - damping) / n + damping * incoming
        pr = new_pr
    
    return pr
```

**关键操作**：直接访问邻居的PR值 → `pr[neighbor]`

### 分布式PageRank设计

**问题**：`pr[neighbor]` 可能在另一台机器上。

**解决方案**：消息传递。

```
Superstep 0: 初始化
  每个节点设置 PR = 1/N
  发送 PR/出度 给所有出边邻居

Superstep 1-N: 迭代
  1. 接收消息（来自入边邻居的PR值）
  2. 计算新PR = (1-d)/N + d * sum(收到的PR值)
  3. 发送 新PR/出度 给所有出边邻居
  4. 如果变化 < 阈值，Vote to Halt

收敛条件：
  所有节点Vote to Halt，或达到最大迭代次数
```

**伪代码实现**：

```python
class PageRankVertex:
    def __init__(self, node_id, neighbors, initial_pr):
        self.id = node_id
        self.neighbors = neighbors  # 出边邻居列表
        self.pr = initial_pr
        self.out_degree = len(neighbors)
    
    def superstep(self, messages, superstep_num):
        """
        每个超步的处理
        """
        if superstep_num == 0:
            # 初始化：发送PR给邻居
            self.send_to_neighbors(self.pr / self.out_degree)
        else:
            # 收集来自入边的PR贡献
            incoming_sum = sum(msg.value for msg in messages)
            new_pr = 0.15 / N + 0.85 * incoming_sum
            
            # 检查收敛
            if abs(new_pr - self.pr) < THRESHOLD:
                self.vote_to_halt()
            else:
                self.pr = new_pr
                self.send_to_neighbors(self.pr / self.out_degree)
    
    def send_to_neighbors(self, value):
        """
        发送消息给所有出边邻居
        """
        for neighbor in self.neighbors:
            send_message(neighbor, value)
```

### 通信成本分析

**每超步通信量**：

```
通信量 = 边数 × 每条消息大小

对于100万节点、平均100朋友的社交网络：
- 边数 = 100万 × 100 = 1亿条边
- 如果60%边跨节点
- 每条消息约16字节（节点ID + PR值）
- 每超步通信量 ≈ 1亿 × 60% × 16字节 ≈ 960MB
```

**总通信成本**：

```
总通信 = 每超步通信 × 超步数

PageRank通常需要10-50轮迭代收敛
总通信 ≈ 9.6GB ~ 48GB
```

**对比单机**：

| 方案 | 数据传输 | 迭代速度 | 容错能力 |
|------|---------|---------|---------|
| 单机 | 0（内存访问） | 快 | 差（失败重来） |
| 分布式 | 大（网络传输） | 慢 | 好（可恢复） |

**结论**：分布式图计算适合**图太大内存装不下**的场景，而非小图加速。

---

## 图分片策略

### 分片对通信的影响

图分片方式直接影响跨节点边比例。

**边跨节点意味着**：
- 每轮迭代需要网络通信
- 通信成本 = 跨节点边数 × 消息大小

**目标**：最小化跨节点边。

### 三种分片策略

#### 策略1：哈希分片

```
节点分配：node_id % num_machines
```

**优点**：
- 简单均匀
- 负载均衡好
- 动态扩缩容容易

**缺点**：
- 跨节点边比例高（约50%）
- 局部性差

```
示例：
100万节点，10台机器
节点0, 10, 20, ... 在机器0
节点1, 11, 21, ... 在机器1

边(0, 1)：跨节点（机器0 → 机器1）
边(0, 10)：同节点（都在机器0）

假设边随机分布，跨节点概率 ≈ 90%（10台机器，9/10边跨节点）
```

#### 策略2：METIS图划分

**核心思想**：最小化跨分区边。

```
METIS算法：
1. 图粗化：合并节点，简化图
2. 初始划分：在简化图上二分
3. 图细化：还原节点，优化边界

目标：最小化跨分区边数
```

**优点**：
- 跨节点边比例低（可达10-20%）
- 局部性好

**缺点**：
- 预计算成本高
- 负载可能不均
- 动态扩缩容困难

```
示例：
社交网络图，按社区划分
同社区节点在同一机器
跨社区边少 → 通信少
```

#### 策略3：边切割 vs 点切割

**边切割（Edge Cut）**：
- 节点完整属于一个分区
- 边可能跨分区

```
分区A：节点 {1, 2, 3}，边 {(1,2), (2,3)}
分区B：节点 {4, 5}，边 {(4,5)}
跨分区边：{(3,4)}  ← 边被"切割"
```

**点切割（Vertex Cut）**：
- 边完整属于一个分区
- 节点可能存在于多个分区

```
分区A：边 {(1,2), (2,3), (3,4)}
分区B：边 {(4,5), (5,6)}
节点3同时存在于分区A和B  ← 点被"切割"
```

**对比**：

| 策略 | 适用场景 | 存储 | 通信 |
|------|---------|------|------|
| 边切割 | 节点度均匀 | 每节点存一份 | 边跨分区时通信 |
| 点切割 | 节点度不均（如社交网络） | 高度节点存多份 | 节点跨分区时通信 |

**社交网络选择**：
- 存在高度节点（名人）
- 点切割更好：高度节点分散存储，避免热点

---

## 其他分布式图算法

### 分布式BFS

**单机BFS**：队列驱动，按层扩展。

**分布式BFS**：消息传递替代队列。

```python
class BFSVertex:
    def __init__(self, node_id, neighbors):
        self.id = node_id
        self.neighbors = neighbors
        self.distance = -1  # -1表示未访问
    
    def superstep(self, messages, superstep_num):
        if superstep_num == 0:
            # 源节点
            if self.id == SOURCE:
                self.distance = 0
                self.send_to_neighbors(0)  # 发送距离0
        else:
            # 收到消息，更新距离
            if messages and self.distance == -1:
                self.distance = min(msg.value for msg in messages) + 1
                self.send_to_neighbors(self.distance)
                self.vote_to_halt()  # BFS每个节点只处理一次
```

**超步数 = BFS层数**（最远节点的距离）。

### 分布式连通分量

**Label Propagation算法**：

```
初始化：每个节点的标签 = 自己的ID
迭代：
  1. 收集邻居的标签
  2. 更新自己的标签 = min(邻居标签)
  3. 发送新标签给邻居
收敛：标签不再变化
```

每个节点最终标签 = 它所在连通分量的最小节点ID。

---

## LLM视角：分布式图计算审查

### LLM容易犯的错误

```
LLM方案："计算社交网络的影响力"
方案：
  1. 存储图到数据库
  2. 用SQL查询邻居
  3. 迭代计算

审查发现：
  ├── 功能正确：能计算出结果
  └── 系统不可用：
      1. 每次查询都是网络请求 → 延迟巨大
      2. 迭代需要多次查询 → 查询量爆炸
      3. 数据库不是图计算引擎 → 效率极低
```

### 审查要点

审查LLM给出的分布式图方案时，检查：

**1. 分片策略**：
- 图如何分片？
- 跨节点边比例是多少？
- 是否存在热点节点？

**2. 消息传递设计**：
- 超步内做什么？
- 发送什么消息？
- 消息大小是多少？

**3. 通信成本**：
- 每超步通信量？
- 预计超步数？
- 总通信成本？

**4. 收敛条件**：
- 算法何时终止？
- 是否保证收敛？

### 正确的审查流程

```
审查流程：
1. 确认图规模：节点数、边数、平均度
2. 分析分片策略：跨节点边比例、热点风险
3. 设计消息传递：消息内容、超步逻辑
4. 计算通信成本：每超步通信、超步数
5. 设计收敛条件：何时终止
6. 评估容错机制：节点失败如何处理
```

---

## 实战案例：分布式社交网络分析

回到开场的War Story，正确方案：

**方案：使用Pregel模型**

```python
# 1. 图分片策略
# 使用点切割，避免高度节点热点

# 2. PageRank实现
class SocialPageRankVertex:
    def superstep(self, messages, superstep_num):
        if superstep_num == 0:
            # 初始化
            self.pr = 1.0 / TOTAL_USERS
            self.send_pr_to_neighbors()
        else:
            # 计算新PR
            incoming = sum(msg.value for msg in messages)
            new_pr = 0.15 / TOTAL_USERS + 0.85 * incoming
            
            # 发送给邻居
            if abs(new_pr - self.pr) > THRESHOLD:
                self.pr = new_pr
                self.send_pr_to_neighbors()
            else:
                self.vote_to_halt()
    
    def send_pr_to_neighbors(self):
        contribution = self.pr / self.out_degree
        for neighbor in self.neighbors:
            send_message(neighbor, contribution)
```

**效果**：
- 分片：点切割，高度节点分散存储
- 通信：跨节点边比例20%（vs 哈希分片的50%）
- 迭代：约20轮收敛
- 容错：节点失败只重跑该节点

**对比原方案**：

| 方案 | 首次迭代 | 收敛迭代数 | 容错 |
|------|---------|-----------|------|
| 数据库SQL | 2小时 | 不收敛 | 无 |
| Pregel模型 | 10秒 | 20轮 | 有 |

---

## 小结

### 分布式图计算核心思想

| 概念 | 单机 | 分布式 |
|------|------|--------|
| **访问邻居** | 直接访问 | 消息传递 |
| **迭代控制** | 循环 | 超步+Barrier |
| **同步方式** | 隐式 | 显式全局同步 |
| **容错** | 重跑全部 | 重跑失败节点 |

### Pregel模型要点

| 要点 | 说明 |
|------|------|
| **超步** | 一轮计算周期 |
| **消息传递** | 节点间通信的唯一方式 |
| **Vote to Halt** | 节点声明不再活跃 |
| **Barrier同步** | 超步结束时的全局同步 |

### 图分片策略对比

| 策略 | 跨节点边比例 | 负载均衡 | 适用场景 |
|------|------------|---------|---------|
| 哈希分片 | 高（~50%） | 好 | 通用、简单 |
| METIS划分 | 低（10-20%） | 可能不均 | 静态图 |
| 点切割 | - | 好 | 高度节点多 |

### LLM审查要点

- 图分片策略是否合理？
- 消息传递设计是否清晰？
- 通信成本是否可接受？
- 收敛条件是否明确？
- 是否有容错机制？

---

## 练习

### 1. 设计分布式BFS方案

**场景**：社交网络图，100万用户，找出用户A到用户B的最短路径。

**要求**：
1. 设计分布式BFS算法（超步逻辑、消息内容）
2. 分析每超步通信量
3. 分析最坏情况下超步数
4. 与单机BFS对比

### 2. 分析图分片策略

**场景**：社交网络图，某名人有100万粉丝。

**要求**：
1. 用哈希分片，分析该名人的边分布
2. 分析该名人的处理是否成为瓶颈
3. 设计点切割方案，解决热点问题
4. 比较两种策略的存储和通信成本

---

## 下一节

理解了分布式图计算后，让我们通过综合练习巩固本章知识：

[9.9 综合练习](09-exercises.md)
