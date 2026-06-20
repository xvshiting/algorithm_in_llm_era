# 2.7 优先队列与堆

## 学习目标

学完这一节，你能：

- 解释优先队列和普通队列的区别
- 识别"反复取最大或最小"这个问题信号
- 说清堆的不变量
- 使用 Python `heapq` 实现最小优先队列
- 分析 `heappush`、`heappop`、`heapify` 的复杂度
- 审查 agent 是否用重复排序代替了优先队列

---

## 不是谁先来，谁先处理

普通队列遵守先进先出。  
但很多任务不是按到达顺序处理，而是按优先级处理。

例如：

- 急诊先处理病情更重的人。
- 任务调度先处理截止时间更近的任务。
- 游戏中先处理发生时间最早的事件。
- 推荐系统中维护当前得分最高的前若干项。

这类结构叫**优先队列**：

```text
push(item, priority)：加入一个带优先级的元素
pop()：取出优先级最高或最低的元素
```

普通队列问："谁先来？"  
优先队列问："谁现在最重要？"

---

## 用列表重复排序的问题

agent 很容易写出这样的代码：

```python
def process_tasks(tasks):
    result = []
    while tasks:
        tasks.sort(key=lambda task: task["priority"])
        task = tasks.pop(0)
        result.append(handle(task))
    return result
```

每一轮都重新排序。若有 `n` 个任务，排序一次是 `O(n log n)`，重复很多轮，总成本会很高。

如果任务的模式是：

```text
反复加入元素
反复取出当前最小或最大元素
```

就应该想到优先队列。

---

## 堆：实现优先队列的常见结构

堆是一种用数组表示的树形结构。Python 的 `heapq` 默认是**最小堆**，也就是每次取出最小元素。

最小堆的不变量是：

```text
每个节点都不大于它的子节点。
```

这保证根位置是全局最小值。它不保证整个数组完全有序。

例如一个堆内部可能长这样：

```python
[1, 3, 2, 8, 5, 7]
```

它不是排序数组，但第一个元素一定是当前最小值。

---

## 堆如何放进数组

堆虽然可以画成树，但通常用数组保存。对于下标从 0 开始的数组：

```text
parent(i) = (i - 1) // 2
left(i)   = 2 * i + 1
right(i)  = 2 * i + 2
```

例如：

```text
index:  0  1  2  3  4  5
value: [1, 3, 2, 8, 5, 7]
```

下标 0 的孩子是 1 和 2，对应值 3 和 2；它们都不小于 1。  
下标 1 的孩子是 3 和 4，对应值 8 和 5；它们都不小于 3。

这个数组表示避免了显式节点和指针，所以堆通常实现得很紧凑。

---

## Python heapq

```python
import heapq

tasks = []

heapq.heappush(tasks, (3, "write report"))
heapq.heappush(tasks, (1, "fix production bug"))
heapq.heappush(tasks, (2, "reply email"))

priority, task = heapq.heappop(tasks)
print(task)  # fix production bug
```

复杂度：

| 操作 | 复杂度 |
|------|--------|
| 查看最小元素 `heap[0]` | `Θ(1)` |
| 插入 `heappush` | `O(log n)` |
| 取出最小 `heappop` | `O(log n)` |
| 把已有列表建成堆 `heapify` | `Θ(n)` |

为什么不是每次都排序？因为堆只维护"父节点不大于子节点"这个较弱的不变量。它不要求所有元素完全有序，所以维护成本更低。

---

## 插入和弹出如何维护不变量

`heappush` 的思路是：

1. 先把新元素放到数组末尾。
2. 如果它比父节点小，就和父节点交换。
3. 一直向上，直到堆不变量恢复。

最多向上走树高那么多步，所以是 `O(log n)`。

`heappop` 的思路是：

1. 取走根元素。
2. 把末尾元素放到根位置。
3. 如果它比某个孩子大，就和较小的孩子交换。
4. 一直向下，直到堆不变量恢复。

同样最多走树高那么多步，所以是 `O(log n)`。

这里的关键不是背代码，而是理解：堆每次只沿一条从叶到根或从根到叶的路径修复结构。

---

## 最大堆怎么办

`heapq` 是最小堆。如果要取最大优先级，可以把优先级取负：

```python
import heapq

scores = []
heapq.heappush(scores, (-95, "Alice"))
heapq.heappush(scores, (-88, "Bob"))
heapq.heappush(scores, (-99, "Chen"))

score, name = heapq.heappop(scores)
print(name, -score)  # Chen 99
```

如果优先级相同，还要考虑稳定性和比较规则。常见做法是加一个递增编号：

