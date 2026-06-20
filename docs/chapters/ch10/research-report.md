# Ch10 流式算法：数据流动时的算法思维 - 调研报告

**调研日期**: 2026-06-20  
**调研者**: Nova  
**章节定位**: LLM时代算法教材第十章

---

## 一、核心概念梳理

### 1.1 数据流模型 (Data Stream Model)

#### 定义与特征

数据流是指**连续不断、单向流动、规模巨大**的数据序列，具有以下特征：

| 特征 | 描述 | 算法影响 |
|------|------|----------|
| **单向性** | 数据只流过一次，无法回溯 | 必须单遍处理 (single-pass) |
| **无限性** | 数据持续到达，无终点 | 算法需处理无限/未知规模 |
| **高速性** | 到达速度可能极快 | 算法必须高效，避免阻塞 |
| **不可存储** | 完整数据远超内存容量 | 空间受限，需近似/摘要 |

#### 形式化定义

数据流可表示为序列 ⟨x₁, x₂, x₃, ...⟩，其中：
- xᵢ ∈ U (全域，可能很大)
- 第 i 时刻仅能访问 xᵢ
- 目标：维护某种"状态" S，回答查询

**核心约束**:
- 空间复杂度: O(logᵏ n) 或 O(log n)（远小于 n）
- 时间复杂度: 每元素 O(1) 或 O(polylog n)
- 更新模式: 插入、删除、或两者兼有

#### 三种主要模型

1. **转置模型 (Turnstile Model)**
   - 支持 xᵢ ∈ U × {-1, +1}，即插入或删除
   - 数据可增可减，更通用但更难
   - 例：数据库事务流、网络流量统计

2. **仅插入模型 (Insertion-Only / Cash Register)**
   - 仅支持添加元素，不删除
   - 相对简单，很多算法仅需此模型
   - 例：日志分析、点击流

3. **滑动窗口模型 (Sliding Window)**
   - 只关心最近 W 个元素或最近时间窗口
   - 窗口外数据"过期"，无需考虑
   - 例：实时监控、最近一小时统计

### 1.2 滑动窗口 (Sliding Window)

#### 时间窗口 vs 计数窗口

| 类型 | 定义 | 应用场景 |
|------|------|----------|
| **计数窗口** | 最近 N 个元素 | 固定样本量统计 |
| **时间窗口** | 最近 T 时间内的元素 | 实时监控、告警 |
| **会话窗口** | 活跃会话期间 | 用户行为分析 |

#### 窗口模式

```
数据流: [a b c d e f g h i j k l m n ...]
                    ↑ 窗口大小 W=5
                    
T1时刻: [a b c d e]           → 活跃窗口
T2时刻:   [b c d e f]         → 滑动后
T3时刻:     [c d e f g]       → 继续滑动
```

#### 关键技术挑战

1. **过期处理**: 如何高效移除窗口左端数据？
2. **近似 vs 精确**: 空间限制下是否需要近似？
3. **查询延迟**: 窗口内查询是否能 O(1) 返回？

### 1.3 近似与概率算法范式

#### 为何需要近似？

精确算法的空间下界往往不可接受：
- 精确计数去重: 需要 O(n) 空间
- 精确中位数: 需要 O(n) 空间
- 精确频繁项: 需要 O(n) 空间

**近似以空间换精度**：用可控的误差换取指数级的空间节省。

#### 近似保证类型

1. **(ε, δ)-近似**
   P[|f̂ - f| ≤ εf] ≥ 1 - δ
   - ε: 相对误差阈值
   - δ: 失败概率
   - 例: Count-Min Sketch, Count Sketch

2. **(ε)-近似 (无失败概率)**
   |f̂ - f| ≤ ε · ‖f‖₁
   - 确定性保证
   - 例: MG summary (Misra-Gries)

3. **高概率正确**
   P[f̂ = f] ≥ 1 - δ
   - 以高概率返回正确答案
   - 例: 随机采样精确计数

### 1.4 摘要数据结构 (Synopsis/Sketch)

