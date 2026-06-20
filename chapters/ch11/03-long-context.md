# 11.3 长上下文的算法挑战

> **核心洞察**：长上下文的挑战本质是内存约束下的信息保留问题。线性注意力、FlashAttention、稀疏注意力都是"精度换空间"的不同策略，映射到Ch10流式算法的近似范式。

---

## 11.3.1 开篇直觉：长度困境

**不可行的计算**：

```
场景：阅读一本书（100万字，约1M token）

Transformer困境：
  注意力矩阵：1M × 1M = 1万亿个元素
  内存：1万亿 × 4字节 = 4TB
  计算时间：以秒计 → 以小时计 → 以天计
  结论：这在GPU上不可行！

传统算法对比：
┌─────────────────────────────────────────────┐
│ 顺序扫描：O(n) 时间，O(1) 空间              │
│   可行！扫描整本书只需几秒                  │
│                                            │
│ 哈希索引：O(n) 构建时间，O(1) 查找          │
│   可行！关键词查找瞬间完成                  │
│                                            │
│ B+树索引：O(n log n) 构建时间，O(log n) 查找│
│   可行！范围查找高效                        │
│                                            │
│ 自注意力：O(n²) 计算，O(n²) 空间            │
│   不可行！n=1M时计算爆炸                    │
└─────────────────────────────────────────────┘

关键问题：
  能否保留"全对全"信息流，但避免O(n²)代价？
```

---

## 11.3.2 问题驱动：长文档理解失败

### War Story：100页法律合同分析

**场景**：

```
任务：分析一份100页的法律合同
  找出第10页定义的术语，在第80页如何使用
  
传统Transformer的困境：
  100页 ≈ 50000 token
  注意力矩阵：50000² = 2.5B元素
  GPU内存8GB → 只能处理约40000 token
  必须截断或压缩
```

**失败方案分析**：

```
方案1：截断
  只保留前8K token → 后续条款丢失
  结果：第80页的内容被截断，无法分析
  
  问题信息：
    第10页定义："甲方指ABC公司"
    第80页使用："甲方应在30日内..."
    
  截断后：只看到第10页，看不到第80页 → 遗漏关键条款

方案2：滑动窗口
  每次处理8K token，窗口滑动
  问题：跨窗口依赖丢失
  第10页在窗口1，第80页在窗口10 → 无法关联
  
方案3：摘要压缩
  先用摘要模型压缩成短文本，再分析
  问题：细节丢失
  摘要可能保留"甲方定义"，但丢失"第80页的具体条款"
```

**关键问题**：

> 如何在不爆炸内存的前提下，保留长距离依赖？

---

## 11.3.3 核心概念：线性注意力

### 算法原理

**核心洞察**：利用矩阵乘法结合律

```
标准注意力：
  Attention(Q, K, V) = softmax(Q @ K^T) @ V
                      = [n × n] @ [n × d]
                      需要 O(n²) 计算

关键数学性质：
  矩阵乘法结合律：(A × B) × C = A × (B × C)
  
  但softmax破坏结合律！
  softmax(A × B) × C ≠ softmax(A) × (B × C)
  
解决方案：用核函数替代softmax
  核函数φ：满足φ(A) × φ(B)^T ≈ softmax(A × B)
  
  则：Attention ≈ φ(Q) × (φ(K)^T × V)
                先算 φ(K)^T × V [d × d]
                再算 φ(Q) × [d × d]
                = O(n × d²) 复杂度
```

**算法定义**：

```
线性注意力算法：

步骤1：特征映射
  φ_Q = elu(Q) + 1  // Performer核函数
  φ_K = elu(K) + 1
  
步骤2：矩阵结合律优化
  // 先计算 K^T × V：[d, d] 矩阵
  KV = φ_K^T @ V  // O(n × d²)
  
步骤3：计算输出
  // 再计算 Q × KV：[n, d]
  output = φ_Q @ KV  // O(n × d²)
  
步骤4：归一化
  normalizer = φ_Q @ φ_K.sum(dim=0)
  output = output / normalizer

总复杂度：O(n × d²)
关键：避免中间的n×n矩阵
```

