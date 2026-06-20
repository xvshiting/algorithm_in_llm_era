# 11.2 计算成本与缓存策略

> **核心洞察**：自注意力的O(n²)复杂度来自"全对全检索"。KV-cache通过增量计算将生成成本从O(n²)降到O(n)，这是缓存策略（Ch2）的经典应用。

---

## 11.2.1 开篇直觉：O(n²)问题

**规模困境**：

```
场景：处理不同长度的文本

文本长度：1000 token
  注意力矩阵：1000 × 1000 = 1M元素
  内存：1M × 4字节 = 4MB
  计算：可控
  
文本长度：10000 token
  注意力矩阵：10000 × 10000 = 100M元素
  内存：100M × 4字节 = 400MB
  计算：较大
  
文本长度：100000 token
  注意力矩阵：100000 × 100000 = 10B元素
  内存：10B × 4字节 = 40GB
  计算：不可行！

观察：
  文本长度翻倍 → 计算量翻4倍
  这是"灾难级"增长，不可扩展
```

**与传统算法对照**：

| 算法类型 | 时间复杂度 | 长度翻倍时 |
|---------|-----------|-----------|
| **线性扫描** | O(n) | 时间翻倍（可控） |
| **二分查找** | O(log n) | 时间微增（理想） |
| **自注意力** | O(n²) | 时间翻4倍（灾难） |

---

## 11.2.2 问题驱动：KV-cache溢出

### War Story：生成10000字的故事

**场景**：

```
任务：让LLM生成一篇10000字的故事

问题1：无缓存生成
  每生成1个字，重新计算所有token的注意力
  生成第10000字时：
    需要计算9999×10000次注意力
    时间成本：爆炸级增长
  模拟：
    生成第1字：计算1次
    生成第2字：计算2×2=4次
    生成第100字：计算100×100=10000次
    生成第10000字：计算10000×10000=100M次
    
问题2：KV-cache增量生成
  缓存已计算的Key和Value
  生成新token：
    只需计算新token的Query
    与缓存的K/V计算注意力
    成本：O(n)而非O(n²)
    
问题3：缓存溢出
  缓存大小持续增长：
    10000 × 4096 × 2 × 4字节 ≈ 300MB
  GPU内存有限（如8GB）
  其他组件占用空间 → 缓存溢出 → OOM错误
```

**关键问题**：

> KV-cache如何工作？如何处理缓存溢出？

---

## 11.2.3 核心概念：自注意力的复杂度分析

### 计算成本分解

```
自注意力计算步骤：

步骤1：投影
  Q = X @ W_Q → O(n × d × d) = O(n × d²)
  K = X @ W_K → O(n × d × d) = O(n × d²)
  V = X @ W_V → O(n × d × d) = O(n × d²)
  
步骤2：注意力分数
  scores = Q @ K^T → O(n × d × n) = O(n² × d)
  
  这是瓶颈！矩阵乘法涉及n×n对
  
步骤3：Softmax归一化
  attention = softmax(scores) → O(n²)
  
步骤4：加权聚合
  Y = attention @ V → O(n² × d)

总复杂度：O(n² × d)
关键瓶颈：步骤2的n²矩阵乘法
```

**空间成本分析**：

```
需要存储的中间结果：

1. 投影结果：
   Q, K, V：各n×d → 总共3 × n × d × 4字节
   
2. 注意力分数：
   scores：n × n → n² × 4字节
   
3. 注意力权重：
   attention：n × n → n² × 4字节
   
4. 最终输出：
   Y：n × d → n × d × 4字节

总空间（忽略常数因子）：
  O(n² + n × d)

瓶颈：注意力矩阵 n²
当n >> d时，空间主要由n²决定
```

---

## 11.2.4 KV-cache：增量计算的算法本质

### 算法定义

