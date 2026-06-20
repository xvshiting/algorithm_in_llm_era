# 2.5 集合与字典：哈希表

## 学习目标

学完这一节，你能：

- 解释集合和字典解决的核心问题
- 使用 Python `set` 做去重和成员查询
- 使用 Python `dict` 做键值映射和计数
- 说清哈希表为什么通常能快速查找
- 区分期望 `Θ(1)` 和最坏情况
- 审查 agent 是否用列表做了本该用哈希表的查询

---

## 从查电话开始

如果你有一张通讯录：

```text
Alice -> 138...
Bob   -> 139...
Chen  -> 136...
```

你真正想做的操作不是"保存一堆字符串"，而是：

```text
给我一个名字，快速找到电话。
```

这就是字典的核心接口：

```text
put(key, value)：保存键值对
get(key)：根据 key 找 value
contains(key)：判断 key 是否存在
```

Python 的 `dict` 就是这种结构：

```python
phone = {}
phone["Alice"] = "13800000000"
phone["Bob"] = "13900000000"

print(phone["Alice"])
```

如果只需要判断元素是否存在，不需要关联 value，就用 `set`：

```python
students = {"Alice", "Bob", "Chen"}

if "Bob" in students:
    print("Bob is here")
```

---

## 列表查询为什么慢

先看一个去重函数：

```python
def unique_names(names):
    result = []
    for name in names:
        if name not in result:
            result.append(name)
    return result
```

`name not in result` 会逐个比较。最坏情况下，越到后面，`result` 越长，检查越慢。

改用集合：

```python
def unique_names(names):
    seen = set()
    result = []

    for name in names:
        if name not in seen:
            seen.add(name)
            result.append(name)

    return result
```

这里用两个结构：

- `seen` 负责快速判断是否见过。
- `result` 负责保持第一次出现的顺序。

这就是数据结构组合：一个结构不一定满足所有需求。

---

## 哈希表的基本思想

哈希表的直觉是：

> 用一个函数把 key 转成位置，让查找直接跳到可能的位置。

大致过程：

```text
key -> hash(key) -> bucket index -> bucket
```

如果两个不同 key 被分到同一个位置，就发生**冲突**。冲突不是 bug，而是哈希表必须处理的正常情况。

常见处理方式有两类：

- 每个位置放一个小链表或小列表，冲突元素都放进去。
- 发现位置被占用，就按某种规则找下一个空位。

Python 的 `dict` 和 `set` 实现细节更复杂，但初学时先抓住两个事实：

1. 哈希表用额外空间换取快速查找。
2. 它的 `Θ(1)` 通常是期望意义，不是数学上永远最坏 `Θ(1)`。

---

## 哈希函数要满足什么

一个适合哈希表的哈希函数，至少要接近满足三点：

| 要求 | 含义 | 如果做不好会怎样 |
|------|------|------------------|
| 确定性 | 同一个 key 每次得到同一个哈希值 | 找不到已插入的元素 |
| 分布均匀 | 不同 key 尽量分散到不同位置 | 冲突过多，退化变慢 |
| 计算便宜 | 计算哈希值本身不能太贵 | 查找还没开始就很慢 |

Python 要求放入 `set` 或作为 `dict` key 的对象是**可哈希的**。常见可哈希对象包括数字、字符串、元组；列表和字典通常不可哈希，因为它们是可变对象。

```python
seen = set()
seen.add(("Alice", 18))  # 可以，元组不可变
seen.add(["Alice", 18])  # TypeError，列表可变
```

可变对象如果作为 key，内容变了以后哈希位置也可能变化，表就无法可靠找到它。这不是 Python 的小细节，而是哈希表契约的要求。

---

## 冲突处理：冲突不是异常

哈希表位置有限，可能的 key 几乎无限，所以冲突不可避免。专业讨论哈希表时，必须说明如何处理冲突。

一种直观方式是**链式处理**：每个桶里放一个小列表。

```text
bucket 0: []
bucket 1: [("Alice", 90), ("Chen", 97)]
bucket 2: [("Bob", 85)]
```

查找 `Chen` 时，先算出桶位置，再在桶内查找。如果哈希函数分布好、装载因子受控，桶通常很短。

另一类方式是**开放寻址**：如果目标位置被占用，就按某种规则继续找下一个位置。它节省指针结构，但删除和高装载因子下的性能会更微妙。

本节不要求实现工业级哈希表，但要形成判断：

```text
哈希表快，不是因为没有冲突；
而是因为设计让冲突数量可控。
```

---

## 装载因子：桌子太满就慢

如果哈希表位置很多，元素很少，冲突就少。  
如果位置快被填满，冲突就多，查找会变慢。

**装载因子**可以先理解为：

```text
元素数量 / 桶的数量
```

当装载因子过高时，哈希表需要扩容，申请更大的空间，并重新安排已有元素。

这也是为什么哈希表很快，但不是免费的：

- 它需要额外空间。
- 它可能扩容。
- 它依赖 key 可以被哈希。
- 它通常不负责按大小顺序遍历。

---

## 集合、字典和符号表

很多算法教材会把 `dict` 这种结构称为**符号表**：保存 key-value 对，并支持按 key 查询。

| 抽象接口 | Python 结构 | 典型用途 |
|----------|-------------|----------|
| 集合 | `set` | 去重、成员查询、交并差 |
| 字典 / 符号表 | `dict` | id 到对象、词到次数、名字到记录 |

集合操作也很重要：

```python
registered = {"Alice", "Bob", "Chen"}
submitted = {"Bob", "Dora"}

both = registered & submitted      # 同时满足
either = registered | submitted    # 至少出现一次
missing = registered - submitted   # 注册但未提交
```

这类集合运算常常比手写双层循环更清楚，也更不容易出错。

---

