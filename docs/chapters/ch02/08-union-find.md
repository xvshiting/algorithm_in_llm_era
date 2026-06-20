# 2.8 并查集：合并集合与连通关系

## 学习目标

学完这一节，你能：

- 解释并查集解决的核心问题
- 使用 `find` 和 `union` 两个操作维护动态分组
- 理解路径压缩和按大小合并为什么能让操作接近常数时间
- 用 Python 写出并查集的基本实现
- 审查 agent 是否把连通关系写成了反复扫描或重复建图

---

## 现实问题：谁和谁属于同一组

在线课堂系统里，老师临时把学生分成若干讨论组。系统需要支持：

```text
merge(a, b)：把学生 a 和学生 b 所在的小组合并
same_group(a, b)：判断 a 和 b 是否已经在同一组
```

这个需求看起来可以用很多方式做。

最直接的办法是给每个学生保存一个组号：

```python
group = {
    "Alice": 1,
    "Bob": 2,
    "Chen": 1,
}
```

判断是否同组很快：

```python
group[a] == group[b]
```

但如果要合并两个组，就要把其中一个组的所有成员都改成另一个组号。学生很多时，这一步可能要扫描全部人。

我们需要一种结构，让"合并集合"和"判断是否同组"都快。这就是并查集。

---

## 并查集的两个操作

并查集，也叫 disjoint set union，维护的是一批互不重叠的集合。

它只承诺两个核心操作：

```text
find(x)：找到 x 所在集合的代表
union(a, b)：把 a 和 b 所在集合合并
```

判断是否同组可以写成：

```python
find(a) == find(b)
```

这里的"代表"不是业务上的组长，只是数据结构内部选出的标识。只要同一组元素最终找到同一个代表，就能判断它们属于同一集合。

---

## 用树表示集合

并查集常用一片树来表示集合。每个元素指向自己的父节点，根节点指向自己。

```text
Alice -> Chen -> Chen
Bob   -> Bob
Dora  -> Chen
```

这个例子里，`Alice` 和 `Dora` 最终都指向 `Chen`，所以它们在同一组；`Bob` 指向自己，是另一个组。

Python 可以用字典表示父节点：

```python
parent = {
    "Alice": "Chen",
    "Bob": "Bob",
    "Chen": "Chen",
    "Dora": "Chen",
}
```

`find` 沿着父节点一直走到根：

```python
def find(x):
    while parent[x] != x:
        x = parent[x]
    return x
```

如果树很高，`find` 会变慢。并查集的精妙之处，就在于让树一直很矮。

---

## 路径压缩

路径压缩的想法很朴素：

> 既然我已经沿路找到了根，那就顺手把路上的节点都直接挂到根下面。

递归写法：

```python
def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])
    return parent[x]
```

第一次查找可能走了几步，但之后同一路径上的节点就会更接近根。这个结构会在使用中自动变平。

---

## 按大小合并

如果每次合并都随便把一棵树挂到另一棵树下面，可能形成很高的树。一个简单策略是：

> 总是把小树挂到大树下面。

```python
parent = {}
size = {}

def make_set(x):
    parent[x] = x
    size[x] = 1

def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])
    return parent[x]

def union(a, b):
    root_a = find(a)
    root_b = find(b)
    if root_a == root_b:
        return False

    if size[root_a] < size[root_b]:
        root_a, root_b = root_b, root_a

    parent[root_b] = root_a
    size[root_a] += size[root_b]
    return True
```

`union` 返回 `False` 表示两个元素本来就在同一组，没有真的合并。

---

## 复杂度直觉

路径压缩 + 按大小合并之后，并查集的单次操作在实际规模下几乎可以看作常数时间。

更严格地说，`m` 次操作的总时间是：

```text
O(m α(n))
```

这里的 `α(n)` 是一个增长极慢的函数。对任何现实规模的数据，它都可以当成不超过一个很小的常数。

本章不要求推导这个界。你要掌握的是：

- 没有优化的并查集可能形成高树。
- 路径压缩让查找路径变短。
- 按大小合并避免小树被大树反复压在下面。
- 两者结合后，连续操作非常快。

---

## 用本节知识解决：课堂分组

```python
students = ["Alice", "Bob", "Chen", "Dora"]

for student in students:
    make_set(student)

union("Alice", "Chen")
union("Bob", "Dora")

print(find("Alice") == find("Chen"))  # True
print(find("Alice") == find("Bob"))   # False
```

如果老师临时说：

> 把 Alice 那组和 Bob 那组合并。

只要：

```python
union("Alice", "Bob")
```

不需要扫描所有学生，也不需要更新每个成员的组号。

这就是并查集的结构信号：

```text
对象被分成若干组；
组会不断合并；
经常要问两个对象是否同组。
```

---

## 审查 agent 输出

假设 agent 写了：

```python
def merge_groups(group, a, b):
    old = group[b]
    new = group[a]
    for student in group:
        if group[student] == old:
            group[student] = new
```

这段代码不一定永远错。如果学生很少，组也很少，它简单直接。但如果合并操作很多，每次都扫描全部学生，就可能很慢。

你应该追问：

1. 学生数量有多大？
2. 合并操作有多少次？
3. 查询是否同组有多少次？
4. 组是否只会合并，不会拆分？
5. 如果只合并不拆分，是否应该用并查集？

并查集适合"只合并，不拆分"。如果系统还要支持把某个学生从组里移出，问题就更复杂，并查集不是完整答案。

---

## 本节要点

- 并查集维护一批互不重叠的集合。
- 核心操作是 `find` 和 `union`。
- 判断是否同组，就是比较两个元素的代表是否相同。
- 路径压缩和按大小合并让连续操作几乎是常数时间。
- 并查集适合不断合并集合，不适合频繁拆分集合。
- 审查 agent 时，要看它是否把大量合并写成了反复全量扫描。

---

## 课堂练习

一个社团系统需要维护学生社群：

```text
connect(a, b)：记录 a 和 b 认识，两个社群合并
same_community(a, b)：判断 a 和 b 是否在同一社群
```

请回答：

1. 为什么用组号字典可能导致合并很慢？
2. 并查集的 `find` 返回什么？
3. 路径压缩改变了什么？
4. 如果系统还要支持"把 a 从社群中移除"，并查集是否仍然直接适用？
5. 写一段提示词，让 agent 比较组号扫描方案和并查集方案。

---

## 课后测验

<Quiz src="/quizzes/ch02-08.json" />

---

**上一节：[2.7 优先队列与堆](/chapters/ch02/07-priority-queue-heap)**

**下一节：[2.9 摊还分析](/chapters/ch02/09-amortized-analysis)**
