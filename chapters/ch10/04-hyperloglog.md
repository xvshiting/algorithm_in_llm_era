# 10.4 埻重计数：HyperLogLog

> **核心问题**：如何用少量内存估计海量数据的基数？

---

## 开场问题：网站独立访客数统计

想象你在运营一个大型网站，需要统计UV（独立访客数）：

```python
def count_unique_users(users):
    """统计独立用户数 - O(n)时间，O(n)空间"""
    seen = set()
    for user_id in users:
        seen.add(user_id)
    return len(seen)
```

复杂度分析完美：O(n)扫描，O(n)空间。

但问题是：**过去24小时有10亿次访问，内存只有100MB**。

### 静态方案的问题

```python
# 方案1：HashSet
seen = set()
for user_id in stream:
    seen.add(user_id)
print(len(seen))
```

**代价分析**：
- 空间：10亿用户ID × 4字节 ≈ 4GB
- **问题：内存完全不够！**

```python
# 方案2：位图（用户ID范围已知）
bitmap = [False] * 1_000_000_000  # 用户ID范围1-10亿
for user_id in stream:
    bitmap[user_id] = True
print(sum(bitmap))
```

**代价分析**：
- 空间：10亿位 ≈ 125MB
- **问题：还是太大，且需要知道ID范围！**

**困惑**：如何在不存储所有ID的情况下，估计有多少不同用户？

---

## HyperLogLog的直觉

### 核心思想

不存储每个元素，利用哈希的随机性质估计基数。

**关键观察**：
- 哈希函数的输出可以看作随机数
- 如果数据有N个不同元素，哈希值均匀分布在[0, 2^m)
- 最长前导零的长度与N有关

### 扔硬币类比

```
问题：如何估计扔了多少次硬币？

观察：如果你看到连续k次反面（后才有正面），大概扔了多少次？

直觉：平均要扔约2^k次，才能看到连续k次反面

同理：哈希值的前导零个数，反映了元素数量
```

**数学直觉**：
- 如果有N个不同元素
- 哈希值均匀分布，期望最长前导零约为 log₂ N
- 看到最长前导零k，说明大概有 2^k 个元素

### 为什么叫"HyperLogLog"？

```
LogLog算法（2004）：
  存储前导零的最大值 → log₂(最大值) → log log N
  
HyperLogLog（2007）：
  用多个寄存器 + 调和平均 → 提高精度
  "Hyper"指用调和平均替代算术平均
```

---

## 从LogLog到HyperLogLog

### LogLog算法

**步骤**：
1. 将元素哈希到二进制串
2. 记录最长前导零长度
3. 估计：N ≈ 2^(max_zeros)

**问题**：
- 单个估计器误差大
- 需要大量估计器平均

### HyperLogLog改进

**步骤**：
1. 使用多个寄存器（分桶）
2. 每个寄存器记录该桶的最大前导零
3. 用调和平均合并估计

**为什么用调和平均？**

```
算术平均：μ = Σ x_i / n
调和平均：H = n / Σ (1/x_i)

调和平均对极端值更敏感，能更好地抑制噪音
对于前导零估计，调和平均能减少单个寄存器误差的影响
```

---

## HyperLogLog结构

### 数据结构定义

```
m = 2^b 个寄存器（通常 b = 10~16）

寄存器1: max_zeros = 3
寄存器2: max_zeros = 5
寄存器3: max_zeros = 2
...
寄存器m: max_zeros = 4
```

### 哈希过程

```
元素 → 哈希 → 64位二进制串

前b位：决定寄存器索引
后(64-b)位：计算前导零

例：
元素: "user_12345"
哈希: 0011 0101 1100 ... (64位)
b = 14

前14位: 00110101110001 → 确定寄存器
后50位: 计算50位中的前导零个数
```

---

## 完整实现