### 与Ch3对照：近似查找

| Ch3 精确查找 | 11.3 线性注意力 | 算法本质 |
|-------------|----------------|---------|
| **哈希表** | **核函数特征映射** | 近似替代 |
| **O(1)查找** | **O(n×d²)计算** | 复杂度权衡 |
| **精确匹配** | **近似匹配** | 精度换速度 |
| **无误差** | **有近似误差** | 可接受损失 |

**近似的代价**：

| 优势 |代价 |
|------|------|
| **时间O(n×d²)** | 近似softmax，非精确 |
| **空间O(n×d)** | 长距离依赖表达能力下降 |
| **支持无限长度** | 核函数选择影响质量 |
| **流式友好** | 某些核函数需历史累积 |

---

## 11.3.4 FlashAttention：硬件友好的内存优化

### 核心问题：内存访问瓶颈

```
GPU内存层次：
┌─────────────────────────────────────────────┐
│ HBM（高带宽内存）：                          │
│   容量：40GB                                │
│   带宽：1.5 TB/s                            │
│   特点：大容量，但速度受限                  │
│                                            │
│ SRAM（片上缓存）：                          │
│   容量：每块 ~20MB                          │
│   带宽：~19 TB/s                            │
│   特点：小容量，但速度极快                  │
│                                            │
│ 差距：SRAM带宽是HBM的10倍以上               │
└─────────────────────────────────────────────┘

标准注意力的问题：
  1. 写入HBM：scores [n×n]
  2. 读回计算：softmax
  3. 写入HBM：attention [n×n]
  4. 读回计算：× V
  
  总HBM访问：O(n²) 次读写
  
  瓶颈：内存带宽而非计算速度！
```

### 算法原理：分块计算

```
FlashAttention核心思想：
  分块（Tiling）：将大矩阵分小块，在SRAM中完成计算
  重计算：不存储中间结果，需要时重新计算

算法流程：
  for each block Q_i in Q:
      load Q_i to SRAM
      
      for each block K_j, V_j in K, V:
          load K_j, V_j to SRAM
          
          # 在SRAM内完成计算
          scores_block = Q_i @ K_j^T
          attention_block = softmax(scores_block)
          output_block += attention_block @ V_j
          
          # 不写回中间结果！只保留输出
      
      write output_block to HBM

内存访问优化：
  标准：读写 n×n 矩阵多次 → O(n²) HBM访问
  Flash：分块计算，只读写 n×d 结果 → O(n×d) HBM访问
  
  当n >> d时，内存访问显著减少
```

### 与Ch2对照：内存层次优化

| Ch2 内存层次 | 11.3 FlashAttention | 算法本质 |
|-------------|--------------------|---------|
| **CPU缓存优化** | **GPU SRAM优化** | 利用快速存储 |
| **数据局部性** | **分块局部计算** | 减少慢速访问 |
| **重计算策略** | **重计算代替存储** | 避免存储瓶颈 |

**算法启示**：

> FlashAttention不改变复杂度，但改变瓶颈。
> 算法复杂度仍是O(n²)，但避免了内存访问瓶颈。
> 这体现Ch8-9分布式章节的**硬件约束思维**。

---

## 11.3.5 稀疏注意力：选择性关注

### 算法设计

```
稀疏注意力模式：

1. 局部注意力（滑动窗口）：
   每个token只关注最近k个token
   注意力矩阵：带状（banded）
   成本：O(n × k)
   
   类似：图的邻居传播（Ch4）

2. 全局注意力（枢纽token）：
   设置少数"全局token"，关注所有位置
   类似图的中心节点（Ch4）
   成本：O(n × g)，其中g=全局token数
   
   例子：首尾token作为全局枢纽
   
3. 随机注意力（探索）：
   随机采样k个token关注
   类似随机游走（Ch4）
   成本：O(n × r)，其中r=随机采样数
   
4. 混合模式：
   局部 + 全局 + 随机
   类似"多索引查询"
   
   成本：O(n × (k + g + r))
```