```
问题：生成第t个token

无缓存方案：
  重新计算所有token的Q、K、V
  成本：O(t × d² + t² × d)
  
KV-cache方案：
  缓存：K₁...K_{t-1}, V₁...V_{t-1}（历史）
  只计算：Q_t, K_t, V_t（新）
  成本：O(d² + t × d)

算法定义：
  # 初始生成（第1个token）
  K_cache = [K_1]
  V_cache = [V_1]
  
  for t in range(2, n+1):  # 生成后续token
      # 步骤1：只计算新token的投影
      Q_t = X[t] @ W_Q
      K_t = X[t] @ W_K
      V_t = X[t] @ W_V
      
      # 步骤2：缓存更新
      K_cache.append(K_t)
      V_cache.append(V_t)
      
      # 步骤3：注意力计算（使用缓存）
      K_all = stack(K_cache)  # [t, d]
      V_all = stack(V_cache)  # [t, d]
      
      scores_t = Q_t @ K_all.T  # [t]（只计算一行）
      attention_t = softmax(scores_t / sqrt(d))
      Y_t = attention_t @ V_all  # [d]
```

### 与Ch2缓存的对照

| Ch2 缓存特征 | KV-cache 对应 | 算法本质 |
|-------------|--------------|---------|
| **存储最近访问** | 存储已生成的K/V | 增量存储 |
| **避免重复计算** | 避免重复K/V计算 | 复用历史 |
| **空间换时间** | O(n×d)空间换O(n²→n)时间 | 经典权衡 |
| **过期策略** | 滑动窗口删除（见下文） | 缓存淘汰 |
| **缓存命中** | 所有历史token都是"命中" | 全命中 |

### 知识卡片 C11-05：KV-cache增量计算

```
概念：KV-cache是将增量计算思想应用于注意力的缓存策略

核心转变：
  重计算 → 增量计算
  O(n²) → O(n)
  空间换时间

算法本质：
  缓存复用（Ch2）+ 增量更新（Ch10流式）

数据结构：
  K_cache: [seq_len, d] × layers
  V_cache: [seq_len, d] × layers
  空间：O(L × d × layers)

关联：
  Z-缓存策略（Ch2）
  Z-增量计算（Ch10）
```

---

## 11.2.5 缓存策略与溢出处理

### 问题场景分析

```
场景：生成100000 token的长文本

模型参数：
  GPU内存：16GB
  模型参数：8GB（固定占用）
  激活值：2GB
  可用空间：16 - 8 - 2 = 6GB

KV-cache大小：
  seq_len = 100000
  d = 4096
  layers = 32
  K/V各一个：总共2
  
  缓存大小 = 100000 × 4096 × 32 × 2 × 4字节
           = 100000 × 1MB（约）
           = 100GB
           
问题：100GB > 6GB可用 → OOM（内存溢出）
```

### 缓存优化策略

```
策略1：滑动窗口缓存（类似LRU）
  保留最近W个token的K/V
  删除超过窗口的旧缓存
  
  算法：
    if len(K_cache) > window_size:
        K_cache = K_cache[-window_size:]
        V_cache = V_cache[-window_size:]
  
  成本：O(W × d) 空间
  问题：长距离依赖丢失
  
策略2：选择性保留
  识别"重要"token，优先保留其K/V
  重要性指标：接收的总注意力权重
  
  算法：
    importance = sum(attention_weights, axis=0)
    keep_indices = top_k(importance, max_cache_size)
    K_cache = K_cache[keep_indices]
  
  成本：O(k × d) 空间
  优点：保留关键信息
  
策略3：分层缓存
  近期缓存：完整保留（高精度）
  远期缓存：压缩或摘要（低精度）
  
  类似CPU缓存分层（L1/L2/L3）
  
策略4：压缩缓存
  用更小的精度存储（如int8而非float32）
  或用摘要向量替代完整K/V
  
  成本：空间减半或更多
  问题：精度损失
```

---

## 11.2.6 与前章节关联

### 对照表：KV-cache vs Ch2 缓存

| 维度 | Ch2 缓存策略 | 11.2 KV-cache | 关联强度 |
|------|-------------|--------------|---------|
| **存储对象** | 最近访问数据 | 已计算的K/V | 强 |
| **淘汰策略** | LRU/FIFO | 滑动窗口/选择性 | 强 |
| **权衡目标** | 空间换时间 | 同样 | 强 |
| **更新方式** | 查到就更新 | 增量添加 | 中 |
| **命中定义** | 再次访问 | 生成时复用 | 中 |
| **内存约束** | 缓存大小限制 | GPU内存限制 | 强 |

