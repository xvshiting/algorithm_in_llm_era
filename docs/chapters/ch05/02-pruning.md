# 5.2 剪枝策略——如何让百万步变成几十步

## 问题情境：Sudoku 的速度差距

### 同一个问题，两种解法

**Sudoku 难题**：给定部分填充的棋盘，找到唯一解。

**解法 A**：朴素回溯
```
搜索步骤：1,904,832
运行时间：12.7 秒
结果：找到唯一解 ✓
```

**解法 B**：带剪枝
```
搜索步骤：48
运行时间：0.02 秒
结果：找到唯一解 ✓
```

**同一个答案，同一个算法框架，差距 40,000 倍。**

为什么？

### 第一次尝试：朴素回溯

小明用上一节学的回溯框架解决 Sudoku：

```python
def solve_simple(board):
    """朴素回溯"""
    # 找第一个空格
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                # 尝试 1-9
                for num in range(1, 10):
                    if is_valid(board, i, j, num):
                        board[i][j] = num
                        if solve_simple(board):
                            return True
                        board[i][j] = 0  # 回溯
                return False
    return True
```

运行后，小明发现程序很慢。他追踪了几步：

```
空格(0,2)：尝试 1 → 合格 → 填入
空格(0,3)：尝试 1 → 冲突 → 跳过
           尝试 2 → 合格 → 填入
空格(0,4)：尝试 1 → 冲突 → 跳过
           尝试 2 → 冲突 → 跳过
           ...
           尝试 7 → 合格 → 填入
...
（一直填到棋盘满了，才验证是否满足所有规则）
```

小明意识到问题：**每填一个空格，只检查当前位置是否违反规则，不检查填入后其他空格是否还有候选**。

### 困惑：为什么先填的位置会导致后填的位置无解？

小红画了个图：

```
棋盘状态：
5 3 ? | ? 7 ? | ? ? ?
6 ? ? | 1 9 5 | ? ? ?

如果 (0,2) 填入 4：
  - (1,1) 可能需要填 4（被列限制）
  - 但如果 (1,1) 填不了 4，那么 (0,2)=4 就错了
  
但回溯不知道！它继续填其他空格...
直到最后才发现某个空格无候选，回溯几层...
```

**直觉**：如果能**提前看到某个空格会无候选**，就不用继续填了——立即回溯。

---

## 直观思路：提前发现死胡同

### 前瞻剪枝的直觉

**类比**：修剪果树——剪掉不结果实的枝条，养分集中在结果枝上。

**应用到 Sudoku**：
- 填入一个数字后，立即检查所有空格的候选数
- 如果发现某个空格**候选数为 0** → **死胡同** → 立即回溯

```python
def solve_with_pruning(board):
    """带前瞻剪枝"""
    pos = find_empty(board)
    if pos is None:
        return True
    
    row, col = pos
    candidates = get_candidates(board, row, col)
    
    for num in candidates:
        board[row][col] = num
        
        # 前瞻剪枝：检查是否有空格无候选
        if has_dead_end(board):  # 关键改进！
            board[row][col] = 0  # 立即回溯
            continue  # 尝试下一个候选
        
        if solve_with_pruning(board):
            return True
        
        board[row][col] = 0
    
    return False

def has_dead_end(board):
    """检查是否有空格候选数为 0"""
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                candidates = get_candidates(board, i, j)
                if len(candidates) == 0:
                    return True  # 死胡同！
    return False
```

**效果**：步骤数从 1,904,832 降到 48。

**直觉解释**：每次填入后，立即"看到"其他空格的未来。如果某个空格注定无解，现在就放弃，不用等到填满才发现。

### 更进一步的思考：先填哪个空格？

小明又发现一个问题：**选择空格的顺序会影响效率**。

```
策略 1：按顺序填（从 (0,0) 开始）
策略 2：先填候选数最少的位置

对比：
空格 A：候选数 1（唯一候选）
空格 B：候选数 7（很多候选）

如果先填 A：
  - 只有 1 种选择，立即确定
  - 填入后，B 的候选数可能减少到 5
  
如果先填 B：
  - 有 7 种选择，需要尝试 7 个分支
  - 其中 6 个分支可能最终失败
```

**直觉**：**候选数少的位置更可能无解，早点发现矛盾**。

---

## 规范定义：剪枝策略的分类

### 什么是剪枝？

**定义**：剪枝是在搜索过程中，通过**提前判断**某些分支不可能包含合法解，从而跳过这些分支的探索。

**关键区分**：
- **可行性剪枝**：判断当前分支是否有解
- **最优性剪枝**：判断当前分支是否优于已知解（用于优化问题）
- **约束传播剪枝**：更新其他位置的候选集（减少后续搜索空间）

### 三种剪枝策略详解

#### 1. 前瞻剪枝（Forward Checking）

**机制**：填入一个数字后，检查所有空格的候选数。

**判断标准**：如果发现候选数为 0 的空格 → 死胡同 → 立即回溯。

```python
def forward_check(board):
    """前瞻剪枝"""
    for pos in all_empty(board):
        if len(get_candidates(board, pos)) == 0:
            return False  # 死胡同
    return True
```