## Python 中的常用写法

### 判断是否有重复

```python
def has_duplicate(items):
    seen = set()
    for item in items:
        if item in seen:
            return True
        seen.add(item)
    return False
```

### 统计词频

```python
def count_words(words):
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    return counts
```

### 建立按 id 查询的索引

```python
def index_by_id(users):
    table = {}
    for user in users:
        table[user["id"]] = user
    return table
```

这些代码的共同点是：问题信号里出现了"是否出现过"、"按 key 查找"、"统计次数"、"去重"。

看到这些信号，就应该想到 `set` 或 `dict`。

---

## 复杂度表

在正常哈希分布和装载因子受控的前提下，可以把常见操作理解为：

| 操作 | `set` 写法 | `dict` 写法 | 典型复杂度 |
|------|------------|-------------|------------|
| 插入 | `s.add(x)` | `d[key] = value` | 期望 `Θ(1)` |
| 查询 | `x in s` | `key in d` | 期望 `Θ(1)` |
| 取值 | 不适用 | `d[key]` 或 `d.get(key)` | 期望 `Θ(1)` |
| 删除 | `s.remove(x)` | `del d[key]` | 期望 `Θ(1)` |
| 遍历全部 | `for x in s` | `for key in d` | `Θ(n)` |
| 复制 | `s.copy()` | `d.copy()` | `Θ(n)` |

这里的"期望"很重要。它来自哈希分布和冲突控制，不是每次操作的最坏保证。

---

## 哈希表不适合什么

哈希表不适合所有问题。

如果你需要：

- 按大小顺序遍历
- 找最大、最小、前驱、后继
- 做范围查询，例如找 80 到 90 分之间的所有人
- 保存不可哈希的 key，例如可变列表

那哈希表可能不是完整答案。

例如：

```python
scores = {"Alice": 90, "Bob": 85, "Chen": 97}
```

它很适合按姓名查分数，不适合快速找"分数在 90 以上的人"。后者需要额外结构，或者每次遍历全部数据。

---

## 用本节知识解决：签到、计数和快速定位

在线课堂系统里，哈希表会反复出现。

### 1. 判断学生是否在课堂

```python
active_students = set()

def join(student_id):
    if student_id in active_students:
        return False
    active_students.add(student_id)
    return True
```

这里 `set` 对应的是"是否已经加入"。如果用列表，学生越多，每次加入前检查是否重复就越慢。

### 2. 按学生统计提问次数

```python
question_count = {}

def record_question(student_id):
    question_count[student_id] = question_count.get(student_id, 0) + 1
```

这里 `dict` 对应的是"学生 id -> 提问次数"。

### 3. 按问题 id 找问题内容

```python
questions_by_id = {}

def save_question(question_id, question):
    questions_by_id[question_id] = question

def get_question(question_id):
    return questions_by_id.get(question_id)
```

这里 `dict` 对应的是"问题 id -> 问题对象"。

这三个例子很像，但接口不同：

| 需求 | 结构 | 为什么 |
|------|------|--------|
| 判断是否存在 | `set` | 不需要 value |
| 统计次数 | `dict` | key 对应计数 |
| 根据 id 找对象 | `dict` | key 对应完整记录 |

这比"哈希表很快"更具体。你要能说出：到底是哪一个操作需要它快。

---

## 审查 agent 输出

假设 agent 写了：

```python
def find_user(users, target_id):
    for user in users:
        if user["id"] == target_id:
            return user
    return None
```

这段代码不一定错。关键看调用方式。

如果只查一次，线性扫描可能够用。  
如果要查 10 万次，每次都扫 10 万用户，就会非常慢。

更合适的方案可能是先建索引：

```python
users_by_id = {user["id"]: user for user in users}

def find_user(target_id):
    return users_by_id.get(target_id)
```

审查问题：

1. 查询是一次，还是反复很多次？
2. 数据会不会频繁更新？
3. 是否需要额外空间保存索引？
4. `id` 是否唯一？
5. 查询不存在时应该返回什么？

---

## Agent 审查：哈希表四问

当 agent 推荐或没有推荐哈希表时，至少问四个问题：

1. 这里的高频操作是不是成员查询或 key-value 查询？
2. key 是否唯一、稳定、可哈希？
3. 是否需要保留顺序、范围查询或最大最小值？
4. 额外空间和维护索引的一致性是否可接受？

例如，一个商品系统可能同时需要：

```python
products_by_id = {}      # id -> product
product_ids_by_tag = {}  # tag -> set(id)
```

这能加速按 id 查商品和按标签筛选，但它也带来一致性责任：商品改标签时，两个结构都要更新。Agent 如果只写添加逻辑，不写更新和删除逻辑，就没有真正完成数据结构设计。

---

## 本节要点

- `set` 适合去重和成员查询。
- `dict` 适合按 key 查找 value，也叫键值映射。
- 哈希表用额外空间换取快速查询。
- 哈希表的常数级查询通常是期望意义，不是绝对最坏保证。
- Agent 常见错误是用列表反复做成员查询或按 id 查找。

---

## 课堂练习

下面代码用于判断两个名单是否有共同学生：

```python
def has_common(a, b):
    for x in a:
        if x in b:
            return True
    return False
```

请回答：

1. 如果 `b` 是普通列表，最坏复杂度是多少？
2. 如何改写使它更适合大名单？
3. 改写后额外空间是多少？
4. 如果名单元素是字典，能直接放进 `set` 吗？为什么？
5. 你会怎样要求 agent 解释它的复杂度？

---

## 课后测验

<Quiz src="/quizzes/ch02-05.json" />

---

**上一节：[2.4 栈与队列](/chapters/ch02/04-stack-queue)**

**下一节：[2.6 树与有序结构](/chapters/ch02/06-tree-ordered-structure)**
