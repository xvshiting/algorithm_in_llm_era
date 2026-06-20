# 9.2 MapReduce：用受限模型换取规模

> **核心问题**：为什么MapReduce模型受限，却能处理海量数据？

---

## War Story：日志分析系统的教训

某公司需要分析1TB日志数据，统计每小时的错误类型分布。

LLM给出的方案：

```
LLM方案：
1. 把所有日志传到中心服务器
2. 在中心服务器排序
3. 统计每小时错误数
```

看起来逻辑正确，但实际运行后：

- **传输耗时**：1TB数据传输，网络带宽100Mbps → 约3小时
- **内存溢出**：排序需要2TB内存 → swap导致卡死
- **单点故障**：中心服务器崩溃 → 全部重来

系统上线第一天就崩溃了。

**教训**：功能正确的方案，分布式环境下可能完全不可用。

---

## MapReduce的思想

### 核心洞察

**MapReduce牺牲了一部分表达能力，换来了清晰的数据流和容错边界。**

牺牲了什么？
- 不能做复杂的跨数据依赖
- 必须遵循Map→Shuffle→Reduce的固定流程
- 不能在Reduce中引用Map的中间状态

换取了什么？
- **规模**：可以处理任意规模数据
- **容错**：节点失败只重跑该节点
- **简单性**：开发者只需写Map和Reduce函数

### 类比：分工协作

想象你要整理一座图书馆：

**方案1（单机思路）**：
- 把所有书搬到一处
- 分类、编号、上架
- 问题：搬运耗时巨大

**方案2（MapReduce）**：
- 每人负责一个区域（Map）
- 每人分类自己的书，按类别打包
- 按类别分配给专人上架（Reduce）
- 问题：某人请假 → 只需找人替他处理该区域

---

## MapReduce模型

### 三个阶段

```
输入 → Map → Shuffle → Reduce → 输出
```

**Map阶段**：
- 输入：原始数据（分片到各节点）
- 输出：键值对列表
- 特点：本地处理，不跨节点

**Shuffle阶段**：
- 输入：所有节点的Map输出
- 输出：按键分组，每个键一组值
- 特点：跨节点传输，是通信瓶颈

**Reduce阶段**：
- 输入：一个键和它的所有值
- 输出：聚合结果
- 特点：每个键一个Reduce任务

### 词频统计实现

```python
# Map函数：每台机器处理本地文章
def mapper(article):
    """输入：一篇文章，输出：(word, 1) 列表"""
    output = []
    for word in article.split():
        output.append((word, 1))
    return output

# Shuffle阶段：按word分组（框架自动完成）
# 输入：所有节点的 (word, 1)
# 输出：{'error': [1, 1, 1, 1, ...], 'success': [1, 1, ...], ...}

# Reduce函数：汇总每个word的计数
def reducer(word, counts):
    """输入：一个word和它的所有count，输出：总数"""
    return (word, sum(counts))
```

### 数据流图

```
文章分片 → [节点1] → Map → (word, 1)列表
          [节点2] → Map → (word, 1)列表
          [节点3] → Map → (word, 1)列表
                    ↓ Shuffle（按word分组）
          [节点4] ← Reduce ← word='error', counts=[1,1,1,...]
          [节点5] ← Reduce ← word='success', counts=[1,1,...]
          [节点6] ← Reduce ← word='warning', counts=[1,...]
                    ↓
          输出：{('error', 100), ('success', 50), ('warning', 10)}
```

---

## Shuffle成本分析

Shuffle是MapReduce的通信瓶颈，需要重点分析。

### Shuffle传输量

**公式**：
```
Shuffle传输量 = Map输出总量
```

对于词频统计：
- Map输出 = 每篇文章的词数 × 1条记录
- 如果100万篇文章，每篇平均1000词 → 10亿条(word, 1)记录
- 每条记录约20字节 → **Shuffle传输约20GB**

### 优化：Combiner

**Combiner**：在Map节点本地预聚合。

```python
# Combiner函数：Map节点本地聚合
def combiner(word, counts):
    """在Map节点本地，对同一word的counts预聚合"""
    return (word, sum(counts))

# 效果：
# Map输出：(error, 1), (error, 1), (error, 1), ...
# Combiner后：(error, 3)  ← 只发一条
# Shuffle传输量减少99%
```

**教训**：Combiner能大幅减少Shuffle成本，设计MapReduce时必用。

---

## 键设计的重要性

键（Key）的设计决定Shuffle分组方式，影响性能和结果。

### 错误的键设计

**案例**：统计每小时错误数

```python
# 错误设计1：键为'error'
def mapper(log_line):
    if 'error' in log_line:
        hour = parse_hour(log_line)
        return ('error', hour)  # 键是'error'
# 结果：所有error都发到同一个Reduce → Reduce端瓶颈

# 错误设计2：键为小时
def mapper(log_line):
    if 'error' in log_line:
        hour = parse_hour(log_line)
        return (hour, 1)  # 键是hour
# 结果：每小时数据发到一个Reduce，但同一小时的不同类型混在一起
```

### 正确的键设计

```python
# 正确设计：键为(hour, error_type)
def mapper(log_line):
    hour = parse_hour(log_line)
    error_type = parse_error_type(log_line)
    return ((hour, error_type), 1)

def reducer(key, counts):
    hour, error_type = key
    return (hour, error_type, sum(counts))
```

**原则**：键要精确到需要聚合的维度，但避免过度细分导致Reduce数过多。

---

## 数据倾斜问题

### 问题定义

**数据倾斜**：某些键的数据量远大于其他键，导致Reduce端负载不均。

### 案例：社交网络分析