摘要数据结构是流式算法的核心工具：

| 摘要结构 | 功能 | 空间复杂度 | 误差类型 |
|----------|------|------------|----------|
| **Morris Counter** | 近似计数 | O(log log n) | 概率性 |
| **HyperLogLog** | 基数估计 | O(m log log n) | (ε, δ) |
| **Bloom Filter** | 成员检测 | O(-n ln p) | 单侧误差 |
| **Count-Min Sketch** | 频率估计 | O(ε⁻¹ log δ⁻¹) | (ε, δ) |
| **Count Sketch** | 频率估计 | O(ε⁻² log δ⁻¹) | (ε, δ) |
| **MG Summary** | 频繁项 | O(k) | 确定性误差界 |
| **Reservoir** | 均匀采样 | O(k) | 精确 |

---

## 二、经典流式算法

### 2.1 Morris 计数器 (Approximate Counting)

#### 问题：精确计数需要 ⌈log₂ n⌉ 位

一个计数器从 0 数到 n，至少需要 log₂ n 位。

#### Morris 的天才想法 (1978)

不存储精确值，而是存储一个"概率递增"的计数器：

```python
class MorrisCounter:
    def __init__(self):
        self.counter = 0  # 存储的是 log(log(n)) 级别的值
    
    def increment(self):
        # 以 1/2^counter 的概率增加 counter
        if random.random() < 1 / (2 ** self.counter):
            self.counter += 1
    
    def estimate(self):
        # 期望值: E[2^counter - 1] = n
        return (2 ** self.counter) - 1
```

#### 数学原理

设 X 为计数器值，n 为真实计数：
E[X] = log₂ n

存储空间: O(log log n) 位！

#### 变体与改进

```python
class MorrisCounterPlus:
    """Morris计数器的方差优化版本"""
    def __init__(self, variance_factor=1):
        self.counter = 0
        self.base = 1 + variance_factor
    
    def increment(self):
        if random.random() < 1 / (self.base ** self.counter):
            self.counter += 1
    
    def estimate(self):
        return (self.base ** self.counter - 1) / (self.base - 1)
```

#### 空间复杂度对比

| 精确计数 | Morris 计数器 | Morris+α |
|----------|---------------|----------|
| O(log n) | O(log log n) | O(log log n) |

### 2.2 蓄水池采样 (Reservoir Sampling)

#### 问题：从未知长度的流中均匀采样 k 个元素

```
数据流: x1, x2, x3, x4, x5, ... (长度未知)
目标: 维护一个大小为 k 的随机样本
```

#### 算法 (Algorithm R, Vitter 1985)

```python
def reservoir_sampling(stream, k):
    """
    从数据流中均匀采样 k 个元素
    保证每个元素被选中的概率都是 k/n
    """
    reservoir = []
    
    for i, item in enumerate(stream):
        if i < k:
            # 前k个元素直接放入
            reservoir.append(item)
        else:
            # 以 k/(i+1) 的概率替换
            j = random.randint(0, i)
            if j < k:
                reservoir[j] = item
    
    return reservoir

# 数学证明:
# 第 i 个元素被保留的概率 = k/i * (1 - 1/(i+1)) * ... * (1 - 1/n)
#                        = k/i * i/(i+1) * ... * n-1/n = k/n
```

#### 变体：加权蓄水池采样

```python
def weighted_reservoir_sampling(stream_with_weights, k):
    """
    加权采样：每个元素有权重 w_i
    选中概率与权重成正比
    """
    reservoir = []
    keys = []
    
    for item, weight in stream_with_weights:
        key = random.random() ** (1 / weight)
        
        if len(reservoir) < k:
            reservoir.append(item)
            keys.append(key)
        else:
            min_idx = keys.index(min(keys))
            if key > keys[min_idx]:
                reservoir[min_idx] = item
                keys[min_idx] = key
    
    return reservoir
```

### 2.3 Misra-Gries 频繁项算法 (1982)

#### 问题：找出频率超过 n/k 的元素

精确解需要 O(n) 空间，MG 算法用 O(k) 空间给出近似解。

