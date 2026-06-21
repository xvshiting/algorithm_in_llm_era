# 10.2 滑动窗口：有限窗口内的无限数据

> **核心问题**：内存有限时，如何处理无限流动的数据？

---

## 开场问题：实时流量监控

想象你在运维一个大型网络，需要实时监控流量异常：

```python
def detect_anomaly(packets):
    """检测流量异常 - 比较当前与历史均值"""
    mean = sum(packets) / len(packets)
    current = packets[-1]
    if current > 2 * mean:
        return "异常峰值！"
```

看起来很简单，但问题是：**网络流量永不停止，你需要检测过去5分钟的异常**。

### 静态方案的问题

```python
# 方案1：存储所有流量包
history = []
for packet in stream:
    history.append(packet)  # 流量永不停止 → 存储爆炸
    
# 方案2：定期截断
for packet in stream:
    history.append(packet)
    if len(history) > 300:  # 过去5分钟
        history.pop(0)      # 移除最旧的
```

**问题分析**：
- 存储300个数据包还好
- 但如果每秒1000个包 → 5分钟300000个包 → 存储巨大
- 每次检测异常都要重新计算均值 → O(n) 查询效率低

**困惑**：如何在不存储所有数据的情况下，维护窗口内的统计量？

---

## 滑动窗口模型

### 什么是滑动窗口？

滑动窗口（Sliding Window）维护最近的 N 个元素或最近 T 时间内的元素：

```
数据流: [a b c d e f g h i j k l m n ...]
                    ↑ 窗口大小 W=5
                    
T1时刻: [a b c d e]           → 活跃窗口
T2时刻:   [b c d e f]         → 滑动后
T3时刻:     [c d e f g]       → 继续滑动
```

**核心思想**：只保留"相关"的近期数据，丢弃过期的历史数据。

### 两种窗口类型

| 类型 | 定义 | 应用场景 |
|------|------|----------|
| **计数窗口** | 最近 N 个元素 | 固定样本量统计 |
| **时间窗口** | 最近 T 时间内的元素 | 实时监控、告警 |
| **会话窗口** | 活跃会话期间 | 用户行为分析 |

### 核心操作

滑动窗口需要支持三种操作：

1. **添加（Add）**：新元素进入窗口
2. **过期（Expire）**：旧元素离开窗口
3. **查询（Query）**：计算窗口内的统计量

---

## 朴素方案：存储所有窗口元素

### 方案1：队列存储

```python
class NaiveWindow:
    """朴素滑动窗口：存储所有元素"""
    def __init__(self, size):
        self.window = []  # 队列
        self.size = size
    
    def add(self, item):
        self.window.append(item)
        if len(self.window) > self.size:
            self.window.pop(0)  # 移除最旧的
    
    def query_sum(self):
        return sum(self.window)  # O(n) 查询
    
    def query_mean(self):
        return sum(self.window) / len(self.window)  # O(n) 查询
```

**代价分析**：
- 空间：O(W)，存储窗口内所有元素
- 时间：O(1) 添加，O(W) 查询

**问题**：当窗口很大时，空间和查询时间都很高。

### 方案2：循环数组

```python
class CircularWindow:
    """循环数组实现"""
    def __init__(self, size):
        self.buffer = [None] * size
        self.head = 0  # 写入位置
        self.count = 0
    
    def add(self, item):
        self.buffer[self.head] = item
        self.head = (self.head + 1) % self.size
        self.count = min(self.count + 1, self.size)
    
    def query_sum(self):
        return sum(self.buffer[:self.count])  # O(W) 查询
```

**代价分析**：
- 空间：O(W)
- 时间：O(1) 添加，O(W) 查询
- 改进：避免了频繁的列表操作

---

## 优化：摘要结构

### 问题：如何优化查询效率？

朴素方案每次查询都要重新计算统计量，效率低。

**思路**：不存储原始数据，存储摘要。

### 优化方案1：增量计数

如果只需要窗口内的计数和求和：