### 算法实现

```
稀疏注意力算法：

def sparse_attention(Q, K, V, pattern):
    """
    pattern: [n, n] 稀疏掩码
    1表示关注，0表示不关注
    """
    scores = Q @ K^T  # [n, n]
    
    # 应用稀疏掩码
    scores = scores.masked_fill(pattern == 0, -inf)
    
    attention = softmax(scores)
    output = attention @ V
    
    return output

BigBird混合模式：
  pattern[i][j] = 1 if:
    (j in window[i-k, i+k])     # 局部窗口
    or (j in global_tokens)      # 全局枢纽
    or (j in random_sample[i])   # 随机采样
    
  总关注数：每位置 k + g + r ≈ 80
  复杂度：O(n × 80) ≈ O(n)
```

### 与Ch4对照：稀疏图传播

| Ch4 图传播模式 | 11.3 稀疏注意力 | 算法本质 |
|---------------|----------------|---------|
| **邻居传播** | **滑动窗口** | 局部信息聚合 |
| **中心节点** | **全局token** | 信息枢纽 |
| **随机游走** | **随机注意力** | 探索未知区域 |
| **边权重** | **注意力权重** | 信息流强度 |

---

## 11.3.6 与前章节关联

### 对照表：长上下文策略 vs Ch10 流式

| 维度 | Ch10 流式算法 | 11.3 长上下文策略 | 关联强度 |
|------|-------------|------------------|---------|
| **内存约束** | O(W)窗口 | O(n×d)或更小 | 强 |
| **近似策略** | DGIM近似计数 | 线性注意力近似 | 强 |
| **窗口管理** | 滑动窗口 | 滑动窗口注意力 | 强 |
| **信息保留** | 保留高频项 | Sink token保留 | 中 |
| **增量更新** | 流式增量 | KV-cache增量 | 强 |

### 知识卡片 C11-07：线性注意力原理

```
概念：线性注意力利用矩阵结合律，将O(n²)降到O(n×d²)

核心数学：
  softmax(QK^T)V ≈ φ(Q)(φ(K)^TV)
  
关键技巧：
  先算K^TV（小矩阵d×d）
  再算Q×结果（避免中间n×n）
  
算法本质：
  矩阵运算优化 + 近似替代
  
代价：
  近似softmax，精度损失
  
关联：
  Z-近似算法（Ch10）
  Z-矩阵优化
```

### 知识卡片 C11-09：稀疏注意力模式

```
概念：稀疏注意力通过选择性关注，降低复杂度

设计模式：
  局部：类似图的邻居（Ch4）
  全局：类似图的中心节点
  随机：类似随机游走
  
算法本质：
  结构选择 + 信息筛选
  
关联：
  Z-稀疏图（Ch4）
  Z-近似查找（Ch3）
```

---

## 11.3.7 可视化建议

### 1. 复杂度曲线对比

```
图表内容：
  X轴：序列长度n（100, 1000, 10000, 100000）
  Y轴：计算时间（秒）
  
四条曲线：
  O(n²)：标准注意力（红色，陡峭）
  O(n×d²)：线性注意力（蓝色，平缓）
  O(n×k)：稀疏注意力（绿色，最平缓）
  O(n)：理想线性（灰色基准）
  
标注：
  n=1000：所有方案可行
  n=10000：O(n²)明显慢
  n=100000：O(n²)不可行，线性/稀疏可行
```

### 2. 注意力模式对比

```
热图展示三种注意力矩阵：

标准注意力：
  密集矩阵，所有位置有连接
  视觉：完全填充的热图
  
稀疏注意力（滑动窗口）：
  带状矩阵，只有对角线附近有连接
  视觉：带状亮区
  
混合稀疏：
  带状 + 少数全局连接 + 随机点
  视觉：带状 + 散点 + 全局线
```