#### 算法思想

维护 k-1 个计数器，每个新元素：
1. 若已有计数器，增加计数
2. 若无计数器但有空位，创建计数器
3. 若无空位，所有计数器减1，移除归零的

```python
class MisraGries:
    def __init__(self, k):
        self.k = k
        self.counters = {}  # element -> count
    
    def process(self, element):
        if element in self.counters:
            self.counters[element] += 1
        elif len(self.counters) < self.k - 1:
            self.counters[element] = 1
        else:
            # 所有计数器减1
            to_delete = []
            for key in self.counters:
                self.counters[key] -= 1
                if self.counters[key] == 0:
                    to_delete.append(key)
            for key in to_delete:
                del self.counters[key]
    
    def query(self, element):
        """返回估计频率，真实频率 >= 估计值"""
        return self.counters.get(element, 0)
    
    def get_frequent_items(self, n_total):
        """返回可能频繁的元素列表"""
        threshold = n_total / self.k
        return [(k, v) for k, v in self.counters.items() 
                if v >= threshold - len(self.counters)]
```

#### 误差分析

- 估计值 f̂ᵢ ≤ fᵢ ≤ f̂ᵢ + n/k
- 空间: O(k) 个计数器
- 保证：所有频率 > n/k 的元素都会被追踪

### 2.4 滑动窗口计数

#### 问题：维护最近 W 个元素的计数

精确解需要 O(W) 空间存储窗口内所有元素。

#### Datar-Gionis-Indyk-Motwani (DGIM) 算法

用对数空间近似维护窗口计数：

**核心思想**：用桶 (bucket) 表示连续的1，桶大小为2的幂

```python
class DGIM:
    """
    滑动窗口1-计数，空间复杂度 O(log²W)
    """
    def __init__(self, window_size):
        self.W = window_size
        self.buckets = []  # 桶列表 [(end_time, size)]
        self.time = 0
    
    def process(self, bit):
        """处理一个bit (0或1)"""
        self.time += 1
        
        # 移除过期桶
        self.buckets = [(t, s) for t, s in self.buckets 
                        if t > self.time - self.W]
        
        if bit == 1:
            # 创建新桶
            self.buckets.append((self.time, 1))
            # 合并相同大小的桶
            self._merge_buckets()
    
    def _merge_buckets(self):
        """保持每个大小的桶最多2个"""
        sizes = {}
        new_buckets = []
        for t, s in sorted(self.buckets, key=lambda x: -x[0]):
            if s not in sizes:
                sizes[s] = 0
            sizes[s] += 1
            if sizes[s] <= 2:
                new_buckets.append((t, s))
            else:
                # 合并最小的两个
                new_buckets.pop()  # 移除前一个
                new_buckets.pop()  # 移除再前一个
                new_buckets.append((t, s * 2))  # 合并
                sizes[s * 2] = sizes.get(s * 2, 0) + 1
        self.buckets = new_buckets
    
    def count(self):
        """估计窗口内的1的个数"""
        if not self.buckets:
            return 0
        # 加上所有桶的大小，最后一个桶只算一半
        total = sum(s for _, s in self.buckets[:-1])
        last_t, last_s = self.buckets[-1]
        total += last_s // 2  # 近似
        return total
```

**空间复杂度**: O(log² W)，而非 O(W)

---

## 三、概率性流式算法

### 3.1 HyperLogLog (HLL) - 基数估计

#### 问题：估计数据流中不同元素的个数 (基数)

精确解需要存储所有见过的元素，空间 O(n)。

#### 发展历程

| 算法 | 年份 | 空间复杂度 | 思想 |
|------|------|------------|------|
| Flajolet-Martin | 1985 | O(log n) | 前导零计数 |
| LogLog | 2004 | O(log log n) | 分桶平均 |
| HyperLogLog | 2007 | O(m log log n) | 调和平均 |
| HyperLogLog++ | 2013 | 同上 + 偏差修正 | Google工程优化 |

#### 核心思想：随机化 + 分桶