```python
# 分析用户粉丝数
def mapper(user_followers):
    user, followers = user_followers
    return (user, len(followers))

# 问题：某名人有百万粉丝
# → 该user的Reduce任务要处理百万数据
# → Reduce端瓶颈
```

### 解决方案

**方案1：盐化键（Salting）**

```python
# 给热点键加随机前缀，分散到多个Reduce
def mapper(user_followers):
    user, followers = user_followers
    if len(followers) > THRESHOLD:  # 热点用户
        salt = random.randint(0, 9)
        return ((user, salt), len(followers))
    else:
        return (user, len(followers))

# Reduce阶段先聚合salted键，再二次聚合
```

**方案2：两阶段聚合**

```python
# 第一阶段：本地聚合
def mapper1(user_followers):
    # 每台机器本地统计
    return (user, local_count)

# 第二阶段：全局聚合
def reducer2(user, local_counts):
    return (user, sum(local_counts))
```

---

## 容错机制

MapReduce的核心优势之一是容错。

### 节点失败处理

```
节点失败场景：
- 节点1正在Map → 网络故障

处理：
1. 检测失败（心跳超时）
2. 标记节点1的任务为待重跑
3. 分配给其他节点重跑
4. 只重跑节点1的任务，不影响其他节点
```

### 为什么容错简单？

**原因**：Map和Reduce函数是无状态的。

- Map：输入→输出，不依赖其他节点
- Reduce：输入→输出，不依赖其他Reduce
- 失败重跑只需重新处理输入

### 对比：有状态算法的容错

如果算法有跨节点依赖：
```
节点1失败 → 它的输出被其他节点依赖
→ 其他节点也要重跑
→ 级联失败
```

**教训**：无状态设计简化容错，但限制表达能力。

---

## MapReduce的局限

### 层级限制

MapReduce是两阶段模型：
```
Map → Shuffle → Reduce
```

如果需要多轮迭代：
```
Map → Shuffle → Reduce → Map → Shuffle → Reduce → ...
```

每次迭代都要重新Shuffle → 通信成本巨大。

**例子**：PageRank
- 需要多轮迭代（直到收敛）
- 每轮都要Shuffle → 效率低
- 解决：用Pregel（专为图设计的框架）

### 数据依赖限制

MapReduce不能处理跨数据的复杂依赖。

**例子**：图算法
- BFS需要邻居信息
- MapReduce每轮只能处理一"层"
- 效率低

### 实时性限制

MapReduce是批处理模型：
- 数据必须完整才能处理
- 不适合实时流数据

**解决**：流处理框架（如Flink、Spark Streaming）

---

## LLM视角：审查MapReduce方案

### LLM容易犯的错误

```
LLM方案："分析日志，统计错误"
方案：把日志拉到中心，用Python遍历

审查发现：
- 功能正确：能统计
- 系统不可用：传输瓶颈、内存溢出、无容错
```

### 审查要点

审查LLM给出的MapReduce方案时，检查：

1. **键设计**：键是否精确到聚合维度？是否会导致倾斜？
2. **Shuffle成本**：Map输出量是多少？是否需要Combiner？
3. **热点识别**：是否有某些键数据量过大？
4. **容错设计**：是否有重试机制？

### 正确的审查流程

```
审查流程：
1. 确认业务需求：要统计什么？聚合维度是什么？
2. 设计键：键 = 聚合维度
3. 分析Shuffle：Map输出量，是否需要Combiner
4. 分析倾斜：是否有热点键，设计分散策略
5. 设计容错：失败重跑机制
```

---

## 实战案例：日志分析

回到开场的War Story，正确方案：

```python
# Map函数：每台机器处理本地日志
def mapper(log_line):
    hour = parse_hour(log_line)
    error_type = parse_error_type(log_line)
    return ((hour, error_type), 1)

# Combiner：本地预聚合
def combiner(key, counts):
    return (key, sum(counts))

# Shuffle：按(hour, error_type)分组
# 传输量：从20GB减少到200KB（假设1000种(hour, error_type)组合）

# Reduce函数：汇总
def reducer(key, counts):
    hour, error_type = key
    return (hour, error_type, sum(counts))
```

**效果**：
- 传输量：200KB vs 1TB（减少99.9998%）
- 内存：Reduce只需处理小聚合结果
- 容错：节点失败只重跑该节点

---

## 小结

### MapReduce核心思想

| 概念 | 说明 |
|------|------|
| **受限模型** | 只支持Map→Shuffle→Reduce |
| **换取规模** | 可处理任意规模数据 |
| **换取容错** | 无状态设计，失败只重跑该节点 |

### 设计要点

| 要点 | 说明 |
|------|------|
| **键设计** | 精确到聚合维度，避免过度细分 |
| **Combiner** | 本地预聚合，减少Shuffle成本 |
| **数据倾斜** | 盐化键、两阶段聚合 |
| **容错** | 无状态设计，自动重跑 |

### LLM审查要点

- 是否有中心瓶颈？
- 键设计是否合理？
- Shuffle成本是多少？
- 是否有倾斜风险？
- 是否有容错机制？

---

## 练习

### 1. 设计MapReduce方案

场景：分析社交网络，统计每个用户的朋友数。

设计Map、Shuffle、Reduce，并分析Shuffle成本。

### 2. 分析数据倾斜

场景：某名人有百万粉丝，分析粉丝关注的其他用户。

分析是否有数据倾斜，设计解决方案。

### 3. 审查LLM方案

让LLM设计"分布式日志排序"方案，审查其通信成本和中心瓶颈。

---

## 下一节

理解了MapReduce后，我们来看分布式共识问题：

[9.3 共识与一致性](03-consensus.md)