**代价**：每次填入后检查 81 个位置 → $O(81)$ 每步
**收益**：避免无效分支的深度探索 → 可能省下数千步

#### 2. 最受约束优先（Most Constrained First）

**机制**：优先选择候选数最少的位置。

**判断标准**：候选数越少，越容易无解 → 早点失败。

```python
def find_most_constrained(board):
    """找候选数最少的空格"""
    min_count = 10  # 最大候选数+1
    best_pos = None
    
    for pos in all_empty(board):
        count = len(get_candidates(board, pos))
        if count < min_count:
            min_count = count
            best_pos = pos
    
    return best_pos
```

**代价**：每次选择时检查所有空格 → $O(\text{空格数})$
**收益**：分支数减少（候选少的分支少）→ 搜索树更小

#### 3. 约束传播（Constraint Propagation）

**机制**：填入数字后，立即更新相关空格的候选集。

**判断标准**：实时维护候选集，发现候选数为 0 的空格 → 死胡同。

```python
def propagate(board, row, col, num):
    """约束传播：删除相关位置的候选"""
    # 同行
    for j in range(9):
        candidates[row][j].discard(num)
    
    # 同列
    for i in range(9):
        candidates[i][col].discard(num)
    
    # 同方块
    block_row, block_col = 3 * (row // 3), 3 * (col // 3)
    for i in range(block_row, block_row + 3):
        for j in range(block_col, block_col + 3):
            candidates[i][j].discard(num)
```

**代价**：维护候选集矩阵 → 空间 $O(81 \times 9)$，每次填入 $O(21)$
**收益**：实时更新，发现唯一候选（直接填入，无需搜索）

---

## 算法实现：完整剪枝 Sudoku 求解器

### 带约束传播的实现

```python
class SudokuSolver:
    def __init__(self, board):
        self.board = board
        # 初始化候选集
        self.candidates = [[set(range(1, 10)) for _ in range(9)] 
                           for _ in range(9)]
        self._init_candidates()
    
    def _init_candidates(self):
        """初始化：从已填数字删除候选"""
        for i in range(9):
            for j in range(9):
                if self.board[i][j] != 0:
                    self._propagate(i, j, self.board[i][j])
    
    def _propagate(self, row, col, num):
        """约束传播"""
        for j in range(9):
            self.candidates[row][j].discard(num)
        for i in range(9):
            self.candidates[i][col].discard(num)
        br, bc = 3 * (row // 3), 3 * (col // 3)
        for i in range(br, br + 3):
            for j in range(bc, bc + 3):
                self.candidates[i][j].discard(num)
    
    def solve(self):
        """求解"""
        # 最受约束优先
        pos = self._find_most_constrained()
        if pos is None:
            return True  # 无空格，完成
        
        row, col = pos
        
        # 尝试候选
        for num in list(self.candidates[row][col]):
            self.board[row][col] = num
            
            # 保存状态
            saved = [[self.candidates[i][j].copy() for j in range(9)] 
                     for i in range(9)]
            
            # 约束传播
            self._propagate(row, col, num)
            
            # 前瞻检查
            if self._no_dead_end():
                if self.solve():
                    return True
            
            # 回溯：恢复候选集
            self.candidates = saved
            self.board[row][col] = 0
        
        return False
    
    def _find_most_constrained(self):
        """候选最少的位置"""
        min_count = 10
        best = None
        for i in range(9):
            for j in range(9):
                if self.board[i][j] == 0:
                    count = len(self.candidates[i][j])
                    if count < min_count:
                        min_count = count
                        best = (i, j)
        return best
    
    def _no_dead_end(self):
        """检查无候选空格"""
        for i in range(9):
            for j in range(9):
                if self.board[i][j] == 0 and len(self.candidates[i][j]) == 0:
                    return False
        return True
```

### 剪枝效果对比

| 剪枝策略 | 步骤数 | 说明 |
|---------|-------|-----|
| 无剪枝 | 1,904,832 | 盲目填充 |
| + 前瞻剪枝 | 48 | 死胡同检测 |
| + 最受约束 | 42 | 候选最少优先 |
| + 约束传播 | 35 | 候选集实时更新 |

---

## 正确性分析：剪枝会不会删掉合法解？

### 安全剪枝定理

**定理**：剪枝不会删除任何合法解。

**证明思路**：
- 前瞻剪枝：如果某个空格候选数为 0，那么任何完整解都不可能填满该空格 → 该分支无解
- 最受约束优先：只是改变搜索顺序，不改变候选集 → 不删除任何候选
- 约束传播：删除的是"不可能候选"（违反规则）→ 不删除合法候选

**关键**：剪枝删除的是**必然无解的分支**，不是"可能无解"的分支。

---

## 复杂度分析

### 剪枝的代价与收益

**代价**：
- 前瞻检查：$O(\text{空格数})$ 每步
- 约束传播：$O(21)$ 每步 + $O(81 \times 9)$ 空间

**收益**：
- 避免无效分支：可能省下数千甚至数百万步

**权衡公式**：
$$\text{净收益} = \text{节省步数} \times \text{每步时间} - \text{剪枝判断时间}$$

