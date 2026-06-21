# 9.5 数据分片与负载均衡：如何避免热点

> **核心问题**：如何将数据分配到多台机器，避免热点？

---

## War Story：热点导致的系统崩溃

某社交网络平台，用户数据用哈希分片存储到100台机器。

```
分片策略：
user_id % 100 → 机器编号

用户分布：
- 100万用户 → 每台机器约1万用户
- 分布均匀 ✓

访问分布：
- 某名人发帖 → 百万粉丝同时点赞
- 该名人user_id % 100 = 42 → 机器42被压垮
- 整个系统不可用
```

**困惑**：哈希分片均匀分布用户，为什么还会崩溃？

**答案**：均匀分布数据 ≠ 均匀分布访问。热点是访问分布问题，不是数据分布问题。

---

## 分片策略对比

### 哈希分片

**方法**：
```
shard_id = hash(key) % num_shards
```

**优点**：
- 分布均匀（假设hash均匀）
- 查询简单（直接计算）

**缺点**：
- 范围查询困难（相邻key分布不同机器）
- 扩缩容困难（改变num_shards要重新分配所有数据）
- 不能解决热点（访问分布不均）

**适用场景**：
- KV存储（Redis Cluster）
- 无热点访问的场景

### 范围分片

**方法**：
```
key范围映射到shard
如：key[0-100] → shard1, key[101-200] → shard2
```

**优点**：
- 范围查询高效（相邻key同机器）
- 扩缩容简单（分裂/合并范围）

**缺点**：
- 可能热点（某范围访问频繁）
- 需要维护范围映射

**适用场景**：
- 时间序列数据（按时间分片）
- 范围查询频繁的场景

### 一致性哈希

**方法**：
```
1. 值空间构成环（0-2^32-1）
2. 每个shard分配到环上的多个位置
3. key hash后，顺时针找到第一个shard
```

**优点**：
- 扩缩容只影响相邻shard（减少数据迁移）
- 负载较均匀

**缺点**：
- 可能热点（某shard访问频繁）
- 复杂度较高

**适用场景**：
- 缓存系统（Dynamo、Cassandra）
- 需要动态扩缩容的场景

---

## 热点问题分析

### 热点定义

**热点**：某数据项访问频率远高于其他项，导致负载不均。

**类比**：餐厅分桌
- 均匀分配座位 → 每桌人数均匀
- 但某桌点了热门菜品 → 该桌服务员被围攻

### 热点成因

| 成因 | 说明 | 例子 |
|------|------|------|
| **访问热点** | 某数据项访问频繁 | 名人粉丝互动 |
| **时间热点** | 某时间段访问集中 | 新年祝福、秒杀 |
| **地理热点** | 某地区访问集中 | 本地新闻 |
| **数据热点** | 某数据项关联多 | 中心节点社交图 |

### 热点影响

```
热点 → 该shard过载 → 响应慢 → 用户不满
     → 该shard崩溃 → 服务中断 → 系统不可用
```

---

## 热点识别与解决

### 热点识别

**监控指标**：
- 每个shard的请求频率
- 每个shard的响应时间
- 每个数据项的访问频率

**阈值判断**：
```
某shard请求频率 > 平均频率 × 3 → 热点
某数据项访问频率 > 平均频率 × 10 → 数据热点
```

### 热点解决策略

**策略1：热点分裂**

```
识别热点 → 复制热点数据到多个shard
例：
  名人节点在shard42 → 访问频繁
  复制到shard42-1, shard42-2, shard42-3
  请求分发到多个副本 → 负载分散
```

**策略2：读写分离**

```
写操作 → 主shard
读操作 → 多个副本shard
好处：
  读请求分散到多个副本 → 负载均衡
  写请求仍集中 → 保证一致性
```

**策略3：动态扩容**

```
监控热点 → 自动扩容
1. 检测某shard负载过高
2. 自动创建新shard
3. 迁移部分数据到新shard
4. 负载均衡
```

**策略4：盐化**

```
热点数据加随机后缀
例：
  名人user_id = 123 → 热点
  盐化：123_0, 123_1, 123_2, ..., 123_9
  分散到10个shard → 负载均衡
```

---

## 图分片策略

### 问题

社交网络图如何分片？

**挑战**：
- 边跨节点 → 通信成本高
- 热点节点 → 该shard过载

### 图分片策略

**策略1：哈希分片**

