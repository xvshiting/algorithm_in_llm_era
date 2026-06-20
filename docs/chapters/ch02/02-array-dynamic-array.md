# 2.2 数组与动态数组

## 学习目标

学完这一节，你能：

- 解释数组为什么能用下标快速访问
- 说清 Python `list` 更接近动态数组
- 分析访问、遍历、末尾追加、中间插入、头部删除的复杂度
- 识别 agent 使用 `list.pop(0)`、频繁中间插入等隐藏成本
- 区分单次最坏代价和摊还代价

---

## 书架上的连续编号

想象一排书架，每个格子都有编号：

```text
0   1   2   3   4
[A] [B] [C] [D] [E]
```

如果你要找第 3 个格子，不需要从头数到尾。只要知道起点位置和每个格子的宽度，就能直接跳到目标位置。

数组的核心直觉就是这个：

> 元素连续存放，位置可以由下标计算出来。

因此，按下标访问通常是 `Θ(1)`：

```python
scores = [90, 85, 100, 76]
third = scores[2]  # 直接访问下标 2
```

这里的 `Θ(1)` 不是说运行时间一定等于 1 纳秒，而是说访问第 1 个元素和第 100 万个元素，在增长量级上不依赖 `n`。

---

## Python list 是动态数组

Python 的 `list` 不是链表。它更接近**动态数组**。

动态数组的特点是：

- 元素按顺序存放
- 逻辑长度和底层容量可以不同
- 支持按下标快速访问
- 容量不够时，会申请更大的连续空间，并把旧元素搬过去
- 末尾追加通常很快，但偶尔会触发扩容

可以把动态数组想成两层概念：

```text
length：当前有多少个有效元素
capacity：底层已经预留了多少个位置
```

当 `length < capacity` 时，`append` 只是在下一个空位写入元素。  
当 `length == capacity` 时，`append` 需要扩容，旧元素要复制到新空间。

常见操作复杂度：

| 操作 | Python 写法 | 复杂度 |
|------|-------------|--------|
| 按下标访问 | `items[i]` | `Θ(1)` |
| 修改某个位置 | `items[i] = x` | `Θ(1)` |
| 遍历全部元素 | `for x in items` | `Θ(n)` |
| 末尾追加 | `items.append(x)` | 摊还 `Θ(1)` |
| 末尾删除 | `items.pop()` | `Θ(1)` |
| 中间插入 | `items.insert(i, x)` | `Θ(n)` |
| 头部删除 | `items.pop(0)` | `Θ(n)` |
| 判断是否存在 | `x in items` | `Θ(n)` |
| 复制列表 | `items.copy()` 或 `items[:]` | `Θ(n)` |
| 切片 | `items[a:b]` | `Θ(b-a)` |
| 拼接生成新列表 | `a + b` | `Θ(len(a)+len(b))` |

最容易被忽略的是中间插入和头部删除。因为数组要保持连续，插入或删除后，后面的元素需要移动。

---

## 成本模型：移动元素也是成本

分析数组时，常见基本操作有两类：

1. 访问或写入某个位置。
2. 移动一段连续元素。

第一类通常是常数级，第二类取决于移动多少个元素。

例如：

```python
items = [10, 20, 30, 40, 50]
items.insert(1, 15)
```

插入位置后面的 `20, 30, 40, 50` 都要向后移动。这里移动 4 个元素。

如果插入位置是随机的，平均也要移动大约一半元素；如果总是在头部插入，就每次移动几乎全部元素。

所以专业分析不能只看"调用了一个方法"。你要问：

```text
这个方法背后有没有移动元素？
移动数量和 n 的关系是什么？
这件事会发生一次，还是发生 n 次？
```

---

## 为什么 `pop(0)` 慢

看这段队列代码：

```python
tasks = []

def enqueue(task):
    tasks.append(task)

def dequeue():
    return tasks.pop(0)
```

`append` 没问题，末尾追加通常很快。问题在 `pop(0)`。

删除第 0 个元素后，原来第 1 个元素要搬到第 0 个位置，第 2 个搬到第 1 个位置，后面所有元素都要左移。

如果队列里有 `n` 个任务，一次 `pop(0)` 是 `Θ(n)`。如果连续处理 `n` 个任务，总成本会接近：

```text
n + (n - 1) + (n - 2) + ... + 1 = Θ(n²)
```

这类代码很常见，也很容易被 agent 写出来。它能通过小样例，但规模一大就会慢。

正确的 Python 队列通常用 `collections.deque`：

```python
from collections import deque

tasks = deque()

def enqueue(task):
    tasks.append(task)

def dequeue():
    return tasks.popleft()
```

`deque` 支持头尾快速加入和移除。后面讲队列时会更系统地看它。

---

## 中间插入为什么慢

假设数组里有 5 个元素：

```text
[A, B, C, D, E]
```

现在要在下标 2 插入 `X`：

```text
[A, B, X, C, D, E]
```

为了给 `X` 腾位置，`C`、`D`、`E` 都要向后移动。移动的数量取决于插入位置后面有多少元素，最坏就是 `Θ(n)`。

Python 代码：

```python
items.insert(2, "X")
```

这行看起来只有一次调用，但背后可能移动很多元素。

这正是数据结构分析的重点：**一行代码不等于一次基本操作。**

---

## 数组的优势：缓存友好和实现简单

数组不只是"下标访问快"。连续存储还有一个工程优势：现代计算机读内存时，通常会把相邻位置一起读进缓存。顺序遍历数组时，硬件很容易预测接下来要访问的位置。