```python
import hashlib
import math

class HyperLogLog:
    """HyperLogLog基数估计"""
    
    def __init__(self, precision=14):
        """
        precision: 分桶数 = 2^precision
        标准误差 ≈ 1.04 / sqrt(2^precision)
        
        precision=14 → 16384桶，误差≈0.81%
        """
        self.b = precision
        self.m = 2 ** precision
        self.registers = [0] * self.m  # 每个寄存器存最大前导零
        self.alpha = self._get_alpha()  # 修正系数
    
    def _get_alpha(self):
        """根据m计算修正系数"""
        if self.m == 16: return 0.673
        if self.m == 32: return 0.697
        if self.m == 64: return 0.709
        return 0.7213 / (1 + 1.079 / self.m)
    
    def _hash(self, item):
        """64位哈希"""
        h = hashlib.md5(str(item).encode()).hexdigest()
        return int(h[:16], 16) & 0xFFFFFFFFFFFFFFFF
    
    def _count_leading_zeros(self, bits, max_bits):
        """计算前导零个数（从1开始计数）"""
        if bits == 0:
            return max_bits + 1
        return max_bits - bits.bit_length() + 1
    
    def add(self, item):
        """添加元素"""
        h = self._hash(item)  # 64位哈希
        
        # 前b位决定寄存器索引
        index = h >> (64 - self.b)
        
        # 后(64-b)位计算前导零
        remaining = h & ((1 << (64 - self.b)) - 1)
        zeros = self._count_leading_zeros(remaining, 64 - self.b)
        
        # 更新寄存器为最大值
        self.registers[index] = max(self.registers[index], zeros)
    
    def count(self):
        """估计基数"""
        # 调和平均
        harmonic = self.m / sum(2 ** (-r) for r in self.registers)
        
        # 基础估计
        estimate = self.alpha * self.m * self.m / harmonic
        
        # 小范围修正（线性计数）
        if estimate <= 2.5 * self.m:
            zeros = self.registers.count(0)
            if zeros != 0:
                estimate = self.m * math.log(self.m / zeros)
        
        # 大范围修正（超出哈希范围）
        if estimate > (1 << 64) / 30:
            estimate = -(1 << 64) * math.log(1 - estimate / (1 << 64))
        
        return int(estimate)
    
    def merge(self, other):
        """合并两个HLL（相同参数）"""
        for i in range(self.m):
            self.registers[i] = max(self.registers[i], other.registers[i])
```

### 使用示例

```python
# 创建HLL，precision=14，误差≈0.81%
hll = HyperLogLog(precision=14)

# 添加用户ID
for user_id in user_stream:
    hll.add(user_id)

# 查询UV
print(f"估计独立用户数: {hll.count()}")

# 空间分析
print(f"寄存器数: {hll.m} = {2**14}")
print(f"每个寄存器: 5位（前导零最多64）")
print(f"总空间: {hll.m * 5 / 8 / 1024} KB")
# 16384 × 5位 ≈ 10KB
```

---

## 为什么"对数之对数"就够了？

### 空间复杂度分析

```
寄存器数量: m = 2^b

每个寄存器存储：前导零的最大值
前导零最大值 ≈ log₂ N（N是基数）
存储这个值需要：log₂(log₂ N) 位

总空间: m × log(log N) 位

如果 m 固定（如 m = 16384）：
  空间 = O(log log N)
```

### 直觉解释

```
精确计数需要存储：每个元素本身 → O(N) 位

HyperLogLog存储：每个元素的"信息量" → log(log N) 位

类比：
  记住"最大数是什么" → O(N)
  记住"最大数是几位数" → O(log N)
  记住"最大数的位数是多少位数" → O(log log N)
```

### 空间对比

| 方案 | 空间 | 精度 |
|------|------|------|
| HashSet | 4GB | 精确 |
| 位图 | 125MB | 精确 |
| **HyperLogLog** | **12KB** | 标准误差≈0.81% |

**关键洞察**：用指数级更少的空间，换取可控的误差。

---

## 精度分析

### 标准误差公式

