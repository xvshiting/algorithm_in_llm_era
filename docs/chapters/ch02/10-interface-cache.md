# 2.10 从接口到缓存：数据结构如何连接 Agent 时代

## 学习目标

学完这一节，你能：

- 解释为什么数据结构的接口思想会延伸到 API、prompt 和 skill
- 用缓存视角重新理解动态数组、哈希表、DP 记忆化和 KV-cache
- 区分"存数据"和"存中间结果"
- 审查 agent 是否遗漏了缓存的一致性、失效和空间代价
- 为一个 coding agent 任务设计结构化输入输出契约

---

## 这章真正讲的不是容器

第二章表面上讲了很多结构：

```text
list / linked list / stack / queue / set / dict / tree / heap / union-find
```

但更深的一条线是：

> 把混乱的数据和操作，组织成可预测、可组合、可审查的接口。

这和 coding agent 时代的工作方式直接相连。

如果你给 agent 的提示词是：

> 帮我写一个课堂互动系统。

它得到的是一个模糊任务。

如果你给它的是：

```text
数据结构选择卡：
- 学生集合：支持 join、contains
- 问题记录：支持 append、export
- 普通问题队列：支持 enqueue、dequeue
- 紧急问题堆：支持 push、pop_highest_priority
- 学生提问计数：支持 increment、get

请分别实现这些接口，并说明每个操作的复杂度和不变量。
```

这就像给程序设计 API。接口越清楚，agent 输出越容易被检查。

---

## API、Prompt、Skill 是同一类思想

传统数据结构的 API 规定：

```text
push(x)
pop()
is_empty()
```

一个好的 prompt 也应该规定：

```text
输入格式是什么？
输出格式是什么？
不能做什么？
需要解释哪些取舍？
如何报告不确定性？
```

一个 agent skill 更像一个可复用模块：

```text
输入：任务描述 + 操作需求表 + 规模约束
处理：推荐数据结构，生成复杂度表，指出风险
输出：选择卡 + 审查清单 + 待澄清问题
```

所以，数据结构的抽象接口不是旧知识。它是现代工具协作的基础。

---

## 缓存：把已经算过的东西存下来

数据结构不只保存原始数据，也可以保存中间结果。

例如学生提问计数：

```python
questions = []
question_count = {}

def ask(student_id, text):
    questions.append({"student_id": student_id, "text": text})
    question_count[student_id] = question_count.get(student_id, 0) + 1
```

`questions` 保存原始记录。  
`question_count` 保存派生结果，也就是缓存。

如果没有 `question_count`，每次查询某学生问了多少问题，都要扫描全部问题：

```python
def count_questions(student_id):
    count = 0
    for q in questions:
        if q["student_id"] == student_id:
            count += 1
    return count
```

缓存把查询从 `Θ(n)` 变成期望 `Θ(1)`，代价是额外空间和更新责任。

---

## 缓存的不变量

缓存最大的风险是过期。

如果一个问题被撤回，计数也必须同步更新：

```python
def undo_question(student_id, question_id):
    # 标记问题撤回
    questions_by_id[question_id]["status"] = "withdrawn"
    # 同步更新缓存
    question_count[student_id] -= 1
```

这里的不变量是：

```text
question_count[student_id]
等于该学生未撤回问题的数量。
```

Agent 常见错误是只在新增时更新缓存，忘记在删除、撤回、修改时同步维护。这样的代码小样例可能没问题，运行一段时间后统计就会慢慢漂移。

---

## 从记忆化到 KV-cache

后面讲动态规划时，我们会看到**记忆化**：

```python
memo = {}

def f(x):
    if x in memo:
        return memo[x]
    result = compute(x)
    memo[x] = result
    return result
```

它的核心也是缓存：同一个子问题算过一次，以后直接查表。

LLM 推理中的 KV-cache 也可以先用这个直觉理解：模型生成下一个 token 时，不必每次重新计算全部历史 token 的中间表示，而是缓存已经计算过的 key/value。这样生成很长文本时，每一步可以复用前面的计算。

这里不用现在掌握 Transformer 细节。你只需要先建立一条线：

```text
数据结构接口 -> 缓存中间结果 -> 维护缓存不变量 -> 审查空间和失效策略
```

这条线会在第6章动态规划、第10章流式算法、第11章 Transformer 中反复出现。

---

## 注意力是一种加权检索

哈希表检索是"给定 key，找到精确位置"。  
注意力机制可以先直观理解为"给定 query，对上下文中的很多位置分配权重，再加权取回信息"。

两者都在回答检索问题：

```text
我现在需要的信息在哪里？
我应该取回哪一部分？
取回成本是多少？
```

不同的是，哈希表偏精确、离散；注意力偏连续、加权。第11章会正式讲 Q、K、V 和 softmax。现在只需要知道：数据结构训练的接口和检索思维，会继续支撑你理解 LLM 的内部算法。

---

## Agent 审查：缓存五问

当 agent 给出带缓存的方案时，至少问五个问题：

1. 缓存的 key 是什么？
2. 缓存的 value 是什么？
3. 哪些操作会让缓存失效？
4. 缓存和原始数据之间的不变量是什么？
5. 缓存节省的时间是否值得额外空间和维护复杂度？

比如：

```text
缓存：student_id -> question_count
失效操作：撤回问题、删除课堂、合并学生账号
不变量：计数等于当前有效问题数
```

如果 agent 只能说"加个缓存更快"，但说不出这些内容，就还不是一个可靠方案。

---

## 本节要点

- 数据结构的核心是接口、表示、不变量和成本。
- API、prompt、skill 都需要清晰的输入输出契约。
- 缓存是保存中间结果，用空间换时间。
- 缓存必须维护一致性，否则会产生静默错误。
- KV-cache、DP 记忆化、统计缓存都可以放在同一条思想线上理解。
- Agent 时代更需要审查缓存的 key、value、失效条件和空间代价。

---

## 课堂练习

为"在线课堂互动系统"设计一个数据结构推荐 skill。

输入格式：

```text
任务描述：
操作需求表：
数据规模：
延迟要求：
```

输出格式必须包含：

1. 推荐的数据结构组合。
2. 每个结构负责什么。
3. 每个操作复杂度。
4. 不变量。
5. 是否需要缓存。
6. 缓存失效条件。
7. 仍需澄清的问题。

然后让 agent 按这个格式输出一次，并写一份审查记录。

---

## 课后测验

<Quiz src="/quizzes/ch02-10.json" />

---

**上一节：[2.9 摊还分析](/chapters/ch02/09-amortized-analysis)**

**下一节：[2.11 综合练习](/chapters/ch02/11-exercises)**