**观察**：随机哈希后，值 x 的前导零个数约为 log₂(1/P(x < x))

若数据集中有 n 个不同元素，期望最大前导零个数约为 log₂ n

```python
import hashlib

class HyperLogLog:
    def __init__(self, precision=14):
        """
        precision: 分桶数 = 2^precision
        标准误差 ≈ 1.04 / sqrt(m)
        """
        self.p = precision
        self.m = 2 ** precision
        self.registers = [0] * self.m
        self.alpha = self._get_alpha()
    
    def _get_alpha(self):
        """修正常数"""
        if self.m == 16: return 0.673
        if self.m == 32: return 0.697
        if self.m == 64: return 0.709
        return 0.7213 / (1 + 1.079 / self.m)
    
    def _hash(self, item):
        """64位哈希"""
        h = hashlib.md5(str(item).encode()).hexdigest()
        return int(h, 16) & 0xFFFFFFFFFFFFFFFF
    
    def add(self, item):
        h = self._hash(item)
        
        # 前p位确定桶
        bucket = h >> (64 - self.p)
        
        # 剩余位的前导零个数 + 1
        remaining = h & ((1 << (64 - self.p)) - 1)
        leading_zeros = 64 - self.p - remaining.bit_length() + 1
        
        # 更新桶为最大值
        self.registers[bucket] = max(self.registers[bucket], leading_zeros)
    
    def count(self):
        """估计基数"""
        # 调和平均
        harmonic = sum(2 ** (-r) for r in self.registers)
        estimate = self.alpha * self.m * self.m / harmonic
        
        # 小范围修正
        if estimate <= 2.5 * self.m:
            zeros = self.registers.count(0)
            if zeros != 0:
                estimate = self.m * math.log(self.m / zeros)
        
        # 大范围修正（线性计数）
        return int(estimate)

# 使用示例
hll = HyperLogLog(precision=14)  # 16384个桶，误差≈0.81%
for item in data_stream:
    hll.add(item)
print(f"估计不同元素数: {hll.count()}")
```

#### 空间-精度权衡

| Precision | 桶数 | 空间 | 标准误差 |
|-----------|------|------|----------|
| 10 | 1024 | 1KB | 3.25% |
| 14 | 16384 | 16KB | 0.81% |
| 16 | 65536 | 64KB | 0.41% |

### 3.2 Count-Min Sketch

#### 问题：估计元素频率（或其他统计量）

相比 Misra-Gries，CMS 支持更多查询类型。

#### 数据结构

```
        列数 w = ceil(e/ε)
     ┌─────────────────────┐
 行1 │ h1(x)  │  │  │  │  │
     ├─────────────────────┤
 行2 │ h2(x)  │  │  │  │  │    d = ceil(ln(1/δ))
     ├─────────────────────┤
 行d │ hd(x)  │  │  │  │  │
     └─────────────────────┘
```

#### 算法实现

```python
import mmh3  # MurmurHash3

class CountMinSketch:
    def __init__(self, epsilon=0.01, delta=0.01):
        """
        epsilon: 相对误差
        delta: 失败概率
        """
        self.w = int(math.ceil(2.71828 / epsilon))  # 宽度
        self.d = int(math.ceil(math.log(1 / delta)))  # 深度
        self.table = [[0] * self.w for _ in range(self.d)]
        self.seeds = [i * 1000 for i in range(self.d)]
    
    def add(self, item, count=1):
        """增加计数"""
        for i in range(self.d):
            j = mmh3.hash(str(item), self.seeds[i]) % self.w
            self.table[i][j] += count
    
    def estimate(self, item):
        """估计频率 (总是高估)"""
        min_count = float('inf')
        for i in range(self.d):
            j = mmh3.hash(str(item), self.seeds[i]) % self.w
            min_count = min(min_count, self.table[i][j])
        return min_count
    
    def inner_product(self, cms2):
        """估计两个数据流内积 (需要相同参数)"""
        min_ip = float('inf')
        for i in range(self.d):
            row_ip = sum(self.table[i][j] * cms2.table[i][j] 
                        for j in range(self.w))
            min_ip = min(min_ip, row_ip)
        return min_ip

# 使用示例
cms = CountMinSketch(epsilon=0.1, delta=0.01)
for item in data_stream:
    cms.add(item)

# 查询单项频率
print(f"'apple' 出现次数约 {cms.estimate('apple')}")
```