### 知识卡片 C11-06：缓存溢出策略

```
概念：缓存溢出处理是将Ch2缓存淘汰思想应用于长文本生成

策略对比：
  滑动窗口：类似LRU（淘汰最旧）
  选择性保留：类似LFU（保留高频）
  分层缓存：类似CPU多级缓存
  
算法本质：
  空间约束下的信息选择
  
关联：
  Z-缓存淘汰（Ch2）
  Z-内存约束（Ch10）
```

---

## 11.2.7 可视化建议

### 1. 复杂度曲线对比

```
图表内容：
  X轴：序列长度n
  Y轴：计算时间（或内存）
  
三条曲线：
  O(n)：线性（理想）
  O(n log n)：对数线性（可控）
  O(n²)：二次（灾难）
  
标注：
  n=1000：三种方案都可行
  n=10000：O(n²)开始明显
  n=100000：O(n²)不可行
```

### 2. KV-cache增长动画

```python
def visualize_kv_cache_growth():
    """
    动画展示KV-cache随生成增长
    """
    frames = []
    for t in range(1, 100):
        # 绘制当前缓存状态
        cache_size = t * 4 * 4  # t个token，4KB每token
        plt.bar(['KV-cache'], [cache_size])
        plt.ylim(0, 400)
        plt.title(f"Token {t}: Cache Size {cache_size}KB")
        plt.xlabel("Memory Component")
        plt.ylabel("Size (KB)")
        frames.append(plt.gcf())
        plt.clf()
    
    # 动画播放
    animate(frames)
```

### 3. 内存占用分解图

```
饼图展示：
  模型参数：50%
  KV-cache：30%（可变）
  激活值：15%
  其他：5%
  
标注：
  随生成长度增加，KV-cache占比增大
  当超过GPU内存 → OOM
```

---

## 11.2.8 代码示例

### KV-cache实现

```python
import numpy as np

class KVCache:
    """
    KV-cache增量缓存实现
    
    空间复杂度：O(seq_len × d_model × layers)
    """
    def __init__(self, d_model, layers, max_seq_len=None):
        self.d_model = d_model
        self.layers = layers
        self.max_seq_len = max_seq_len
        
        # 每层一个K/V缓存
        self.k_cache = [None] * layers
        self.v_cache = [None] * layers
        self.seq_len = 0
    
    def update(self, layer, K_new, V_new):
        """
        增量添加新位置的K/V
        
        K_new, V_new: [batch, 1, d_model]
        """
        if self.k_cache[layer] is None:
            self.k_cache[layer] = K_new
            self.v_cache[layer] = V_new
        else:
            # 拼接到现有缓存
            self.k_cache[layer] = np.concatenate(
                [self.k_cache[layer], K_new], axis=1
            )
            self.v_cache[layer] = np.concatenate(
                [self.v_cache[layer], V_new], axis=1
            )
        
        self.seq_len += 1
        
        # 检查是否超出限制
        if self.max_seq_len and self.seq_len > self.max_seq_len:
            self.truncate(self.max_seq_len)
    
    def get(self, layer):
        """
        返回完整的K/V供注意力计算
        """
        return self.k_cache[layer], self.v_cache[layer]
    
    def truncate(self, max_len):
        """
        滑动窗口：删除超出窗口的旧K/V
        """
        if self.seq_len > max_len:
            for layer in range(self.layers):
                if self.k_cache[layer] is not None:
                    self.k_cache[layer] = self.k_cache[layer][:, -max_len:, :]
                    self.v_cache[layer] = self.v_cache[layer][:, -max_len:, :]
            self.seq_len = max_len
    
    def clear(self):
        """
        清空缓存
        """
        self.k_cache = [None] * self.layers
        self.v_cache = [None] * self.layers
        self.seq_len = 0
    
    def memory_size(self):
        """
        计算当前内存占用（字节）
        """
        total = 0
        for layer in range(self.layers):
            if self.k_cache[layer] is not None:
                total += self.k_cache[layer].nbytes
                total += self.v_cache[layer].nbytes
        return total

# 使用示例
def demo_kv_cache():
    """
    演示KV-cache增量生成
    """
    cache = KVCache(d_model=512, layers=12, max_seq_len=4096)
    
    # 模拟投影矩阵
    W_Q = np.random.randn(512, 512)
    W_K = np.random.randn(512, 512)
    W_V = np.random.randn(512, 512)
    
    # 模拟逐token生成
    for t in range(10):
        # 新token的嵌入
        X_t = np.random.randn(1, 1, 512)
        
        # 投影
        Q_t = X_t @ W_Q
        K_t = X_t @ W_K
        V_t = X_t @ W_V
        
        # 更新缓存（每层）
        for layer in range(12):
            cache.update(layer, K_t, V_t)
        
        # 计算注意力（使用缓存）
        K_all, V_all = cache.get(0)
        scores = Q_t @ K_all.T
        attention = softmax(scores / np.sqrt(512))
        output = attention @ V_all
        
        print(f"Token {t}: cache size = {cache.memory_size()} bytes")
    
    return cache

def softmax(x):
    """安全的softmax"""
    exp_x = np.exp(x - np.max(x))
    return exp_x / np.sum(exp_x)

# 运行演示
cache = demo_kv_cache()
```

