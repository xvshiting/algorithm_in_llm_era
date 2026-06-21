# 9.3 共识与一致性：多个节点如何达成一致

> **核心问题**：多个节点如何在没有全局状态的情况下达成一致？

---

## 开场问题：分布式配置管理

你负责一个分布式系统，配置需要同步到100台机器。

**简单想法**：主节点修改配置，广播给所有节点。

**问题场景**：
```
时刻1：主节点修改配置为v2，准备广播
时刻2：主节点向节点1-50发送v2
时刻3：主节点网络故障，未向节点51-100发送
时刻4：节点1-50配置为v2，节点51-100配置为v1

结果：系统状态不一致，节点行为混乱
```

**困惑**：为什么"简单的广播"失效了？

**答案**：因为没有可靠的全局状态，节点可能收到不同的消息。

---

## 共识问题定义

### 形式定义

**共识问题**：n个节点，每个节点有初始值，需要达成一致的最终值。

**要求**：
1. **一致性**（Agreement）：所有正确节点达成相同值
2. **有效性**（Validity）：达成值是某个节点的初始值
3. **终止性**（Termination）：所有正确节点最终达成一致

### 挑战

**异步环境下不可能**（FLP不可能性定理）：

在完全异步模型下（无消息延迟上限、无时钟同步），即使只有一个节点可能失败，也不存在确定性共识算法。

**解决**：引入假设
- 部分同步：存在消息延迟上限
- 随机化：用随机算法绕过FLP
- 失败检测：假设能检测失败节点

---

## Paxos：经典共识算法

### 核心思想

**Paxos**：Leslie Lamport发明的经典共识算法。

核心思想：
- 多轮投票，多数同意即通过
- Proposer提议，Acceptor投票，Learner学习结果

### 三种角色

```
Proposer：提议者
  - 发起提案（提议某个值）
  - 向Acceptor发送Prepare和Accept请求

Acceptor：投票者
  - 接收Proposer的提案
  - 投票同意或拒绝

Learner：学习者
  - 从Acceptor获取结果
  - 学习达成一致的值
```

### 两阶段协议

```
阶段1：Prepare
  Proposer → Acceptor: Prepare(n)  # n是提案编号
  
  Acceptor收到Prepare(n):
    if n > 已承诺的最大编号:
      承诺不再接受编号<n的提案
      返回 Promise(n, 已接受的值)

阶段2：Accept
  Proposer收到多数Promise:
    if 收到的Promise有已接受的值:
      提议该值（尊重之前的决定）
    else:
      提议自己的值
    → Acceptor: Accept(n, 值)
  
  Acceptor收到Accept(n, 值):
    if n >= 已承诺的最大编号:
      接受该值
      返回 Accepted(n, 值)
```

### 类比：议会表决

想象议会投票：
- Proposer提出法案
- Acceptor是议员
- 多数议员同意 → 法案通过
- 如果两个Proposer同时提案 → 编号大的优先

---

## Raft：简化共识算法

### 为什么Raft更简单？

**Paxos的问题**：难理解、难实现。

**Raft的设计目标**：易于理解。

核心思想：
- 分解问题：领导者选举 + 日志复制 + 安全性
- 领导者驱动：简化决策流程

### 三种角色

```
Leader：领导者
  - 处理所有客户端请求
  - 向Follower发送日志

Follower：跟随者
  - 接收Leader的日志
  - 响应Leader的请求

Candidate：候选人
  - 选举时竞选Leader
```

### 领导者选举

```
超时触发选举：
  Follower未收到Leader心跳 → 被选举超时
  
  Candidate发起选举：
    1. 增加任期号
    2. 向所有节点请求投票
    3. 收到多数投票 → 成为Leader
    4. 开始发送心跳
```

### 日志复制

```
客户端请求 → Leader:
  1. Leader追加日志条目
  2. 向Follower发送AppendEntries RPC
  3. 等待多数Follower确认
  4. 应用日志到状态机
  5. 响应客户端
```

### 安全性保证

```
日志匹配性质：
  如果两个日志在同一任期、同一索引有相同条目
  → 它们之前的所有条目都相同

领导者完整性：
  新Leader必须包含所有已提交的日志
```

---

## 类比理解共识

### 团队决策类比

**共识像团队投票表决**：

```
场景：团队需要决定午餐吃什么

朴素方案：
  每人同时提议 → 可能多个提议同时存在
  → 混乱，无法决定

Paxos方案：
  某人提议（编号1）：吃火锅
  多数人同意 → 决定吃火锅
  
  某人提议（编号2）：吃日料
  多数人发现编号1已决定 → 遵守编号1的决定

Raft方案：
  先选组长 → 组长决定吃什么
  组员跟随组长 → 简单高效
```