这就是为什么在很多真实程序里，即使链表理论上支持 `Θ(1)` 插入，数组仍然常常更快。复杂度分析告诉我们增长趋势，工程实现还要考虑常数、缓存和语言运行时成本。

在本教材里，我们先用渐近复杂度建立判断框架，再在必要处提醒这些工程因素。不要反过来：不能因为某次实验数组更快，就否认链表的理论性质；也不能因为链表某个操作是 `Θ(1)`，就忽略它在 Python 中的对象和引用开销。

---

## 数组适合什么

数组或动态数组适合：

- 按下标快速访问
- 顺序遍历
- 主要在末尾追加
- 数据量较小，或者中间插入删除不频繁
- 需要紧凑存储和较好的缓存局部性

不适合：

- 频繁在头部插入或删除
- 频繁在中间插入或删除
- 大量判断某个元素是否存在
- 需要按优先级反复取最大或最小

最后两点不是数组不能做，而是做得不够快。比如 `x in items` 可以判断存在，但它要逐个看。大量成员查询应该考虑 `set` 或 `dict`。

---

## 用本节知识解决：课堂问题记录

在线课堂系统里，每次学生提问，都要把问题保存下来，课后按提交顺序导出。

这个子需求非常适合动态数组：

```python
questions = []

def ask(student_id, text):
    question = {
        "student_id": student_id,
        "text": text,
        "status": "open",
    }
    questions.append(question)
    return len(questions) - 1
```

为什么这里 `list` 合适？

1. 问题记录主要是追加到末尾。
2. 课后导出需要按提交顺序遍历。
3. 用返回的下标可以作为一个简单的问题编号。
4. 不需要频繁在中间插入。

如果老师要导出全部问题：

```python
def export_questions():
    return questions.copy()
```

这里 `copy()` 是 `Θ(n)`。这不是坏事，因为导出本来就要输出 `n` 条记录。但如果 agent 在每次提问后都复制一遍完整列表，那就会变成隐藏成本。

```python
def ask_bad(student_id, text):
    questions.append({"student_id": student_id, "text": text})
    return questions.copy()  # 每次提交都复制全部历史
```

如果有 `n` 次提问，这种写法的复制成本会接近：

```text
1 + 2 + 3 + ... + n = Θ(n²)
```

同一个 `list.copy()`，放在"课后导出一次"和"每次提问都执行"里，意义完全不同。数据结构分析必须放回使用场景。

---

## 审查 agent 输出

假设 agent 生成了下面代码，用于处理消息：

```python
def process_messages(messages):
    processed = []
    while messages:
        msg = messages.pop(0)
        processed.append(handle(msg))
    return processed
```

你应该问：

1. `messages` 是普通 `list` 吗？
2. `pop(0)` 会不会导致每次都移动剩余元素？
3. 如果消息数量是 10 万，总代价是多少？
4. 是否应该改用 `deque`？
5. 如果不需要真的删除，只是按顺序处理，能否直接遍历？

如果只是处理每条消息，不需要改变原列表，可以写成：

```python
def process_messages(messages):
    processed = []
    for msg in messages:
        processed.append(handle(msg))
    return processed
```

如果确实需要队列语义，就用 `deque`：

```python
from collections import deque

def process_messages(messages):
    queue = deque(messages)
    processed = []
    while queue:
        msg = queue.popleft()
        processed.append(handle(msg))
    return processed
```

审查的重点不是"这段代码能不能跑"，而是它的隐藏成本是否符合规模要求。

---

## Agent 生成 list 代码时的检查清单

看到 agent 使用 `list`，至少检查下面几件事：

| 检查点 | 风险信号 | 可能替代 |
|--------|----------|----------|
| 是否频繁 `pop(0)` | 队列被写成头部删除 | `collections.deque` |
| 是否频繁 `insert(0, x)` | 头部插入导致移动元素 | `deque.appendleft` |
| 是否大量 `x in items` | 反复线性查找 | `set` 或 `dict` |
| 是否每轮复制切片 | 隐藏 `Θ(n)` 复制 | 用下标范围或迭代器 |
| 是否每次重新排序 | 把维护问题写成重复排序 | 有序结构或堆 |
| 是否修改了输入列表 | 调用者可能不希望原数据被破坏 | 复制或返回新结构 |

这张表不要求你每次都换结构。它要求你能说明：为什么这里的 `list` 成本可以接受。

---

## 本节要点

- 数组的优势是按下标 `Θ(1)` 访问和顺序遍历。
- Python `list` 是动态数组，不是链表。
- `append` 通常很快，但严格说是摊还 `Θ(1)`。
- `insert(i, x)`、`pop(0)`、`x in list` 都可能是 `Θ(n)`。
- Agent 生成列表代码时，重点检查是否隐藏了移动元素或线性查找。

---

## 课堂练习

下面代码要维护最近 1000 条日志：

```python
logs = []

def add_log(line):
    logs.insert(0, line)
    if len(logs) > 1000:
        logs.pop()
```

请回答：

1. 这段代码每次新增日志的主要成本在哪里？
2. 如果每秒新增 5000 条日志，是否合适？
3. 有没有更适合的 Python 结构？
4. 你会怎样提示 agent 修改它？

---

## 课后测验

<Quiz src="/quizzes/ch02-02.json" />

---

**上一节：[2.1 抽象数据类型与操作契约](/chapters/ch02/01-adt-operation-contract)**

**下一节：[2.3 链表](/chapters/ch02/03-linked-list)**
