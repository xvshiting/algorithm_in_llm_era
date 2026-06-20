# 10.3 频率估计：Count-Min Sketch

> **核心问题**：如何用少量内存估计海量数据的频率？

---

## 开场问题：热搜词频率统计

想象你在运营一个搜索引擎，需要实时统计热搜词频率：

```python
def count_searches(searches):
    """统计搜索词频率 - O(n)时间，O(v)空间"""
    freq = {}
    for word in searches:
        freq[word] = freq.get(word, 0) + 1
    return freq
```

复杂度分析完美：O(n)扫描，O(v)空间。

但问题是：**每秒10万次搜索，共1000万种搜索词，内存只有100MB**。

### 静态方案的问题

```python
# 精确哈希表
freq = {}
for word in stream:
    freq[word] = freq.get(word, 0) + 1

# 查询
def get_freq(word):
    return freq.get(word, 0)
```

**代价分析**：
- 空间：1000万种词 × (词长 + 频率计数)
- 假设平均词长10字节，频率计数4字节
- 总空间：1000万 × 14字节 ≈ 140MB
- **问题：内存不够！**

**困惑**：如何在不存储所有词的情况下，估计任意词的频率？

---

## 朴素方案及其代价

### 方案1：精确哈希表

```python
freq = {}
for word in stream:
    freq[word] = freq.get(word, 0) + 1
```

**代价**：
- 空间：O(v)，v是不同词的数量
- 当v很大时（如1000万），内存爆炸

### 方案2：只存Top-K

```python
# 只保留频率最高的K个词
top_k = {}
for word in stream:
    # ... 逻辑复杂，需要动态更新Top-K
```

**问题**：
- 无法回答任意词的频率
- 新词可能频率很高但不在Top-K中

### 方案3：采样统计

```python
# 随机采样一部分数据
sample = []
for word in stream:
    if random.random() < 0.01:  # 1%采样率
        sample.append(word)
```

**问题**：
- 低频词可能完全漏掉
- 采样率低时误差大
- 空间仍是O(v)

---

## Count-Min Sketch的直觉

### 核心思想

不存储每个词的频率，存储频率的"摘要"。

**类比**：就像你无法记住每个人说了多少话，但可以记住"会议室A比会议室B更吵"。

### 设计直觉

让我们一步步思考：

**第一步：用哈希压缩**

如果用一个哈希函数把词映射到计数器：

```
词 → 哈希 → 计数器位置
"apple" → h("apple") → 位置 42
"banana" → h("banana") → 位置 42  ← 碰撞！
```

问题：哈希碰撞导致频率被错误地加在一起。

**第二步：多个哈希函数**

用多个不同的哈希函数：

```
h₁("apple") → 位置 42，计数器1
h₂("apple") → 位置 17，计数器2
h₃("apple") → 位置 99，计数器3
```

每个哈希函数给出一个独立的估计。

**第三步：取最小值**

为什么取最小值而不是平均值？

**关键洞察**：估计值 ≥ 真实值（只有哈希碰撞会高估，不会低估）

```
真实频率 f("apple") = 100

如果碰撞：
  h₁("apple") = h₁("banana")
  banana频率50被加到apple的计数器
  
  计数器1 = 100 + 50 = 150（高估）
  计数器2 = 100 + 20 = 120（高估，另一个碰撞）
  计数器3 = 100（无碰撞）
  
取最小值：min(150, 120, 100) = 100 ✓
```

---

## Count-Min Sketch结构

### 数据结构定义

```
        列数 w = ceil(e/ε)
     ┌─────────────────────┐
 行1 │ h₁(x)  │  │  │  │  │
     ├─────────────────────┤
 行2 │ h₂(x)  │  │  │  │  │    行数 d = ceil(ln(1/δ))
     ├─────────────────────┤
 行d │ h_d(x)  │  │  │  │  │
     └─────────────────────┘
```

**参数**：
- d：哈希函数数量（行数）
- w：每行计数器数量（列数）
- 总空间：d × w 个计数器

### 更新操作

```python
def add(word, count=1):
    """增加词的频率"""
    for i in range(d):
        j = h_i(word) % w  # 哈希到列
        table[i][j] += count
```