```python
import heapq

counter = 0
tasks = []

def add_task(priority, name):
    global counter
    heapq.heappush(tasks, (priority, counter, name))
    counter += 1
```

这样优先级相同时，先加入的任务会先出来。

---

## heapify 为什么是线性时间

如果已有一批元素：

```python
items = [(3, "A"), (1, "B"), (2, "C")]
heapq.heapify(items)
```

`heapify` 可以在线性时间 `Θ(n)` 内建堆。

直觉是：堆底部有很多节点，但它们需要下沉的距离很短；堆顶部节点少，虽然下沉距离可能长。把所有节点的工作加起来，是线性的。

这个结论比"把 n 个元素一个个 heappush"更强。一个个插入是 `O(n log n)`，`heapify` 是 `Θ(n)`。

---

## 三种 top-k 方案

很多排行榜和推荐任务都在问 top-k。不同规模下，方案不同。

| 方案 | 复杂度 | 适合场景 |
|------|--------|----------|
| 全量排序 | `O(n log n)` | `k` 接近 `n`，或还需要完整排序 |
| 大小为 `k` 的堆 | `O(n log k)` | `k` 远小于 `n` |
| 扫描维护当前最佳 | `O(n)` | 只需要最大或最小 1 个 |

所以看到"取前 10 个"时，不要自动排序全部数据。先问：

```text
n 多大？
k 多大？
数据是一次性给出，还是流式到达？
是否需要完整排序，还是只要前 k 个？
```

这正是 agent 容易忽略的取舍。

---

## 用本节知识解决：紧急问题优先

课堂系统里，普通问题按提交顺序处理。但老师可能把某些问题标为紧急：

> 紧急问题优先；同样紧急程度下，先提交的先处理。

这已经不是普通队列。普通队列只看到达顺序，不看优先级。我们可以用堆保存待处理问题：

```python
import heapq

pending_questions = []
counter = 0

def add_question(question_id, priority):
    global counter
    heapq.heappush(pending_questions, (-priority, counter, question_id))
    counter += 1

def next_question():
    if not pending_questions:
        return None
    priority, _, question_id = heapq.heappop(pending_questions)
    return question_id
```

这里有三个细节：

1. `heapq` 是最小堆，所以用 `-priority` 让高优先级先出来。
2. `counter` 用来处理同优先级时的先后顺序。
3. 堆里保存的是问题 id，不一定保存完整问题对象；完整对象可以放在 `questions_by_id` 字典里。

为什么不每次排序？

如果每次老师要处理一个问题时都重新排序全部待处理问题，就会重复做大量工作。堆只维护"下一个该处理的问题在顶部"，不维护完整排序，因此更适合不断加入、不断取出的场景。

这就是数据结构的专业取舍：需求不是"我要排序"，而是"我反复要下一个最高优先级元素"。

---

## 审查 agent 输出

假设 agent 写了排行榜维护：

```python
def top_k(items, k):
    selected = []
    for _ in range(k):
        items.sort(key=lambda item: item.score, reverse=True)
        selected.append(items.pop(0))
    return selected
```

审查问题：

1. 为什么每轮都排序？
2. 如果只要前 `k` 个，是否可以用堆维护候选？
3. `items` 是否会被函数破坏？
4. `k` 相对 `n` 是很小还是接近 `n`？
5. 是否需要稳定处理相同分数？

如果 `k` 很小，可以考虑维护大小为 `k` 的最小堆。Python 标准库也提供了：

```python
import heapq

top = heapq.nlargest(k, items, key=lambda item: item.score)
```

选择不只看大 O，还看 `k` 和 `n` 的关系、是否破坏原数据、代码可读性和库函数可靠性。

---

## 本节要点

- 优先队列按优先级取元素，不按到达顺序。
- 堆是实现优先队列的常见结构。
- 最小堆只保证父节点不大于子节点，不要求整体有序。
- Python `heapq` 提供 `heappush`、`heappop`、`heapify`。
- 反复取最小或最大时，要警惕 agent 每轮重新排序。

---

## 课堂练习

下面代码每次处理截止时间最早的任务：

```python
def run(tasks):
    while tasks:
        tasks.sort(key=lambda task: task.deadline)
        task = tasks.pop(0)
        execute(task)
```

请回答：

1. 它的主要低效在哪里？
2. 如果运行中还会不断加入新任务，为什么排序列表不方便？
3. 如何用 `heapq` 改写？
4. 如果两个任务截止时间相同，如何保持先加入的先处理？

---

## 课后测验

<Quiz src="/quizzes/ch02-07.json" />

---

**上一节：[2.6 树与有序结构](/chapters/ch02/06-tree-ordered-structure)**

**下一节：[2.8 并查集](/chapters/ch02/08-union-find)**