```
node_id % num_shards → shard_id

优点：简单均匀
缺点：约50%边跨节点 → 通信成本高
```

**策略2：边分片**

```
edge_id % num_shards → shard_id

优点：边分布均匀
缺点：查询节点邻居要跨shard
```

**策略3：图划分算法（Metis）**

```
目标：最小化跨shard边
算法：启发式划分（NP-hard问题）

优点：跨shard边少 → 通信成本低
缺点：预计算成本高
```

**策略4：标签传播分片**

```
动态分片：
1. 初始化：每个节点随机分配shard
2. 每轮：节点采用多数邻居的shard
3. 收敛：邻居集中 → 局部性高

优点：动态调整，局部性好
缺点：可能不稳定
```

### 图分片权衡

| 策略 | 跨节点边比例 | 适用场景 |
|------|------------|---------|
| 哈希分片 | ~50% | 简单场景 |
| 边分片 | ~50% | 边操作频繁 |
| Metis | ~10% | 大规模图计算 |
| 标签传播 | ~20% | 动态图 |

---

## 负载均衡机制

### 负载均衡定义

**负载均衡**：将请求/数据分配到多个shard，使负载均匀。

### 负载均衡策略

**策略1：轮询**

```
请求依次分配到各shard
shard1, shard2, shard3, shard1, ...

优点：简单均匀
缺点：不考虑shard负载差异
```

**策略2：加权轮询**

```
根据shard能力分配权重
shard1(权重2), shard2(权重1), shard3(权重1)
→ shard1, shard1, shard2, shard3, ...

优点：考虑shard能力差异
缺点：不考虑实时负载
```

**策略3：最少连接**

```
请求分配到当前连接数最少的shard

优点：实时负载均衡
缺点：需要监控连接数
```

**策略4：一致性哈希**

```
请求key hash → 分配到对应shard

优点：相同key始终同一shard → 缓存高效
缺点：可能热点
```

---

## 分片设计流程

### 设计步骤

```
1. 分析数据特征
   - 数据量多少？
   - 数据增长速度？
   - 数据访问模式？

2. 选择分片策略
   - 哈希分片？范围分片？一致性哈希？
   - 根据查询模式选择

3. 分析热点风险
   - 是否有访问热点？
   - 是否有时间热点？
   - 是否有数据热点？

4. 设计热点处理机制
   - 热点分裂？读写分离？动态扩容？

5. 设计负载均衡机制
   - 请求如何分发？
   - 如何监控负载？
```

### 案例：社交网络分片

```
数据特征：
- 100万用户
- 每用户平均100朋友
- 某名人有百万粉丝

分析：
- 用户关系是图结构
- 名人节点是热点

设计：
- 图分片：Metis（最小化跨节点边）
- 热点处理：名人节点复制到多shard
- 负载均衡：最少连接策略
```

---

## LLM视角：分片方案审查

### LLM容易犯的错误

```
LLM方案："设计社交网络分片"
方案：哈希分片，user_id % 100

审查发现：
- 数据分布均匀 ✓
- 访问分布不均 → 名人节点热点 → 崩溃风险

改进：
- 热点识别：监控访问频率
- 热点分裂：名人节点复制
```

### 审查要点

审查LLM给出的分片方案时，检查：

1. **分片策略**：是否适合查询模式？
2. **热点风险**：是否有访问/时间/数据热点？
3. **跨节点成本**：图分片时跨节点边比例？
4. **动态性**：是否能动态扩缩容？
5. **负载均衡**：请求如何分发？

---

## 小结

### 分片策略对比

| 策略 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| **哈希分片** | 简单均匀 | 范围查询困难 | KV存储 |
| **范围分片** | 范围查询高效 | 可能热点 | 时间序列 |
| **一致性哈希** | 扩缩容简单 | 复杂度高 | 缓存系统 |
| **图分片** | 局部性好 | 预计算成本高 | 图计算 |

### 热点解决策略

| 策略 | 说明 |
|------|------|
| **热点分裂** | 复制热点数据到多shard |
| **读写分离** | 写主shard，读多副本 |
| **动态扩容** | 自动扩容热点shard |
| **盐化** | 热点数据加随机后缀 |

### LLM审查要点

- 分片策略是否适合查询模式？
- 是否有热点风险？
- 是否有热点处理机制？
- 是否能动态扩缩容？

---

## 练习

## 分片策略代码示例