### 查询操作

```python
def estimate(word):
    """估计词的频率（总是高估）"""
    min_count = infinity
    for i in range(d):
        j = h_i(word) % w
        min_count = min(min_count, table[i][j])
    return min_count
```

---

## 完整实现

```python
import mmh3  # MurmurHash3
import math

class CountMinSketch:
    """Count-Min Sketch频率估计"""
    
    def __init__(self, epsilon=0.1, delta=0.01):
        """
        epsilon: 相对误差阈值
        delta: 失败概率
        
        空间：O(d × w) = O(1/ε · log(1/δ))
        """
        self.w = int(math.ceil(2.71828 / epsilon))  # 列数
        self.d = int(math.ceil(math.log(1 / delta)))  # 行数
        self.table = [[0] * self.w for _ in range(self.d)]
        self.seeds = [i * 1000 for i in range(self.d)]  # 不同哈希种子
        self.N = 0  # 总元素数
    
    def _hash(self, item, i):
        """第i个哈希函数"""
        return mmh3.hash(str(item), self.seeds[i]) % self.w
    
    def add(self, item, count=1):
        """增加元素频率"""
        self.N += count
        for i in range(self.d):
            j = self._hash(item, i)
            self.table[i][j] += count
    
    def estimate(self, item):
        """估计元素频率（总是 ≥ 真实值）"""
        min_count = float('inf')
        for i in range(self.d):
            j = self._hash(item, i)
            min_count = min(min_count, self.table[i][j])
        return min_count
    
    def get_total(self):
        """返回总元素数"""
        return self.N
```

### 使用示例

```python
# 创建CMS，允许10%误差，99%成功率
cms = CountMinSketch(epsilon=0.1, delta=0.01)

# 添加搜索词
for word in search_stream:
    cms.add(word)

# 查询频率
print(f"'python' 出现次数约 {cms.estimate('python')}")
print(f"'java' 出现次数约 {cms.estimate('java')}")

# 空间分析
print(f"总计数器数: {cms.d} × {cms.w} = {cms.d * cms.w}")
# d=5, w=28 → 140个计数器 ≈ 560字节
```

---

## 为什么取最小值？

### 数学直觉

**定理**：estimate ≥ 真实频率，误差 ≤ ε · N

**证明直觉**：

```
设真实频率 f(word)

每个计数器 table[i][j] 包含：
  f(word) + 其他碰撞元素的频率

因为所有碰撞元素的频率 ≥ 0：
  table[i][j] ≥ f(word)

取最小值：
  min(table[i][j]) ≥ f(word)
  
所以 estimate ≥ f(word) ✓
```

**误差分析**：

```
设 N = 总元素数

某个哈希位置的期望碰撞数：
  其他元素被哈希到同一位置的概率 ≈ 1/w
  碰撞元素的期望总频率 ≈ N / w = ε × N

高概率下，至少一个哈希位置的碰撞很小：
  P(至少一个位置碰撞 ≤ εN) ≥ 1 - δ
```

### 类比理解

就像在人群中找一个人，问多个人"那个人在哪个方向"：

- 每个人给出的答案可能有误差
- 但多个人的答案中，最一致的那个最可信
- 取最小值 = 选择碰撞最少（误差最小）的位置

---

## 空间与精度分析

### 空间复杂度

```
总计数器数：d × w
d = ln(1/δ)
w = e/ε

空间：O(1/ε · log(1/δ))
```

### 精度保证

**定理**：P[|estimate - f| ≥ εN] ≤ δ

其中 N 是流的总元素数。

### 参数选择指南

| 要求 | ε | δ | d | w | 空间 |
|------|---|---|---|---|------|
| 10%误差，99%成功 | 0.1 | 0.01 | 5 | 28 | 140 |
| 5%误差，99%成功 | 0.05 | 0.01 | 5 | 55 | 275 |
| 1%误差，99.9%成功 | 0.01 | 0.001 | 7 | 272 | 1904 |

### 实际应用建议