**经验法则**：剪枝判断越简单越好，复杂的剪枝可能得不偿失。

---

## 变式与反例

### 反例：剪枝不能解决的问题

**问题**：无约束的排列生成。

如果没有 Sudoku 的规则约束，前瞻剪枝和约束传播都无效——所有候选都"看起来合法"。

**教训**：剪枝的效果取决于**约束强度**。

### 变式：TSP 的剪枝

```python
def tsp_backtrack_with_pruning(cities, distances):
    """带剪枝的 TSP"""
    best_cost = float('inf')
    path = [cities[0]]
    
    def backtrack(current_path, current_cost):
        # 最优性剪枝：当前代价已超过最优解
        if current_cost >= best_cost:
            return  # 剪掉！
        
        if len(current_path) == len(cities):
            total = current_cost + distances[current_path[-1], cities[0]]
            if total < best_cost:
                best_cost = total
            return
        
        for city in cities:
            if city not in current_path:
                new_cost = current_cost + distances[current_path[-1], city]
                backtrack(current_path + [city], new_cost)
    
    backtrack(path, 0)
    return best_cost
```

---

## 常见错误诊断

### 错误 1：剪枝条件太宽松

```python
# 错误示例：剪掉"看起来不好"的候选
def pruning_wrong(board, pos, num):
    # 猜测这个数字不太可能
    if num > 5:  # 凭直觉剪枝！
        return False  # 剪掉
    return True
```

**后果**：可能删掉合法解。

**正确做法**：剪枝条件必须基于**必然无解**的逻辑，不能凭直觉。

### 错误 2：忘记恢复候选集

```python
# 错误示例：约束传播后不恢复
def solve_wrong(board):
    for num in candidates:
        propagate(row, col, num)  # 删除候选
        if solve_wrong(board):
            return True
        # 缺少恢复候选集！
```

**后果**：回溯后，候选集仍保留删除的状态，导致后续候选被错误判断为无候选。

### 错误 3：剪枝判断太复杂

```python
# 错误示例：复杂的剪枝判断
def complex_pruning(board):
    # 模拟填入所有候选，计算最终是否有解
    # ...（非常复杂的计算）
```

**后果**：剪枝判断时间超过节省的搜索时间 → 得不偿失。

---

## 练习

### 基本理解

1. **概念解释**：剪枝的"剪"和"枝"分别指什么？用 Sudoku 例子说明。

2. **直觉验证**：为什么候选数少的空格先填更高效？

3. **类比分析**：剪枝和修剪果树有什么相似之处？

### 方法应用

4. **前瞻剪枝实现**：为八皇后问题添加前瞻剪枝，比较效率提升。

5. **约束传播实验**：实现 Sudoku 的约束传播，观察候选集变化。

6. **剪枝组合**：组合三种剪枝策略，对比单一策略的效果。

### 错误诊断

7. **诊断错误**：给定一个"剪枝条件凭直觉"的代码，分析风险。

8. **恢复失败**：如果约束传播后不恢复候选集，会发生什么？

9. **过度剪枝**：构造一个例子，剪枝判断时间超过节省时间。

### 方案比较

10. **剪枝策略对比**：对比前瞻剪枝、最受约束、约束传播的效果。

11. **问题特征**：什么问题适合前瞻剪枝？什么问题适合约束传播？

12. **代价收益**：计算剪枝的代价收益，何时得不偿失？

### 开放设计

13. **剪枝设计**：为排列生成问题设计一个剪枝策略。

14. **自适应剪枝**：设计一个 Agent，动态选择剪枝策略。

15. **LLM 连接**：ToT 的评估函数与剪枝判断有什么相似之处？

### 综合应用

16. **TSP 剪枝**：为 TSP 设计下界剪枝（见下一节 A*）。

17. **综合问题**：设计一个既有可行性剪枝又有最优性剪枝的问题。

18. **真实应用**：用剪枝解决实际问题：排课表（避免时间冲突）。

---

## 思考题

**为什么剪枝效果因问题而异？**

剪枝的效果取决于：
- **约束强度**：约束越强，剪枝越有效（如 Sudoku 的规则）
- **候选分布**：候选数越不均匀，"最受约束优先"越有效
- **传播效果**：约束传播能否发现唯一候选

如果问题没有约束（如无规则排列），剪枝无效。

**剪枝会不会删掉合法解？**

不会，只要剪枝条件基于"必然无解"的逻辑：
- Sudoku 前瞻：候选数为 0 的空格必然无解
- Sudoku 约束传播：违反规则的候选必然无解

**剪枝判断应该多复杂？**

经验法则：剪枝判断时间应远小于节省的搜索时间。如果判断复杂（如模拟完整搜索），可能得不偿失。

---

> **过渡**：剪枝需要"看清未来"——判断某分支是否有希望。下一节：**如何量化"希望"，用启发函数指导搜索**——A* 算法。

---

**参考文献**：
- Skiena S S. The Algorithm Design Manual[M]. 3rd ed. Springer, 2020.
- Yao S, Yu D, Zhao J, et al. Tree of Thoughts: Deliberate Problem Solving with Large Language Models[C]//NeurIPS. 2023.