### 哈希分片实现

```python
class HashSharding:
    """哈希分片策略"""
    
    def __init__(self, num_shards):
        self.num_shards = num_shards
    
    def get_shard(self, key):
        """计算key所属的shard"""
        return hash(key) % self.num_shards
    
    def put(self, key, value, shards):
        """写入数据"""
        shard_id = self.get_shard(key)
        shards[shard_id][key] = value
    
    def get(self, key, shards):
        """读取数据"""
        shard_id = self.get_shard(key)
        return shards[shard_id].get(key)
```

### 一致性哈希实现

```python
import hashlib

class ConsistentHashing:
    """一致性哈希分片策略"""
    
    def __init__(self, nodes, virtual_nodes=100):
        self.ring = {}  # hash值 → node
        self.virtual_nodes = virtual_nodes
        
        # 将每个节点映射到环上的多个虚拟节点
        for node in nodes:
            for i in range(virtual_nodes):
                key = f"{node}:{i}"
                hash_val = self._hash(key)
                self.ring[hash_val] = node
    
    def _hash(self, key):
        """计算hash值"""
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
    
    def get_node(self, key):
        """找到key所属的节点"""
        hash_val = self._hash(key)
        
        # 在环上顺时针找到第一个节点
        sorted_hashes = sorted(self.ring.keys())
        for h in sorted_hashes:
            if h >= hash_val:
                return self.ring[h]
        
        # 环形，回到第一个节点
        return self.ring[sorted_hashes[0]]
    
    def add_node(self, node):
        """添加新节点"""
        for i in range(self.virtual_nodes):
            key = f"{node}:{i}"
            hash_val = self._hash(key)
            self.ring[hash_val] = node
    
    def remove_node(self, node):
        """移除节点"""
        to_remove = []
        for h, n in self.ring.items():
            if n == node:
                to_remove.append(h)
        for h in to_remove:
            del self.ring[h]
```

### 热点检测与处理

```python
class HotspotDetector:
    """热点检测器"""
    
    def __init__(self, threshold=3.0):
        self.threshold = threshold  # 标准差倍数阈值
        self.access_counts = {}  # shard → 访问计数
    
    def record_access(self, shard_id):
        """记录访问"""
        self.access_counts[shard_id] = self.access_counts.get(shard_id, 0) + 1
    
    def detect_hotspots(self):
        """检测热点"""
        if len(self.access_counts) < 2:
            return []
        
        counts = list(self.access_counts.values())
        avg = sum(counts) / len(counts)
        std = (sum((c - avg)**2 for c in counts) / len(counts))**0.5
        
        hotspots = []
        for shard, count in self.access_counts.items():
            if count > avg + self.threshold * std:
                severity = (count - avg) / std
                hotspots.append({
                    "shard": shard,
                    "count": count,
                    "severity": severity
                })
        
        return hotspots


class HotspotHandler:
    """热点处理器"""
    
    def __init__(self, shards):
        self.shards = shards
        self.hotspot_replicas = {}  # hotspot_key → [replica_shards]
    
    def handle_hotspot(self, hotspot_key, severity):
        """处理热点"""
        if severity > 5.0:
            # 高严重性：分裂到多个副本
            num_replicas = 3
            replicas = []
            for i in range(num_replicas):
                replica_shard = f"{hotspot_key}_replica_{i}"
                replicas.append(replica_shard)
            self.hotspot_replicas[hotspot_key] = replicas
            return "split"
        elif severity > 3.0:
            # 中严重性：增加读副本
            return "replicate"
        else:
            return "monitor"
    
    def get_replica(self, hotspot_key):
        """获取热点数据的副本"""
        replicas = self.hotspot_replicas.get(hotspot_key, [])
        if replicas:
            # 负载均衡：随机选择一个副本
            import random
            return random.choice(replicas)
        return hotspot_key  # 无副本，返回原shard
```

---


### 1. 选择分片策略

场景：日志数据，按时间查询频繁。

选择合适的分片策略，并分析优缺点。

### 2. 分析热点风险

场景：社交网络，某名人百万粉丝。

分析哈希分片的热点风险，设计解决方案。

### 3. 设计图分片方案

场景：社交图，100万用户，每用户平均100朋友。

设计图分片方案，最小化跨节点边比例。

---

## 下一节

理解了分片策略后，我们来看容错机制：

[9.6 容错机制](06-fault-tolerance.md)