### 为什么需要多数？

**原因**：少数节点可能失败或被隔离。

```
节点1-5：
  节点1-3同意值A → 达成一致
  节点4-5网络隔离 → 不知道结果
  但节点1-3占多数 → 值A已决定

如果节点4后来恢复：
  它发现多数已决定A → 遵守A
```

---

## 共识的应用场景

### 1. 分布式配置管理

```
配置更新：
  Leader接收配置修改请求
  → 复制到多数节点
  → 配置生效

好处：
  - 所有节点配置一致
  - 容错（少数节点失败不影响）
```

### 2. 分布式锁

```
锁服务：
  客户端请求锁 → Leader分配锁
  Leader记录锁状态 → 复制到多数节点
  锁被持有，其他客户端等待

好处：
  - 锁状态一致
  - 容错（Leader失败 → 选举新Leader）
```

### 3. 分布式事务

```
事务提交：
  节点执行事务 → 投票是否提交
  多数同意 → 事务提交
  否则 → 事务回滚

好处：
  - 所有节点事务状态一致
  - 容错
```

---

## 共识的成本

### 通信成本

每次共识需要：
- Proposer → Acceptor：发送Prepare
- Acceptor → Proposer：返回Promise
- Proposer → Acceptor：发送Accept
- Acceptor → Learner：返回Accepted

**轮数**：至少2轮

**消息数**：O(n²)（每个Proposer要联系所有Acceptor）

### 性能影响

共识成本高 → 不适合频繁操作。

**优化**：
- 批量共识：一次共识多个值
- Leader缓存：Leader直接处理，减少共识频率
- 异步共识：先执行，后台共识

---

## LLM视角：共识的应用

### LLM多Agent协作

**场景**：多个Agent协作完成复杂任务。

```
挑战：
  Agent A提议方案1
  Agent B提议方案2
  如何达成一致？

解决：
  用共识机制：
  - 某Agent作为Leader
  - 其他Agent跟随Leader决策
  - 容错：Leader失败 → 选举新Leader
```

### 分布式推理协调

**场景**：分布式推理需要协调各节点。

```
挑战：
  模型分布在多节点
  推理结果需要一致

解决：
  用共识保证：
  - 所有节点推理状态一致
  - 容错机制
```

---

## 小结

### 核心概念

| 概念 | 定义 | 作用 |
|------|------|------|
| **共识问题** | 多节点达成一致 | 保证系统一致性 |
| **Paxos** | 经典共识算法 | 多数投票机制 |
| **Raft** | 简化共识算法 | 领导者驱动，易理解 |
| **多数决策** | >半数节点同意 | 容错保证 |

### 设计要点

1. **领导者选举**：简化决策流程
2. **日志复制**：保证一致性
3. **多数决策**：容错保证
4. **成本权衡**：共识代价高，不适合频繁操作

### LLM视角

共识在LLM时代有新应用：
- 多Agent协作决策
- 分布式推理协调
- 分布式训练状态同步

---

## 练习

## Paxos 实现示例

### Python伪代码实现

```python
class PaxosNode:
    """Paxos节点实现（简化版）"""
    
    def __init__(self, node_id, acceptors):
        self.node_id = node_id
        self.acceptors = acceptors
        self.proposal_number = 0
        self.promised_number = 0
        self.accepted_value = None
        self.accepted_number = 0
    
    def propose(self, value):
        """提议者：发起提案"""
        self.proposal_number += 1
        n = (self.proposal_number, self.node_id)
        
        # 阶段1：Prepare
        promises = []
        for acceptor in self.acceptors:
            promise = acceptor.prepare(n)
            if promise:
                promises.append(promise)
        
        # 检查是否获得多数承诺
        if len(promises) < len(self.acceptors) // 2 + 1:
            return None  # 未获得多数，重试
        
        # 阶段2：Accept
        # 如果收到已接受的值，提议该值（尊重之前决定）
        proposed_value = value
        for promise in promises:
            if promise.accepted_value:
                proposed_value = promise.accepted_value
        
        # 发送Accept请求
        accepted = []
        for acceptor in self.acceptors:
            if acceptor.accept(n, proposed_value):
                accepted.append(acceptor)
        
        if len(accepted) >= len(self.acceptors) // 2 + 1:
            return proposed_value  # 达成共识
        return None
    
    def prepare(self, n):
        """接受者：处理Prepare请求"""
        if n > self.promised_number:
            self.promised_number = n
            return Promise(n, self.accepted_value, self.accepted_number)
        return None
    
    def accept(self, n, value):
        """接受者：处理Accept请求"""
        if n >= self.promised_number:
            self.promised_number = n
            self.accepted_number = n
            self.accepted_value = value
            return True
        return False


class Promise:
    """承诺响应"""
    def __init__(self, n, accepted_value, accepted_number):
        self.n = n
        self.accepted_value = accepted_value
        self.accepted_number = accepted_number
```