```python
class SumWindow:
    """维护求和的滑动窗口"""
    def __init__(self, size):
        self.sum = 0
        self.size = size
        self.queue = []  # 存储元素用于过期
    
    def add(self, value):
        self.sum += value
        self.queue.append(value)
        if len(self.queue) > self.size:
            expired = self.queue.pop(0)
            self.sum -= expired
    
    def query_sum(self):
        return self.sum  # O(1) 查询！
    
    def query_mean(self):
        return self.sum / len(self.queue)  # O(1) 查询！
```

**代价改进**：
- 空间：O(W)，仍需存储元素用于过期
- 时间：O(1) 添加，**O(1) 查询**！

**关键洞察**：增量维护统计量，避免每次重新计算。

### 优化方案2：只存摘要

如果不需要过期时的精确扣除：

```python
class ApproximateSumWindow:
    """近似滑动窗口：只存求和"""
    def __init__(self, size):
        self.sum = 0
        self.size = size
        self.count = 0
    
    def add(self, value):
        self.sum += value
        self.count += 1
        
        # 过期处理：近似扣除
        if self.count > self.size:
            # 假设过期元素平均值 ≈ 当前平均值
            expired_estimate = self.sum / self.count
            self.sum -= expired_estimate
            self.count = self.size
    
    def query_sum(self):
        return self.sum  # O(1) 查询（近似）
```

**代价改进**：
- 空间：**O(1)**！只存储计数器和求和
- 时间：O(1) 添加，O(1) 查询
- 代价：**近似扣除**，误差可能累积

---

## 指数衰减窗口

### 思想：旧数据的重要性逐渐衰减

朴素滑动窗口是"硬过期"：元素要么在窗口内，要么完全丢弃。

**问题**：硬过期可能导致统计量突变。

**改进**：指数衰减窗口（Exponential Decaying Window）

```
权重函数: w(t) = e^(-λt)

当前时刻权重: 1.0
过去1个时间单位权重: e^(-λ) ≈ 0.37
过去2个时间单位权重: e^(-2λ) ≈ 0.14
...
```

### 实现

```python
class ExponentialWindow:
    """指数衰减窗口"""
    def __init__(self, decay_rate=0.1):
        self.sum = 0
        self.decay_rate = decay_rate  # λ
    
    def add(self, value):
        # 先衰减旧的权重
        self.sum *= math.exp(-self.decay_rate)
        # 再加入新的值
        self.sum += value
    
    def query(self):
        return self.sum
    
    def decay_only(self):
        """不添加值，仅衰减"""
        self.sum *= math.exp(-self.decay_rate)
```

**优势**：
- 空间：**O(1)**
- 不需要显式过期机制
- 自然地关注近期数据
- 统计量平滑变化，无突变

### 应用场景

指数衰减窗口适合：

1. **实时热点追踪**：热点词的频率追踪
2. **渐进遗忘的学习率**：在线学习中的学习率调整
3. **实时推荐**：用户兴趣的渐进更新

---

## DGIM算法：精确计数

### 问题：如何精确统计窗口内1的个数？

这是经典的DGIM（Datar-Gionis-Indyk-Motwani）算法问题：

```
数据流：0和1的序列
窗口：最近W位
查询：窗口内有多少个1？
```

### 精确方案的问题

```python
# 存储窗口内所有位
window = []
for bit in stream:
    window.append(bit)
    if len(window) > W:
        window.pop(0)

# 查询
def count_ones():
    return sum(window)  # O(W) 查询
```

空间：O(W)，查询：O(W)。

### DGIM算法思想

**核心思想**：用桶（Bucket）表示连续的1，桶大小为2的幂。

```
时间 → 
... | 1 | 1 | 0 | 1 | 1 | 1 | 0 | 0 | 1 | 1 | 1 | 1 | ...
     桶1(size=1)    桶2(size=2)           桶3(size=4)
```

**规则**：
1. 每个桶记录结束时间和大小（2的幂）
2. 同一大小的桶最多2个
3. 桶内全是1
4. 桶按时间从左到右排列

### DGIM实现