### 3. GPU内存层次示意图

```
分层展示：
┌─────────────────────────────────────┐
│         GPU计算单元                 │
│            ↓ ↑                      │
│    SRAM（20MB，19TB/s）             │ ← 分块计算在这里
│            ↓ ↑                      │
│    HBM（40GB，1.5TB/s）             │ ← 存储大矩阵
└─────────────────────────────────────┘

标注：
  SRAM→HBM：慢（瓶颈）
  SRAM内计算：快
  
  FlashAttention：尽量在SRAM完成
```

---

## 11.3.8 代码示例

### 线性注意力实现

```python
import numpy as np

def linear_attention(Q, K, V):
    """
    线性复杂度注意力（Performer风格）
    
    Q, K, V: [n, d] 或 [batch, n, d]
    复杂度：O(n × d²)而非O(n² × d)
    """
    # 特征映射：elu(x) + 1
    Q_feat = np.maximum(Q, 0) + 0.1 * (np.exp(Q) - 1) + 1
    K_feat = np.maximum(K, 0) + 0.1 * (np.exp(K) - 1) + 1
    
    # 矩阵结合律优化：先算K^T × V
    # K^T × V: [d, d] 小矩阵
    KV = K_feat.T @ V  # O(n × d²)
    
    # 再算Q × KV: [n, d]
    output = Q_feat @ KV  # O(n × d²)
    
    # 归一化
    # 每个位置的归一化因子
    normalizer = Q_feat @ K_feat.sum(axis=0)  # [n]
    output = output / (normalizer[:, np.newaxis] + 1e-10)
    
    return output

# 测试对比
def test_linear_vs_standard():
    """
    对比线性注意力与标准注意力
    """
    n = 10000
    d = 128
    
    Q = np.random.randn(n, d)
    K = np.random.randn(n, d)
    V = np.random.randn(n, d)
    
    # 标准注意力（O(n²)）
    import time
    start = time.time()
    scores_std = Q @ K.T / np.sqrt(d)
    attention_std = softmax_matrix(scores_std)
    output_std = attention_std @ V
    time_std = time.time() - start
    
    # 线性注意力（O(n×d²))
    start = time.time()
    output_lin = linear_attention(Q, K, V)
    time_lin = time.time() - start
    
    print(f"标准注意力：{time_std:.2f}秒")
    print(f"线性注意力：{time_lin:.2f}秒")
    print(f"速度提升：{time_std/time_lin:.1f}x")
    
    # 精度对比
    diff = np.mean(np.abs(output_std - output_lin))
    print(f"输出差异（平均绝对误差）：{diff:.4f}")

def softmax_matrix(x):
    """安全的矩阵softmax"""
    exp_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return exp_x / exp_x.sum(axis=1, keepdims=True)

# 运行测试
test_linear_vs_standard()
```

### 稀疏注意力实现