```python
# 典型配置：10%误差，99%成功
cms = CountMinSketch(epsilon=0.1, delta=0.01)
# 空间：140个计数器 ≈ 560字节

# 高精度配置：1%误差，99.9%成功
cms = CountMinSketch(epsilon=0.01, delta=0.001)
# 空间：1904个计数器 ≈ 7.6KB

# 对比精确哈希表
# 1000万词 × 14字节 ≈ 140MB
# CMS：560字节 vs 140MB → 指数级节省！
```

---

## Count-Min Sketch的应用

### 1. 频率估计

最直接的应用：估计任意元素的频率。

```python
# 搜索词频率
for word in search_stream:
    cms.add(word)

print(cms.estimate("python"))  # 估计"python"出现次数
```

### 2. Top-K查询

找出频率最高的K个元素。

**思路**：维护一个堆，追踪可能高频的元素。

```python
class TopKTracker:
    """Top-K追踪器"""
    def __init__(self, k, cms):
        self.k = k
        self.cms = cms
        self.heap = []  # (frequency, word)
        self.seen = set()
    
    def add(self, word):
        cms.add(word)
        
        # 定期检查高频元素
        if word not in self.seen:
            self.seen.add(word)
            freq = cms.estimate(word)
            if len(self.heap) < self.k:
                self.heap.append((freq, word))
            else:
                # 如果频率高于堆中最小元素
                min_freq = min(self.heap)[0]
                if freq > min_freq:
                    # 替换最小元素
                    self.heap = [(f, w) for f, w in self.heap if f != min_freq]
                    self.heap.append((freq, word))
    
    def get_top_k(self):
        return sorted(self.heap, reverse=True)
```

### 3. 内积估计

估计两个数据流的内积。

```python
def inner_product(cms1, cms2):
    """估计两个流中元素频率的内积"""
    # 需要 cms1 和 cms2 有相同的参数
    min_ip = float('inf')
    for i in range(cms1.d):
        row_ip = sum(cms1.table[i][j] * cms2.table[i][j] 
                    for j in range(cms1.w))
        min_ip = min(min_ip, row_ip)
    return min_ip
```

### 4. 异常检测

检测频率突增的元素。

```python
class AnomalyDetector:
    """频率异常检测"""
    def __init__(self, threshold_ratio=2.0):
        self.cms_current = CountMinSketch(0.1, 0.01)
        self.cms_history = CountMinSketch(0.1, 0.01)
        self.threshold = threshold_ratio
    
    def process(self, word, window_change):
        self.cms_current.add(word)
        
        if window_change:
            # 对比当前和历史频率
            current = self.cms_current.estimate(word)
            history = self.cms_history.estimate(word)
            
            if current > history * self.threshold:
                print(f"异常：'{word}' 频率突增！")
            
            # 重置
            self.cms_history = self.cms_current
            self.cms_current = CountMinSketch(0.1, 0.01)
```

---

## Count-Min Sketch的变体

### 1. Conservative Update CMS

**思想**：更新时更保守，减少误差。

```python
def conservative_add(self, item, count=1):
    """保守更新：只增加必要的计数器"""
    estimates = [self.table[i][self._hash(item, i)] 
                for i in range(self.d)]
    min_estimate = min(estimates)
    
    for i in range(self.d):
        j = self._hash(item, i)
        # 只增加到最小估计值 + count
        if self.table[i][j] == min_estimate:
            self.table[i][j] += count
```

**效果**：误差更小，但更新稍慢。

### 2. Count Sketch

**思想**：使用带符号的哈希函数，可以有正负误差。

```python
class CountSketch:
    """Count Sketch：有正负误差"""
    def __init__(self, epsilon, delta):
        self.w = int(1 / epsilon**2)
        self.d = int(math.log(1 / delta))
        self.table = [[0] * self.w for _ in range(self.d)]
        self.sign_seeds = [i * 2000 for i in range(self.d)]
    
    def add(self, item, count=1):
        for i in range(self.d):
            j = self._hash(item, i)
            sign = self._sign(item, i)  # +1 或 -1
            self.table[i][j] += sign * count
    
    def estimate(self, item):
        estimates = []
        for i in range(self.d):
            j = self._hash(item, i)
            sign = self._sign(item, i)
            estimates.append(sign * self.table[i][j])
        return median(estimates)  # 取中位数
```