#### 保证

P[f̂ᵢ ≤ fᵢ + ε · ‖f‖₁] ≥ 1 - δ

空间: O(1/ε · log(1/δ))

#### 变体

| 变体 | 特点 | 应用 |
|------|------|------|
| **Count Sketch** | 有正负误差，可估计中位数 | 重尾分布 |
| **Conservative Update CMS** | 更新时保守策略，减少误差 | 精度要求高 |
| **Layered CMS** | 支持滑动窗口 | 时间衰减 |

### 3.3 Bloom Filter

#### 问题：判断元素是否在集合中（允许假阳性）

```python
import mmh3

class BloomFilter:
    def __init__(self, capacity, error_rate=0.01):
        """
        capacity: 预期元素数
        error_rate: 可接受的假阳性率
        """
        # 计算最优参数
        self.m = int(-capacity * math.log(error_rate) / (math.log(2) ** 2))
        self.k = int(self.m / capacity * math.log(2))
        self.bits = [False] * self.m
    
    def add(self, item):
        for i in range(self.k):
            j = mmh3.hash(str(item), i) % self.m
            self.bits[j] = True
    
    def contains(self, item):
        for i in range(self.k):
            j = mmh3.hash(str(item), i) % self.m
            if not self.bits[j]:
                return False  # 一定不存在
        return True  # 可能存在（假阳性）

# 空间效率对比
n = 1000000  # 100万元素
bloom = BloomFilter(n, error_rate=0.01)
# 空间: ~9.6M bits ≈ 1.2MB
# 精确集合: ~16MB (假设平均8字节/元素)
```

#### 与其他结构对比

| 数据结构 | 空间 | 假阳性 | 假阴性 | 删除 |
|----------|------|--------|--------|------|
| Hash Set | O(n) | 无 | 无 | 支持 |
| Bloom Filter | O(n log(1/p)) | 有 | 无 | 不支持 |
| Counting Bloom | O(nk) | 有 | 无 | 支持 |
| Cuckoo Filter | O(n) | 有 | 无 | 支持 |

---

## 四、流式场景下的复杂度分析

### 4.1 空间复杂度层次

| 问题 | 精确空间下界 | 近似空间 | 备注 |
|------|--------------|----------|------|
| 计数 | O(log n) | O(log log n) | Morris |
| 去重计数 | O(n) | O(log log n) | HLL |
| 频率估计 | O(n) | O(1/ε) | CMS |
| 频繁项 | O(n) | O(k) | MG |
| 中位数 | O(n) | O(1/ε²) | Quantile sketch |
| 内积 | O(n) | O(1/ε) | CMS |

### 4.2 时间-空间权衡

```
空间 ↑
│
│  精确算法 (O(n))
│  ┌────────────────────
│  │
│  概率近似 (O(polylog n))
│  ────────────────────
│  │
│  随机采样 (O(k))
│  ────────────────────
│
└─────────────────────→ 时间
     单遍   多遍
```

### 4.3 通信复杂度视角

分布式流式场景中，多个节点协作：

```
节点1 ──┐
节点2 ──┼── 协调者 ── 汇总结果
节点3 ──┘

问题：最少需要多少通信？
```

**典型结果**：
- 求和：O(log n) 位
- 去重计数：O(log log n) 位 (每节点独立 HLL)
- 中位数：O(1/ε) 位

---

## 五、LLM 时代的流式处理新视角

### 5.1 流式输出 vs 流式输入

| 维度 | 传统流式 | LLM 流式 |
|------|----------|----------|
| **方向** | 输入流 | 输出流 |
| **约束** | 内存限制 | 延迟限制 |
| **目标** | 空间高效 | 响应快速 |
| **查询** | 聚合统计 | 增量推理 |