```python
class SparseAttention:
    """
    稀疏注意力：局部窗口 + 全局 + 随机
    """
    def __init__(self, window_size=256, global_tokens=4, random_tokens=8):
        self.window_size = window_size
        self.global_tokens = global_tokens
        self.random_tokens = random_tokens
    
    def compute_attention(self, Q, K, V):
        """
        稀疏注意力计算
        """
        n = Q.shape[0]
        output = np.zeros_like(Q)
        
        # 确定全局token（如首尾）
        global_indices = [0, 1, n-2, n-1]
        
        for i in range(n):
            # 构建关注索引
            attend_indices = set()
            
            # 1. 局部窗口
            start = max(0, i - self.window_size)
            end = min(n, i + self.window_size + 1)
            attend_indices.update(range(start, end))
            
            # 2. 全局token
            attend_indices.update(global_indices)
            
            # 3. 随机采样
            random_indices = np.random.choice(
                n, self.random_tokens, replace=False
            )
            attend_indices.update(random_indices)
            
            # 转为列表并排序
            attend_indices = sorted(list(attend_indices))
            
            # 提取稀疏K/V
            K_sparse = K[attend_indices]
            V_sparse = V[attend_indices]
            
            # 计算注意力
            scores = Q[i] @ K_sparse.T / np.sqrt(Q.shape[1])
            attention = softmax(scores)
            
            # 聚合
            output[i] = attention @ V_sparse
        
        return output
    
    def compute_complexity(self, n):
        """
        计算复杂度分析
        """
        per_position = self.window_size + self.global_tokens + self.random_tokens
        total_ops = n * per_position
        return f"O(n × {per_position}) = O({total_ops})"

def softmax(x):
    """安全的softmax"""
    exp_x = np.exp(x - np.max(x))
    return exp_x / np.sum(exp_x)

# 使用示例
sparse_attn = SparseAttention(window_size=128, global_tokens=4, random_tokens=8)
print(sparse_attn.compute_complexity(10000))  # O(n × 140)
```

---

## 11.3.9 练习设计

### 基础理解题（3题）

#### 练习 1：复杂度对比计算

```
序列长度：n=1M，维度d=512

任务：
a) 计算标准注意力计算量
b) 计算线性注意力计算量
c) 计算速度提升倍数

计算：
a) 标准注意力：
   n² × d = 1M² × 512 = 5.12×10^12 次运算
   
b) 线性注意力：
   n × d² = 1M × 512² = 2.62×10^8 次运算
   
c) 速度提升：
   5.12×10^12 / 2.62×10^8 ≈ 20000倍
   
结论：线性注意力让百万token处理变得可行
```

#### 练习 2：FlashAttention直觉

```
GPU参数：
  HBM: 40GB, 1.5TB/s带宽
  SRAM: 20MB, 19TB/s带宽

任务：
a) 分析为什么要分块计算？
b) 分块大小如何选择？
c) 重计算的代价是什么？

分析：
a) 分块原因：
   HBM带宽是瓶颈（慢于SRAM 10倍）
   大矩阵n×n必须存HBM → 多次读写 → 慢
   分块到SRAM → 减少HBM访问 → 快
   
b) 分块大小：
   受SRAM容量限制（20MB）
   每块：block_size × d × 4字节
   block_size ≤ 20MB / (d × 4)
   若d=4096：block_size ≤ 5000
   
c) 重计算代价：
   不存储中间结果，需要时重算
   额外计算成本：约2倍
   但内存访问减少 → 总时间更快
   
   这是"计算换内存"的权衡
```

#### 练习 3：稀疏模式选择

```
场景对比：

场景A：代码分析（长距离依赖重要）
  变量定义在第1行，使用在第100行
  需要跨距离的关联
  
场景B：文本生成（局部依赖重要）
  流式生成，主要关注前几个词
  远距离依赖影响小

任务：
a) 场景A应该选择什么稀疏模式？
b) 场景B应该选择什么稀疏模式？
c) 如何动态调整模式？

分析：
a) 场景A（代码分析）：
   需要：长距离依赖 + 局部上下文
   
   建议：局部窗口 + 全局token（变量名作为全局）
   或：哈希注意力（按变量名分桶）
   
b) 场景B（文本生成）：
   需要：局部连贯
   
   建议：纯滑动窗口（简单高效）
   
c) 动态调整：
   识别"重要"token（变量名、关键词）
   对重要token用全局注意力
   对其他token用局部注意力
   
   混合模式自适应
```

### 方法应用题（2题）

#### 练习 4：长上下文方案设计