$$\text{标准误差} \approx \frac{1.04}{\sqrt{m}}$$

### 精度-空间权衡

| Precision | 桶数 m | 空间 | 标准误差 |
|-----------|--------|------|----------|
| 10 | 1024 | 1KB | 3.25% |
| 12 | 4096 | 4KB | 1.63% |
| 14 | 16384 | 16KB | **0.81%** |
| 16 | 65536 | 64KB | 0.41% |

### 实际应用建议

```python
# 大多数应用：precision=14（0.81%误差，16KB空间）
hll = HyperLogLog(14)

# 高精度应用：precision=16（0.41%误差，64KB空间）
hll = HyperLogLog(16)

# 低精度应用：precision=10（3.25%误差，1KB空间）
hll = HyperLogLog(10)
```

---

## HyperLogLog的应用

### 1. 网站UV统计

Redis的PFADD/PFCOUNT命令就是HyperLogLog：

```bash
# Redis示例
PFADD uv:2024-06-20 user1 user2 user3
PFADD uv:2024-06-20 user4 user5 user1  # user1重复不增加计数
PFCOUNT uv:2024-06-20  # 返回近似UV
```

### 2. 数据库基数估计

查询优化器需要估计查询结果的行数：

```sql
SELECT DISTINCT user_id FROM logs WHERE date = '2024-06-20';
-- 优化器用HLL估计行数，决定是否使用索引
```

### 3. 大数据去重

数据清洗时检测重复数据：

```python
def detect_duplicates(data_stream):
    hll = HyperLogLog(14)
    exact_count = 0
    
    for item in data_stream:
        hll.add(item)
        exact_count += 1
    
    estimated_unique = hll.count()
    estimated_duplicates = exact_count - estimated_unique
    
    print(f"总数据: {exact_count}")
    print(f"估计独立: {estimated_unique}")
    print(f"估计重复: {estimated_duplicates}")
```

### 4. 多日UV合并

统计多日的独立用户数：

```python
# 每日一个HLL
daily_hlls = {date: HyperLogLog(14) for date in dates}

# 合并多日HLL
total_hll = HyperLogLog(14)
for hll in daily_hlls.values():
    total_hll.merge(hll)

print(f"多日独立用户: {total_hll.count()}")
```

---

## HyperLogLog的变体

### HyperLogLog++

Google的工程优化版本：

1. **偏差修正**：小基数时修正偏差
2. **稀疏表示**：空寄存器用更紧凑格式
3. **动态精度**：基数增长时自动提高精度

### Adaptive HyperLogLog

根据基数动态调整精度：

```python
class AdaptiveHLL:
    """自适应HyperLogLog"""
    def __init__(self):
        self.small_hll = HyperLogLog(10)  # 低精度，1KB
        self.large_hll = None
        self.threshold = 100000
    
    def add(self, item):
        self.small_hll.add(item)
        
        estimate = self.small_hll.count()
        if estimate > self.threshold and self.large_hll is None:
            # 切换到高精度
            self.large_hll = HyperLogLog(14)
            # 重建...
    
    def count(self):
        if self.large_hll:
            return self.large_hll.count()
        return self.small_hll.count()
```

---

## HLL的边界与局限

### 什么时候HLL不适用？

1. **精确基数需求**：无法接受任何误差
   - 例如：金融系统用户计数
   - 解决：用精确存储

2. **小数据集**：数据量小时误差比例大
   ```
   N = 10（10个不同元素）
   HLL估计：10 ± 3（误差30%）
   
   解决：小数据用精确计数，大数据用HLL
   ```

3. **需要元素列表**：无法返回具体元素
   - 例如：需要知道具体是谁访问了
   - 解决：用HashSet存储元素

4. **需要精确频率**：无法估计元素的频率
   - 例如：需要知道每个用户访问了几次
   - 解决：用Count-Min Sketch

### HLL vs CMS对比