```python
class DGIM:
    """
    DGIM滑动窗口1计数，空间O(log²W)
    
    注意：此为示意代码，展示DGIM算法核心思想。
    生产环境建议使用经过充分测试的实现。
    """
    def __init__(self, window_size):
        """
        Args:
            window_size: 窗口大小（正整数）
        
        Raises:
            ValueError: window_size 不合法时抛出
        """
        if not isinstance(window_size, int) or window_size <= 0:
            raise ValueError(f"window_size 必须是正整数，当前: {window_size}")
        
        self.W = window_size
        self.buckets = []  # [(end_time, size)] 按时间从旧到新排序
        self.time = 0
    
    def process(self, bit):
        """
        处理一个位
        
        Args:
            bit: 0 或 1
        
        Raises:
            ValueError: bit 不是 0 或 1 时抛出
        """
        if bit not in (0, 1):
            raise ValueError(f"bit 必须是 0 或 1，当前: {bit}")
        
        self.time += 1
        
        # 移除过期桶（窗口外的桶）
        self.buckets = [(t, s) for t, s in self.buckets 
                        if t > self.time - self.W]
        
        if bit == 1:
            # 创建新桶（大小为1，结束时间为当前时间）
            self.buckets.append((self.time, 1))
            # 合并同大小的桶
            self._merge_buckets()
    
    def _merge_buckets(self):
        """
        保持每个大小的桶最多2个
        从最新的桶开始检查，同大小的桶超过2个时合并
        
        合并规则：将同大小的两个最旧桶合并为一个大桶
        """
        changed = True
        while changed:
            changed = False
            # 按大小分组计数
            size_count = {}
            for t, s in self.buckets:
                size_count[s] = size_count.get(s, 0) + 1
            
            # 找到需要合并的大小
            for size in sorted(size_count.keys()):
                if size_count[size] > 2:
                    # 找到该大小的前两个桶（最旧的）
                    indices_to_merge = []
                    for i, (t, s) in enumerate(self.buckets):
                        if s == size:
                            indices_to_merge.append(i)
                            if len(indices_to_merge) == 2:
                                break
                    
                    if len(indices_to_merge) == 2:
                        # 合并：移除两个旧桶，添加一个新的大桶
                        t1, _ = self.buckets[indices_to_merge[0]]
                        t2, _ = self.buckets[indices_to_merge[1]]
                        # 新桶的结束时间取较新的那个
                        new_time = max(t1, t2)
                        new_size = size * 2
                        
                        # 从后往前移除以保持索引正确
                        for idx in sorted(indices_to_merge, reverse=True):
                            self.buckets.pop(idx)
                        
                        # 插入合并后的桶（保持时间顺序）
                        inserted = False
                        for i, (t, s) in enumerate(self.buckets):
                            if t > new_time:
                                self.buckets.insert(i, (new_time, new_size))
                                inserted = True
                                break
                        if not inserted:
                            self.buckets.append((new_time, new_size))
                        
                        changed = True
                        break  # 重新开始检查
    
    def count(self):
        """
        估计窗口内的1的个数
        
        Returns:
            窗口内1的估计数量
        
        Note:
            误差最多为最后一个桶大小的一半
        """
        if not self.buckets:
            return 0
        
        # 加上所有桶的大小，最后一个桶只算一半（可能部分过期）
        total = sum(s for _, s in self.buckets[:-1])
        last_t, last_s = self.buckets[-1]
        total += last_s // 2  # 近似处理最后一个桶
        
        return total
```

**代价分析**：
- 空间：**O(log² W)**，而非 O(W)！
- 查询：O(log W)
- 精度：误差 ≤ 桶大小 / 2 ≈ 50%

### 为什么空间是 O(log² W)？

```
桶大小范围：1, 2, 4, 8, ..., 最大约 W
每种大小最多2个桶
桶大小数量：log W 种
总桶数：2 × log W
每个桶存储：时间（log W位） + 大小（log log W位）
总空间：O(log W × log W) = O(log² W)
```

---

## 滑动窗口的精度选择

### 精确 vs 近似

| 方案 | 空间 | 查询时间 | 精度 | 适用场景 |
|------|------|----------|------|----------|
| 朴素存储 | O(W) | O(W) | 精确 | 窗口较小 |
| 增量计数 | O(W) | O(1) | 精确 | 需精确扣除 |
| DGIM | O(log² W) | O(log W) | 近似 | 仅统计1的个数 |
| 指数衰减 | O(1) | O(1) | 近似 | 渐进遗忘场景 |