```
需求：处理100K token的文档

约束：
  GPU内存：16GB
  模型参数：8GB（固定）
  可用空间：8GB

任务：
a) 分析内存限制
b) 选择优化策略
c) 权衡分析

设计：
a) 内存分析：
   标准注意力：100K² × 4字节 = 40GB → 不可行
   
   KV-cache：100K × d × layers × 2 × 4
            若d=4096, layers=32
            = 100K × 1MB = 100GB → 也超出
   
   必须优化！

b) 策略选择：
   方案组合：
     稀疏注意力（减少计算）
     + KV-cache压缩（减少空间）
     + 分层处理（分段处理长文档）
   
   具体参数：
     稀疏：window=1024, global=10, random=20
           每位置关注约1054个 → 可行
     
     KV-cache：int8量化（减半空间）
     
     分层：每段100K / 10 = 10K token
           分段处理，跨段摘要
   
c) 权衡：
   精度损失：
     稀疏注意力：约10%性能下降
     KV-cache量化：约5%性能下降
     分层处理：跨段信息丢失
   
   总体：可接受的精度损失换取可行性
```

#### 练习 5：FlashAttention实现

```
任务：实现简化版FlashAttention

要求：
a) 实现分块计算
b) 对比标准注意力内存占用
c) 性能测试

设计：
def flash_attention(Q, K, V, block_size):
    """
    简化版FlashAttention
    """
    n, d = Q.shape
    output = np.zeros_like(Q)
    
    # 分块计算
    for i in range(0, n, block_size):
        Q_block = Q[i:i+block_size]
        
        # 对每个Q块，遍历所有K/V块
        block_output = np.zeros((block_size, d))
        block_normalizer = np.zeros(block_size)
        
        for j in range(0, n, block_size):
            K_block = K[j:j+block_size]
            V_block = V[j:j+block_size]
            
            # 在"SRAM"中计算（小块）
            scores = Q_block @ K_block.T / np.sqrt(d)
            attn = softmax_matrix(scores)
            
            # 累积输出
            block_output += attn @ V_block
            block_normalizer += attn.sum(axis=1)
        
        output[i:i+block_size] = block_output
    
    return output

内存对比：
  标准：存储n×n矩阵 → O(n²)
  Flash：只存储小块 → O(block_size²)
  当block_size << n时，内存显著减少
```

### LLM协同题（1题）

#### 练习 6：长上下文方案审查

```
让LLM设计处理无限长度的方案

任务：
a) 提供问题描述
b) 让LLM生成方案
c) 审查方案质量

审查要点：
┌─────────────────────────────────────────────┐
│ 算法正确性：                                │
│   复杂度分析是否正确？                      │
│   是否真的解决了O(n²)？                     │
│                                            │
│ 内存效率：                                  │
│   是否考虑GPU内存限制？                     │
│   缓存策略是否合理？                        │
│                                            │
│ 长距离依赖：                                │
│   如何保留跨段信息？                        │
│   是否有信息丢失？                          │
└─────────────────────────────────────────────┘

提交审查报告
```

---

## 11.3.10 设计反思

### 教学要点总结

| 要点 | 教学策略 |
|------|---------|
| **直觉先行** | 从"不可行的计算"引入长上下文困境 |
| **算法视角** | 线性、Flash、稀疏作为三种优化策略 |
| **问题驱动** | War Story展示长文档分析失败 |
| **跨章节关联** | 对照Ch10流式、Ch3近似查找 |
| **可视化** | 复杂度曲线、注意力模式对比 |

### 常见误解澄清

| 误解 | 澄清 |
|------|------|
| "线性注意力是完美解决方案" | 有精度损失，非万能 |
| "FlashAttention改变复杂度" | 不改变复杂度，只改变瓶颈 |
| "稀疏注意力随机就行" | 稀疏模式需要设计，类似图结构设计 |

### 知识卡片清单

| 编号 | 卡片标题 | 本节位置 |
|------|---------|---------|
| C11-07 | 线性注意力原理 | 11.3.3 |
| C11-08 | FlashAttention分块 | 11.3.4 |
| C11-09 | 稀疏注意力模式 | 11.3.5 |

---

*下一节：11.4 Token与向量表示 —— 离散符号如何编码？*