### 滑动窗口KV-cache

```python
class SlidingWindowKVCache(KVCache):
    """
    滑动窗口KV-cache
    
    只保留最近window_size个token
    空间复杂度：O(window_size × d_model × layers)
    """
    def __init__(self, d_model, layers, window_size=512):
        super().__init__(d_model, layers, max_seq_len=window_size)
        self.window_size = window_size
    
    def get_attention_window(self, layer, current_pos):
        """
        只返回窗口内的K/V
        """
        K, V = self.get(layer)
        
        # 只取最近window_size个
        start = max(0, current_pos - self.window_size)
        K_window = K[:, start:, :]
        V_window = V[:, start:, :]
        
        return K_window, V_window

# 使用示例
window_cache = SlidingWindowKVCache(d_model=512, layers=12, window_size=256)
```

---

## 11.2.9 练习设计

### 基础理解题（3题）

#### 练习 1：复杂度计算

```
模型参数：
  序列长度n=8192
  模型维度d=4096
  注意力头h=32

任务：
a) 计算自注意力总计算量
b) 计算内存占用（注意力矩阵）
c) 与传统RNN对比（RNN复杂度O(n×d²）

计算过程：
a) 自注意力计算量：
   Q/K/V投影：3 × n × d² = 3 × 8192 × 4096² ≈ 4.1×10^11
   注意力分数：n² × d = 8192² × 4096 ≈ 2.7×10^11
   总计：≈ 6.8×10^11 次运算
   
b) 注意力矩阵内存：
   n² × 4字节 = 8192² × 4 ≈ 268MB
   
c) RNN对比：
   RNN：n × d² = 8192 × 4096² ≈ 1.4×10^11
   Transformer：6.8×10^11（约5倍于RNN）
   
但RNN是顺序处理（无法并行），Transformer可并行
```

#### 练习 2：KV-cache直觉

```
场景：生成第100个token

任务：
a) 无缓存：需要计算多少次投影？
b) KV-cache：需要计算多少次？
c) 缓存大小是多少？

分析：
a) 无缓存：
   需要重新计算前99个token的Q/K/V
   投影次数：99 × 3 = 297次
   注意力计算：100 × 100 = 10000次
   
b) KV-cache：
   只计算第100个token的Q/K/V
   投影次数：3次
   注意力计算：100次（一行）
   
c) 缓存大小：
   100 × d × 2 × layers × 4字节
   若d=4096, layers=32：
   = 100 × 4096 × 2 × 32 × 4 ≈ 100MB
```

#### 练习 3：缓存策略选择

```
场景：GPU内存16GB，生成100000 token

模型参数：
  模型参数：8GB
  激活值：2GB
  可用：6GB

任务：
a) 分析何时会发生缓存溢出？
b) 选择什么缓存策略？
c) 分析对生成质量的影响？

分析：
a) 缓存溢出时机：
   KV-cache大小 = n × d × layers × 2 × 4
                = n × 4096 × 32 × 2 × 4
                = n × 1MB（约）
   
   当n × 1MB > 6GB → n > 6000
   即生成6000 token后溢出
   
b) 策略选择：
   - 滑动窗口：简单，但有信息损失
   - 选择性保留：更智能，但计算重要性成本
   - 压缩缓存：精度损失
   
   建议：滑动窗口 + 重要性保留（混合策略）
   
c) 影响分析：
   滑动窗口：丢失长距离依赖，但局部生成质量不受影响
   选择性保留：关键信息保留，但可能丢失次要信息
   混合策略：平衡质量与效率
```

