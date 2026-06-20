# 2.4 栈与队列

## 学习目标

学完这一节，你能：

- 解释栈的后进先出和队列的先进先出
- 用 Python 实现栈和队列的常见操作
- 用不变量理解括号匹配和任务排队
- 判断何时用 `list`，何时用 `collections.deque`
- 审查 agent 是否把队列写成低效的列表头部删除

---

## 栈：最后放进去的先出来

栈的规则是 **LIFO**：Last In, First Out，后进先出。

像一摞盘子。最后放上去的盘子最先被拿走。

栈通常支持两个核心操作：

```text
push(x)：压入一个元素
pop()：弹出最近压入的元素
```

Python 可以用 `list` 实现栈：

```python
stack = []

stack.append("A")  # push
stack.append("B")
stack.append("C")

top = stack.pop()  # "C"
```

对 Python `list` 来说，末尾 `append` 和末尾 `pop` 都是合适的栈操作。

---

## 栈的典型用途：括号匹配

判断括号是否匹配：

```python
def is_balanced(text):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []

    for char in text:
        if char in "([{":
            stack.append(char)
        elif char in ")]}":
            if not stack:
                return False
            if stack.pop() != pairs[char]:
                return False

    return not stack
```

这里的不变量是：

> 扫描到当前位置时，栈里保存的是已经看到但还没有匹配的左括号，顺序从早到晚排列。

为什么右括号要和栈顶匹配？因为最近出现的未匹配左括号，必须最先被闭合。

这个例子也说明：数据结构不是孤立知识。栈的规则直接对应问题的结构。

---

## 栈的专业接口

栈通常可以定义为：

```text
push(x)：压入元素
pop()：弹出并返回栈顶元素
peek()：查看栈顶但不弹出
is_empty()：判断是否为空
```

接口里必须约定边界行为：

```text
空栈 pop 应该报错，返回 None，还是由调用者先检查？
```

不同约定会影响代码可靠性。Agent 写栈代码时，如果没有处理空栈，往往说明它只在正常样例上工作，没有处理边界。

---

## 队列：先来的先处理

队列的规则是 **FIFO**：First In, First Out，先进先出。

像排队买饭。先到的人先被服务。

队列通常支持：

```text
enqueue(x)：加入队尾
dequeue()：从队头取出
```

Python 中不要用 `list.pop(0)` 做大队列。应该使用 `collections.deque`：

```python
from collections import deque

queue = deque()

queue.append("task-1")   # enqueue
queue.append("task-2")
queue.append("task-3")

first = queue.popleft()  # "task-1"
```

`deque` 的两端加入和移除都很快，适合队列。

---

## 队列的专业接口

队列通常可以定义为：

```text
enqueue(x)：加入队尾
dequeue()：移除并返回队头元素
peek()：查看队头但不移除
is_empty()：判断是否为空
```

队列的不变量是：

```text
如果 x 比 y 更早入队，并且二者都还没出队，那么 x 必须比 y 更早出队。
```

这句话比"用什么代码"更根本。只要实现破坏了这个顺序，不管代码多漂亮，都不是队列。

---

## 栈和队列的区别不是语法，而是承诺

同样一组任务：

```text
A, B, C
```

如果用栈，处理顺序是：

```text
C, B, A
```

如果用队列，处理顺序是：

```text
A, B, C
```

这会改变程序行为。

例如：

- 撤销操作适合栈：最后一步最先撤销。
- 浏览器前进后退可以用两个栈建模。
- 打印任务适合队列：先提交的先打印。
- 客服工单通常适合队列，但也可能引入优先级。

当需求说"按提交顺序处理"时，用栈就是错误建模；当需求说"撤销最近动作"时，用队列也是错误建模。

---

## 用栈模拟撤销

```python
class Editor:
    def __init__(self):
        self.text = ""
        self.history = []

    def type_text(self, content):
        self.history.append(self.text)
        self.text += content

    def undo(self):
        if self.history:
            self.text = self.history.pop()
```

每次修改前，把旧状态压入栈。撤销时弹出最近状态。

这个实现简单，但也有代价：如果文本很长，每次保存完整字符串会浪费空间。更真实的编辑器会保存操作记录，而不是每次保存完整文本。数据结构选择总是和规模有关。

---

## 双端队列：两端都快

`deque` 的名字来自 double-ended queue，意思是双端队列。它同时支持：

```python
from collections import deque

d = deque()
d.append("right")
d.appendleft("left")
d.pop()
d.popleft()
```

这让它既能做队列，也能在需要两端操作时发挥作用。

但 `deque` 不适合大量按下标随机访问。它的优势是两端操作，而不是像数组那样通过下标跳转。

---

## 用本节知识解决：撤回问题和普通排队

课堂互动系统里有两个看起来相似、其实完全不同的需求。

第一个需求：

> 学生可以撤回自己最近一次提交的问题。

"最近一次"是栈信号。每个学生可以有自己的提交栈：

```python
question_stack_by_student = {}

def remember_question(student_id, question_id):
    question_stack_by_student.setdefault(student_id, []).append(question_id)

def undo_last_question(student_id):
    stack = question_stack_by_student.get(student_id, [])
    if not stack:
        return None
    return stack.pop()
```

第二个需求：

> 老师按提交顺序处理普通问题。

"按提交顺序"是队列信号：

```python
from collections import deque

normal_questions = deque()

def add_normal_question(question_id):
    normal_questions.append(question_id)

def next_normal_question():
    if not normal_questions:
        return None
    return normal_questions.popleft()
```

这两个需求都在处理"问题"，但一个是后进先出，一个是先进先出。现实任务里，结构选择经常不是由数据类型决定，而是由操作语义决定。

Agent 如果把两者都写成 `list.append` + `list.pop()`，撤回功能可能是对的，按提交顺序处理就是错的。  
如果它把队列写成 `list.append` + `pop(0)`，顺序对了，大规模时复杂度又可能错。

---

## 审查 agent 输出

假设 agent 写了任务队列：

```python
tasks = []

def add_task(task):
    tasks.append(task)

def next_task():
    return tasks.pop()
```

你要先问：需求到底是栈还是队列？

如果任务要求"后加入的先处理"，这就是栈，可以接受。但如果要求"先提交先处理"，`pop()` 会从末尾取出，行为就是错的。改成 `pop(0)` 行为对了，但复杂度又可能错。更好的结构是 `deque`：

```python
from collections import deque

tasks = deque()

def add_task(task):
    tasks.append(task)

def next_task():
    return tasks.popleft()
```

审查时要同时看两件事：

1. 行为顺序是否正确。
2. 操作复杂度是否适合规模。

---

## 本节要点

- 栈是后进先出，队列是先进先出。
- Python `list.append` + `list.pop` 适合做栈。
- Python 队列通常用 `collections.deque`。
- 栈和队列的关键是行为承诺，不只是代码写法。
- 审查 agent 时，既要检查顺序语义，也要检查隐藏复杂度。

---

## 课堂练习

某系统有三种任务：

1. 用户撤销最近一次编辑。
2. 后台按提交顺序处理图片压缩任务。
3. 客服先处理普通工单，但会员工单优先。

请回答：

1. 哪些适合栈？
2. 哪些适合队列？
3. 哪个已经超出普通队列，需要下一节之后的结构？
4. 如果 agent 都用 `list` 实现，你会重点审查哪些行？

---

## 课后测验

<Quiz src="/quizzes/ch02-04.json" />

---

**上一节：[2.3 链表](/chapters/ch02/03-linked-list)**

**下一节：[2.5 集合与字典：哈希表](/chapters/ch02/05-hash-table)**