### 选择建议

```
问题：如何选择滑动窗口方案？

决策树：
  1. 需要精确统计？
     → 是：窗口大小可控？用增量计数
     → 否：窗口太大？用DGIM（仅限计数问题）
  
  2. 需要渐进遗忘？
     → 是：用指数衰减窗口
  
  3. 需要复杂查询（中位数、Top-K）？
     → 需要其他摘要结构（见后续章节）
```

---

## 实际应用：实时监控系统

让我们设计一个实时流量监控系统：

### 问题分析

```
需求：检测过去5分钟的流量异常
数据：每秒1000个流量包
窗口：5分钟 = 300秒 = 300000个包
```

### 方案选择

```python
# 方案1：朴素存储（不适用）
# 空间：300000个包 → 太大

# 方案2：增量计数（适用）
class TrafficMonitor:
    def __init__(self, window_size):
        self.sum = 0          # 总流量
        self.count = 0        # 包数量
        self.window = []      # 存储流量值
    
    def add(self, packet_size):
        self.sum += packet_size
        self.count += 1
        self.window.append(packet_size)
        
        if len(self.window) > self.window_size:
            expired = self.window.pop(0)
            self.sum -= expired
            self.count -= 1
    
    def detect_anomaly(self, current):
        mean = self.sum / self.count
        return current > 2 * mean

# 空间：O(window_size) 但查询O(1)
```

### 进一步优化

如果允许近似：

```python
class ApproximateTrafficMonitor:
    """指数衰减流量监控"""
    def __init__(self, decay_rate=0.01):
        self.sum = 0
        self.decay_rate = decay_rate
    
    def add(self, packet_size):
        self.sum *= math.exp(-self.decay_rate)
        self.sum += packet_size
    
    def detect_anomaly(self, current):
        # 近似均值（假设count稳定）
        mean = self.sum / 100  # 近似平均包数
        return current > 2 * mean

# 空间：O(1)！
```

---

## 与分布式算法的对比

> **💡 与分布式算法的区别**
> 
> 分布式滑动窗口需要多机协调：每台机器维护局部窗口，然后汇总。
> 
> 分布式场景下，窗口同步和过期通知都需要通信成本。
> 
> 单机滑动窗口只需要考虑空间约束，分布式还需要考虑通信成本。

| 维度 | 分布式滑动窗口 | 单机滑动窗口 |
|------|--------------|-------------|
| 约束 | 空间 + 通信 | 仅空间 |
| 过期处理 | 需要协调 | 本地处理 |
| 查询成本 | 汇总通信 | 本地计算 |

---

## 边界：滑动窗口不适用的情况

### 不适合滑动窗口的场景

1. **需要历史比较**：需要比较很久以前的数据
   - 例如：与去年同期的流量对比
   - 解决：维护多个不同大小的窗口

2. **精确统计要求**：无法接受任何误差
   - 例如：金融交易计数
   - 解决：用精确存储，牺牲空间

3. **复杂查询**：窗口内需要复杂计算
   - 例如：窗口内中位数、Top-K
   - 解决：需要其他摘要结构（见后续章节）

4. **不规则数据**：数据到达时间不规律
   - 例如：间歇性数据流
   - 解决：时间窗口 + 空桶处理

---

## 小结

### 核心收获

1. **滑动窗口思想**：只保留近期数据，丢弃过期历史
2. **朴素方案的代价**：空间 O(W)，查询 O(W)
3. **摘要优化**：增量维护统计量，查询 O(1)
4. **指数衰减**：渐进遗忘，空间 O(1)
5. **DGIM算法**：用桶结构精确计数，空间 O(log² W)

### 检查你的理解

1. 计数窗口和时间窗口的区别是什么？
2. 如何优化滑动窗口的查询效率？（增量维护）
3. 指数衰减窗口的优势是什么？
4. DGIM算法如何用 O(log² W) 空间近似统计？

---

## 下一步

学会了滑动窗口后，让我们学习第一个概率性摘要结构：[10.3 频率估计：Count-Min Sketch](03-count-min-sketch.md)

Count-Min Sketch解决的是：如何用少量内存估计海量数据的频率？