### 5.2 增量推理 (Incremental Inference)

#### 问题：逐token生成，如何利用已计算结果？

```python
class StreamingLLM:
    """简化的流式推理示意"""
    def __init__(self, model):
        self.model = model
        self.kv_cache = {}  # KV Cache
    
    def stream_generate(self, prompt, max_tokens=100):
        # 编码 prompt
        input_ids = self.model.encode(prompt)
        
        # 预填充 (prefill)
        past_key_values = None
        for token in input_ids:
            # 可以并行处理 prompt
            past_key_values = self.model.forward(
                token, past_key_values
            )
        
        # 流式生成
        for _ in range(max_tokens):
            # 只计算最新 token
            next_token, past_key_values = self.model.forward(
                past_key_values=past_key_values,
                use_cache=True
            )
            yield self.model.decode(next_token)
```

#### KV Cache 的流式性质

- **窗口滑动**：上下文长度限制 → 类似滑动窗口
- **空间复杂度**：O(L · d) 其中 L 是序列长度，d 是隐藏维度
- **压缩策略**：
  - PagedAttention (vLLM)
  - Sliding Window Attention
  - Sparse Attention

### 5.3 滑动窗口注意力 (Sliding Window Attention)

```python
class SlidingWindowAttention:
    """
    仅关注最近 W 个 token
    类似 DGIM 的滑动窗口思想
    """
    def __init__(self, window_size=512):
        self.W = window_size
    
    def forward(self, query, key, value):
        L = query.shape[1]
        
        # 创建滑动窗口掩码
        mask = torch.zeros(L, L)
        for i in range(L):
            for j in range(L):
                if j < i - self.W or j > i:
                    mask[i, j] = -inf  # 掩盖窗口外
        
        # 缩放点积注意力
        scores = (query @ key.transpose(-2, -1)) / sqrt(d_k)
        scores = scores + mask
        return softmax(scores) @ value
```

**复杂度**: O(L · W) 而非 O(L²)

### 5.4 在线学习 (Online Learning)

#### 流式数据的持续学习

传统批处理 vs 流式在线学习：

| 批处理 | 在线学习 |
|--------|----------|
| 多轮遍历数据 | 单遍，即时更新 |
| 收敛到全局最优 | 追踪数据分布变化 |
| 静态模型 | 动态适应 |

```python
class OnlineLearner:
    """流式场景的在线学习框架"""
    def __init__(self, model, learning_rate=0.01):
        self.model = model
        self.lr = learning_rate
    
    def process_stream(self, data_stream):
        for x, y in data_stream:
            # 预测
            pred = self.model(x)
            
            # 即时损失
            loss = self.loss_fn(pred, y)
            
            # 在线梯度下降
            self.model.update(loss.gradient(), self.lr)
            
            # 可选：概念漂移检测
            if self.detect_drift(loss):
                self.model.adapt()
    
    def detect_drift(self, loss):
        """检测数据分布变化"""
        # 使用滑动窗口监控损失
        pass
```

### 5.5 LLM 流式场景的算法需求

| 场景 | 流式算法应用 | 挑战 |
|------|--------------|------|
| **长对话** | 滑动窗口 + 摘要 | 保留关键信息 |
| **RAG 检索** | 去重 + 频率统计 | 相关性过滤 |
| **实时监控** | 异常检测 + 聚合 | 低延迟 |
| **在线微调** | 增量学习 | 灾难性遗忘 |
| **多轮对话** | 上下文压缩 | 语义保留 |

### 5.6 新兴研究方向

1. **流式嵌入 (Streaming Embedding)**
   - 增量更新向量表示
   - 避免全量重计算

2. **增量索引 (Incremental Indexing)**
   - 向量数据库的流式更新
   - 增量 HNSW / IVF

3. **流式推理优化**
   - Speculative Decoding
   - Cascade Inference

4. **概念漂移检测**
   - 分布变化监控
   - 自适应模型选择

---

## 六、练习设计建议