| 维度 | HyperLogLog | Count-Min Sketch |
|------|-------------|-------------------|
| 功能 | 基数估计（有多少不同元素） | 频率估计（每个元素出现多少次） |
| 空间 | O(log log N) | O(1/ε · log(1/δ)) |
| 误差 | 标准误差 ~1% | 高估，误差 ≤ εN |
| 查询 | 只能查询总数 | 可以查询任意元素频率 |
| 合并 | 寄存器取max | 计数器相加 |

---

## 实际应用：UV统计系统

让我们用HLL设计UV统计系统：

### 问题分析

```
需求：统计过去24小时的UV
数据：10亿次访问，用户ID范围1-10亿
约束：内存100MB
```

### 方案设计

```python
class UVSystem:
    """UV统计系统"""
    def __init__(self):
        # 主HLL
        self.hll = HyperLogLog(14)  # 16KB，误差0.81%
        
        # 滑动窗口：每小时一个HLL
        self.hourly_hlls = [HyperLogLog(12) for _ in range(24)]
        self.current_hour = 0
    
    def process_visit(self, user_id):
        self.hll.add(user_id)
        self.hourly_hlls[self.current_hour].add(user_id)
    
    def tick_hour(self):
        """每小时切换桶"""
        self.current_hour = (self.current_hour + 1) % 24
        # 重置新桶
        self.hourly_hlls[self.current_hour] = HyperLogLog(12)
    
    def get_24h_uv(self):
        """获取24小时UV"""
        return self.hll.count()
    
    def get_hourly_uv(self):
        """获取每小时UV"""
        return [hll.count() for hll in self.hourly_hlls]
```

**空间分析**：
- 主HLL：16KB
- 24小时桶：24 × 4KB = 96KB
- **总计**：约112KB << 100MB ✓

**精度**：
- 主HLL误差：0.81%
- 10亿UV → 误差约800万 → 相对误差0.81%

---

## War Story：Redis的HyperLogLog

Redis从2.8.9开始支持HyperLogLog：

```bash
# 添加元素
PFADD visitors:2024-06-20 "user1" "user2" "user3"

# 查询基数
PFCOUNT visitors:2024-06-20

# 合合多个键
PFADD visitors:2024-06-21 "user4" "user5"
PFCOUNT visitors:2024-06-20 visitors:2024-06-21
```

**工程优化**：
- 空间：最多12KB（包含头部和寄存器）
- 稀疏表示：小基数时用更紧凑格式
- 偏差修正：Google HyperLogLog++算法

---

## 与分布式算法的对比

> **💡 与分布式算法的区别**
> 
> 分布式基数统计：每台机器维护局部HLL，然后合并寄存器（取max）。
> 
> HLL的分布式合并非常高效：只需传输寄存器数组，通信成本 O(m)。
> 
> 相比精确方案（传输所有元素），HLL节省了巨大的通信成本。

| 维度 | 分布式HLL | 单机HLL |
|------|----------|--------|
| 合并 | 传输寄存器数组 | 本地操作 |
| 通信成本 | O(m) ≈ 16KB | 无 |
| vs精确方案 | 精确需要传输所有元素，可能GB级 | 无 |

---

## 小结

### 核心收获

1. **HLL思想**：利用哈希的前导零估计基数
2. **扔硬币类比**：看到k个前导零，说明约2^k个元素
3. **调和平均**：抑制噪音，提高精度
4. **空间复杂度**：O(log log N)，指数级节省
5. **精度**：标准误差 ≈ 1.04/√m

### 检查你的理解

1. HyperLogLog的核心思想是什么？（扔硬币类比）
2. 为什么空间复杂度是 O(log log N)？
3. 为什么用调和平均而不是算术平均？
4. HLL与CMS的区别是什么？（功能、空间、查询能力）

---

## 下一步

学会了频率估计和基数估计后，让我们学习流式决策问题：[10.5 流式聚合](05-streaming-aggregation.md)

流式聚合解决的是：数据还在流动时，如何做出不可撤销的决策？