### Raft 实现示例

```python
import random
import time

class RaftNode:
    """Raft节点实现（简化版）"""
    
    def __init__(self, node_id, peers):
        self.node_id = node_id
        self.peers = peers
        self.state = "follower"  # follower, candidate, leader
        self.current_term = 0
        self.voted_for = None
        self.log = []
        self.commit_index = 0
        self.last_applied = 0
        self.election_timeout = random.randint(150, 300)  # ms
    
    def start_election(self):
        """发起选举"""
        self.state = "candidate"
        self.current_term += 1
        self.voted_for = self.node_id
        
        # 向所有peers请求投票
        votes = 1  # 自己投票
        for peer in self.peers:
            if peer.request_vote(self.current_term, self.node_id):
                votes += 1
        
        # 检查是否获得多数投票
        if votes > len(self.peers) // 2:
            self.state = "leader"
            self.send_heartbeat()
    
    def request_vote(self, term, candidate_id):
        """处理投票请求"""
        if term > self.current_term:
            self.current_term = term
            self.state = "follower"
            self.voted_for = None
        
        if term == self.current_term and (
            self.voted_for is None or self.voted_for == candidate_id
        ):
            self.voted_for = candidate_id
            self.reset_election_timeout()
            return True
        return False
    
    def send_heartbeat(self):
        """发送心跳"""
        if self.state == "leader":
            for peer in self.peers:
                peer.append_entries(self.current_term, self.log)
    
    def append_entries(self, term, leader_log):
        """处理日志追加请求"""
        if term >= self.current_term:
            self.current_term = term
            self.state = "follower"
            self.reset_election_timeout()
            return True
        return False
    
    def reset_election_timeout(self):
        """重置选举超时"""
        self.election_timeout = random.randint(150, 300)
```

---

## 共识失败案例分析

### 案例1：网络分区导致的脑裂

**场景**：5节点集群，节点1-2与节点3-5网络分区。

```
初始状态：
  节点1是Leader，任期1

分区发生：
  节点1-2无法联系节点3-5
  节点1心跳无法到达节点3-5

节点3-5触发选举：
  节点3发起选举 → 获得节点4-5投票（3票）
  节点3成为新Leader，任期2

脑裂状态：
  节点1-2认为节点1是Leader
  节点3-5认为节点3是Leader

问题：
  客户端写入节点1 → 只复制到节点2
  客户端写入节点3 → 只复制到节点4-5
  数据不一致！

解决（Raft机制）：
  节点1心跳失败 → 降级为follower
  节点1发现任期2更高 → 放弃Leader身份
  最终只有一个Leader
```

**教训**：网络分区是分布式系统的常见故障，共识算法需要能检测和处理。

### 案例2：提案编号冲突

**场景**：两个Proposer同时提案。

```
时刻1：Proposer A发起Prepare(n=1)
时刻2：Proposer B发起Prepare(n=2)
时刻3：Acceptor收到B的Prepare → 承诺n=2
时刻4：Acceptor收到A的Prepare → 拒绝（n=1 < n=2）

Proposer A的提案被拒绝：
  A需要重新发起更高编号的提案
  可能导致活锁（A和B不断竞争）

解决：
  随机延迟重试
  或使用唯一编号（如节点ID + 时间戳）
```

**教训**：多个Proposer同时提案会导致竞争，需要设计冲突解决机制。

### 案例3：Leader失败后的数据丢失

**场景**：Leader日志未完全复制就失败。

```
时刻1：Leader收到客户端请求，追加日志
时刻2：Leader向Follower发送AppendEntries
时刻3：只有Follower1收到日志（网络问题）
时刻4：Leader失败

新Leader选举：
  Follower2成为新Leader（日志较短）
  Follower1的额外日志被覆盖？

Raft机制保证：
  新Leader必须包含所有已提交日志
  未提交日志会被新Leader覆盖
  这是正确行为（未提交 = 不保证持久化）
```

**教训**：只有已提交（多数复制）的日志才能保证持久化。

---


### 1. 模拟Raft选举

场景：5个节点，节点1是Leader。

- 节点1网络故障 → 触发选举
- 模拟选举流程，谁会成为新Leader？

### 2. 分析共识成本

场景：100个节点，用Raft达成一次共识。

计算需要的消息数和轮数。

### 3. 设计多Agent共识

场景：3个Agent协作，需要决定执行哪个任务。

设计共识机制，保证Agent决策一致。

---

## 下一节

理解了共识机制后，我们来看一致性级别：

[9.4 一致性模型](04-consistency-models.md)