**优势**：
- 可以估计中位数等更复杂的统计量
- 误差可以是正或负

### 3. Layered CMS（滑动窗口支持）

支持滑动窗口的CMS变体。

---

## CMS的边界与局限

### 什么时候CMS不适用？

1. **低频元素误差大**

```
设高频词 f = 10000
低频词 f = 100

误差 εN = 1000

对于高频词：10000 ± 1000 → 10%误差 ✓
对于低频词：100 ± 1000 → 可能误差1000% ✗
```

**解决**：用其他摘要结构（如Misra-Gries）处理低频元素。

2. **精确计数需求**：无法接受任何误差
   - 例如：金融交易计数
   - 解决：用精确存储

3. **范围查询**：不支持范围频率查询
   - 例如：查询所有以"py"开头的词的总频率
   - 解决：需要其他结构

4. **删除操作**：不支持删除（转票模型需要Count Sketch）

---

## 实际应用：热搜榜系统

让我们用CMS重新设计热搜榜：

### 问题分析

```
需求：统计过去1小时热搜词频率
数据：每秒10万次搜索，共1000万种词
约束：内存100MB
```

### 方案设计

```python
class TrendingTopicsSystem:
    """热搜榜系统"""
    def __init__(self):
        # CMS用于频率估计
        self.cms = CountMinSketch(epsilon=0.1, delta=0.01)
        
        # Top-K追踪
        self.top_k = TopKTracker(k=100, cms=self.cms)
        
        # 滑动窗口：每分钟一个桶
        self.buckets = [CountMinSketch(0.1, 0.01) for _ in range(60)]
        self.current_bucket = 0
    
    def process_search(self, word):
        self.cms.add(word)
        self.top_k.add(word)
        self.buckets[self.current_bucket].add(word)
    
    def tick_minute(self):
        """每分钟切换桶"""
        self.current_bucket = (self.current_bucket + 1) % 60
        # 重置新桶
        self.buckets[self.current_bucket] = CountMinSketch(0.1, 0.01)
    
    def get_trending(self):
        """获取Top100热搜"""
        return self.top_k.get_top_k()
    
    def get_word_freq(self, word):
        """查询任意词的频率"""
        return self.cms.estimate(word)
```

**空间分析**：
- 主CMS：140计数器 ≈ 560字节
- Top-K堆：100词 × 20字节 ≈ 2KB
- 60桶：60 × 560字节 ≈ 33KB
- **总计**：约36KB << 100MB ✓

---

## 与分布式算法的对比

> **💡 与分布式算法的区别**
> 
> 分布式频率统计需要多机汇总：每台机器维护局部CMS，然后合并。
> 
> CMS的合并是简单的：对应位置的计数器相加。
> 
> 分布式场景下，CMS合并需要传输整个计数器矩阵，通信成本 O(d × w)。

| 维度 | 分布式CMS | 单机CMS |
|------|----------|--------|
| 合并 | 需要传输计数器矩阵 | 本地操作 |
| 通信成本 | O(d × w) | 无 |
| 精度保证 | 合并后误差累加 | 单次误差 |

---

## 小结

### 核心收获

1. **CMS思想**：用多个哈希函数压缩频率信息
2. **取最小值的原因**：估计值 ≥ 真实值，取最小值选择误差最小的位置
3. **空间复杂度**：O(1/ε · log(1/δ))，指数级节省
4. **精度保证**：P[误差 ≤ εN] ≥ 1-δ
5. **适用边界**：不适合低频元素、精确需求、范围查询

### 检查你的理解

1. Count-Min Sketch的核心思想是什么？
2. 为什么取最小值作为估计？（数学直觉）
3. 如何选择参数 d 和 w？（误差和成功率要求）
4. CMS适合什么场景？不适合什么场景？

---

## 下一步

学会了频率估计后，让我们学习另一个摘要结构：[10.4 去重计数：HyperLogLog](04-hyperloglog.md)

HyperLogLog解决的是：如何用少量内存估计海量数据的基数（不同元素数量）？