### 6.1 基础练习

1. **Morris 计数器实现与实验**
   - 实现基本 Morris 计数器
   - 对比不同计数值下的误差分布
   - 思考：如何降低方差？

2. **蓄水池采样验证**
   - 从文件流中采样 k 个元素
   - 统计每个位置被采样的概率
   - 实现加权版本

3. **滑动窗口中位数**
   - 实现精确解（堆）
   - 实现近似解（Greenwald-Khanna）
   - 对比空间和时间

### 6.2 进阶练习

4. **HyperLogLog 实验**
   - 实现 HLL
   - 对比不同 precision 的误差-空间权衡
   - 实现合并操作（两个 HLL 合并）

5. **Count-Min Sketch 查询扩展**
   - 实现基本 CMS
   - 扩展：内积估计
   - 扩展：滑动窗口 CMS

6. **Bloom Filter 工程优化**
   - 实现标准 Bloom Filter
   - 扩展：Counting Bloom（支持删除）
   - 扩展：Scalable Bloom Filter（动态扩容）

### 6.3 LLM 结合练习

7. **流式输出分析**
   - 用 HLL 统计 LLM 输出的 token 多样性
   - 用 CMS 统计高频词
   - 思考：如何检测重复生成？

8. **上下文窗口管理**
   - 实现 DGIM 风格的 token 计数
   - 设计自动摘要触发机制
   - 对比不同窗口策略

9. **在线学习模拟**
   - 模拟流式微调场景
   - 实现简单的概念漂移检测
   - 设计适应性策略

### 6.4 开放问题

10. **实时推荐系统**
    - 设计流式协同过滤
    - 如何处理新用户/新物品？
    - 如何平衡实时性和准确性？

---

## 七、知识卡片来源标注

以下内容可转化为独立的知识卡片 (Zettel)：

| 卡片标题 | 来源章节 | 关键概念 |
|----------|----------|----------|
| 数据流模型 | 1.1 | 单遍、空间受限、近似 |
| 滑动窗口范式 | 1.2 | 计数窗口、时间窗口、DGIM |
| Morris 计数器 | 2.1 | 概率递增、log log n 空间 |
| 蓄水池采样 | 2.2 | 均匀采样、加权采样 |
| Misra-Gries | 2.3 | 频繁项、空间-误差权衡 |
| HyperLogLog | 3.1 | 前导零、分桶、调和平均 |
| Count-Min Sketch | 3.2 | 频率估计、误差界 |
| Bloom Filter | 3.3 | 假阳性、成员检测 |
| 流式复杂度层次 | 4.1 | 精确 vs 近似下界 |
| KV Cache 与滑动窗口 | 5.2 | 增量推理、空间压缩 |
| 在线学习 | 5.4 | 概念漂移、即时更新 |

---

## 八、参考资料

### 经典教材

1. **Kleinberg & Tardos** - *Algorithm Design*, Ch. 13 (Streaming)
2. **Roughgarden** - *Algorithms Illuminated*, Vol. 3, Part 6
3. **Skiena** - *The Algorithm Design Manual*, Streaming section

### 经典论文

1. Flajolet & Martin (1985) - Probabilistic Counting
2. Morris (1978) - Counting Large Numbers of Events
3. Misra & Gries (1982) - Finding Repeated Elements
4. Flajolet et al. (2007) - HyperLogLog: the analysis of a near-optimal cardinality estimation algorithm
5. Cormode & Muthukrishnan (2005) - An Improved Data Stream Summary

### 工程实践

1. **Apache Kafka** - 分布式流平台
2. **Apache Flink** - 流处理框架
3. **Spark Streaming** - 微批流处理
4. **Redis** - HLL、Bloom Filter 实现

### LLM 相关

1. Kwon et al. (2023) - PagedAttention (vLLM)
2. Beltagy et al. (2020) - Longformer (Sliding Window Attention)
3. Xiao et al. (2023) - StreamingLLM

---

**调研完成时间**: 2026-06-20  
**预计后续**: 根据 Felix 审查反馈补充或调整