### 方法应用题（2题）

#### 练习 4：缓存优化设计

```
需求：支持无限长生成，内存不超过8GB

任务：
a) 设计缓存驱逐策略
b) 评估对长距离依赖的影响
c) 实现滑动窗口缓存并测试

设计方案：
a) 混合驱逐策略：
   - 基础窗口：保留最近1024个token（必须）
   - 选择性保留：识别"注意力Sink"token，额外保留
   - 压缩远期：超过窗口的token压缩存储
   
b) 影响评估：
   长距离依赖测试：
     输入："...前文提到X...（中间10000字）...X相关"
     测试模型能否关联前文的X
   
   无缓存：长距离依赖完全丢失
   纯窗口：窗口外的X丢失
   混合策略：Sink token的X可能保留
   
c) 实现：
   参见代码示例 SlidingWindowKVCache
```

#### 练习 5：内存效率分析

```
模型：GPT-3 (175B参数)
序列长度：8192

任务：
a) 计算参数内存占用
b) 计算KV-cache内存占用
c) 分析不同精度(fp32/fp16/int8)的影响

分析：
a) 参数内存：
   175B参数 × 4字节(fp32) = 700GB
   （实际分布式存储，单GPU约50-100GB）
   
b) KV-cache：
   8192 × 12288 × 96 × 2 × 4字节
   （GPT-3：d=12288, layers=96）
   ≈ 8192 × 12288 × 96 × 8 ≈ 76GB
   
c) 精度影响：
   fp32：4字节/参数，完整精度
   fp16：2字节/参数，精度轻微损失
   int8：1字节/参数，量化压缩
   
   KV-cache精度影响：
   fp32 → 76GB
   fp16 → 38GB（减半）
   int8 → 19GB（减半再减半）
   
   建议：KV-cache可用fp16或int8，精度损失影响小
```

### LLM协同题（1题）

#### 练习 6：缓存策略审查

```
让LLM设计缓存溢出处理方案

任务：
a) 提供问题描述
b) 让LLM生成方案
c) 审查方案质量

审查要点：
┌─────────────────────────────────────────────┐
│ 算法正确性：                                │
│   复杂度分析是否准确？                      │
│   缓存更新逻辑是否正确？                    │
│                                            │
│ 实用性：                                    │
│   是否考虑GPU内存限制？                     │
│   是否考虑生成质量影响？                    │
│                                            │
│ 创新性：                                    │
│   是否有新颖策略？                          │
│   是否结合多种方法？                        │
└─────────────────────────────────────────────┘

提交审查报告
```

---

## 11.2.10 设计反思

### 教学要点总结

| 要点 | 教学策略 |
|------|---------|
| **直觉先行** | 从规模困境引入O(n²)问题 |
| **算法视角** | 复杂度分解，而非神经网络视角 |
| **问题驱动** | War Story展示缓存溢出场景 |
| **跨章节关联** | 对照Ch2缓存策略 |
| **可视化** | 复杂度曲线、缓存增长动画 |

### 常见误解澄清

| 误解 | 澄清 |
|------|------|
| "KV-cache是魔法优化" | KV-cache是缓存策略的算法化应用 |
| "缓存能解决所有问题" | 缓存有空间限制，需要溢出处理 |
| "滑动窗口就够了" | 窗口外的信息丢失，需要混合策略 |

### 知识卡片清单

| 编号 | 卡片标题 | 本节位置 |
|------|---------|---------|
| C11-04 | O(n²)复杂度瓶颈 | 11.2.3 |
| C11-05 | KV-cache增量计算 | 11.2.4 |
| C11-06 | 缓存溢出策略 | 11.2.5 |

---

*下一节：11.3 长上下文的算法挑战 —— 如何处理超长序列？*
