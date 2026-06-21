# 8.3 NP完全性与Cook定理——问题的等价性

> **问题**：是否存在一个"最难"的NP问题？如果解开了它，所有NP问题都能解决？

---

## 一个惊人的发现

1971年，Stephen Cook证明了一个令人震惊的定理：**SAT问题是NP完全的**。

这意味着：
- SAT在NP中（可验证）
- 所有NP问题都能在多项式时间内转换为SAT
- 如果SAT有多项式时间算法，则P=NP

换句话说，SAT是NP问题的"通用语言"——解开了SAT，就解开了所有NP问题。

---

## NP完全性的定义

### NP-hard（NP难）

**定义**：问题H是NP-hard，如果所有NP问题都能在多项式时间内归约到H。

```
L ≤ₚ H 对所有L ∈ NP
```

其中≤ₚ表示多项式时间归约。

**直觉**：NP-hard问题"至少和NP中任何问题一样难"。

### NP-complete（NP完全）

**定义**：问题C是NP-complete，如果：
1. C在NP中
2. C是NP-hard

**直觉**：NP-complete问题是"NP中最难的问题"。

### 关键定理

**定理**：如果任何一个NP-complete问题在P中，则P=NP。

**证明**：
1. 设C是NP-complete且C ∈ P
2. 对于任意L ∈ NP，L ≤ₚ C（因为C是NP-hard）
3. 因为C ∈ P，所以L ∈ P（多项式时间的多项式还是多项式）
4. 因此NP ⊆ P
5. 又P ⊆ NP
6. 所以P=NP

**意义**：只要找到一个NP-complete问题的多项式算法，就解决了P=NP问题。

---

## Cook定理：SAT是NP完全的

### SAT问题

**布尔可满足性问题（SAT）**：给定布尔公式（合取范式），判断是否存在变量赋值使公式为真。

**合取范式（CNF）**：
- 文字：变量或变量的否定（x 或 ¬x）
- 子句：文字的析取（x₁ ∨ ¬x₂ ∨ x₃）
- 公式：子句的合取（子句₁ ∧ 子句₂ ∧ ...）

**例子**：(x₁ ∨ ¬x₂) ∧ (¬x₁ ∨ x₃) ∧ (x₂ ∨ x₃)

存在赋值使公式为真吗？是的，x₁=True, x₂=False, x₃=True。

### Cook定理陈述

**定理（Cook, 1971）**：SAT是NP完全的。

### 证明思路

证明分两步：

#### 第一步：SAT在NP中

- **证书**：变量赋值
- **验证器**：代入赋值，计算公式真值
- **验证时间**：O(子句数 × 变量数) = 多项式时间

因此SAT ∈ NP。

#### 第二步：所有NP问题都能归约到SAT

这是证明的核心。思路如下：

1. **NP问题的本质**
   
   NP问题 = 存在多项式时间验证器V(x, c)
   
   验证器是一个确定性图灵机，在多项式时间p(|x|)内运行。

2. **图灵机计算的布尔编码**
   
   图灵机的计算过程可以用布尔变量表示：
   - Q[i,t]：时刻t，状态为i
   - H[j,t]：时刻t，读写头在格子j
   - S[j,a,t]：时刻t，格子j包含符号a

3. **转移规则的布尔约束**
   
   图灵机的每条转移规则可以编码为布尔子句：
   - "如果在状态q读取a，则转移到状态q'，写入a'，移动方向d"
   - 转化为：(Q[q,t] ∧ H[j,t] ∧ S[j,a,t]) → (Q[q',t+1] ∧ ...)

4. **构造SAT实例**
   
   给定NP问题实例x，构造SAT公式：
   - 变量：图灵机在时刻0到p(|x|)的状态、位置、带内容
   - 子句：确保转移正确、初始配置正确、最终接受

5. **等价性**
   
   - SAT可满足 ⟺ 存在证书c使V(x, c)接受
   - 因为SAT编码了"是否存在有效计算路径"

### 为什么SAT是"通用语言"？

任何计算都可以表达为布尔约束：
- 图灵机的每一步转移都是布尔操作
- 图灵机的整个计算过程是布尔公式的合取
- SAT可以"模拟"任何图灵机

**直觉**：SAT就像乐高积木——用简单的布尔逻辑，可以搭建任何计算。

---

## 3-SAT：更标准的NP完全问题

虽然SAT是第一个被证明的NP完全问题，但在实际归约中，我们更常用**3-SAT**。

### 3-SAT问题

**定义**：SAT的特例，每个子句恰好有3个文字。

**例子**：(x₁ ∨ ¬x₂ ∨ x₃) ∧ (¬x₁ ∨ x₂ ∨ x₄) ∧ (x₂ ∨ ¬x₃ ∨ x₄)

### SAT ≤ₚ 3-SAT

**定理**：3-SAT是NP完全的。

**证明思路**：
1. 3-SAT在NP中（显然，是SAT的特例）
2. SAT ≤ₚ 3-SAT（需要构造归约）

#### 归约构造

**长子句 → 多个3-文字子句**：

子句 (x₁ ∨ x₂ ∨ x₃ ∨ x₄) 转化为：
```
(x₁ ∨ x₂ ∨ y₁) ∧ (¬y₁ ∨ x₃ ∨ y₂) ∧ (¬y₂ ∨ x₄ ∨ z)
```

其中y₁, y₂是辅助变量，z是任意真值（如x₁ ∨ ¬x₁）。

**短子句 → 多个3-文字子句**：

子句 (x₁ ∨ x₂) 转化为：
```
(x₁ ∨ x₂ ∨ z) ∧ (x₁ ∨ x₂ ∨ ¬z)
```

**关键性质**：辅助变量不改变可满足性。

---

## NP完全性的意义

### 为什么NP完全性重要？

1. **统一视角**：所有NP完全问题"等价"——解开一个，解开全部

2. **识别困难**：如果问题是NP完全的，可能需要接受近似解

3. **理论基准**：NP完全问题是计算复杂性的基准点

### NP完全问题族谱

从Cook定理出发，我们可以证明更多问题的NP完全性：

```
        Cook定理
           ↓
          SAT
           ↓
        3-SAT ←────────────────┐
           ↓                    │
     Vertex Cover               │
      ↓       ↓                 │
    Clique   Hamiltonian Path   │
      ↓                          │
     TSP ←───────────────────────┘
```

每个箭头表示一个归约。如果A → B，则B至少和A一样难。

---

## LLM关联：Prompt约束满足

SAT问题与LLM有什么关系？

### Prompt约束

当你写Prompt时：
```
请写一篇文章：
1. 字数在500-800字之间
2. 包含"创新"这个词
3. 不包含"技术"这个词
4. 第一段要有疑问句
5. 最后一段要有总结
```

这本质上是一个**约束满足问题**，类似于SAT：
- 变量：每个词的选择
- 约束：各种要求
- 目标：满足所有约束

### 为什么复杂Prompt容易失败？

如果约束太多、太复杂，问题变得像SAT：
- 约束之间可能冲突
- 验证容易（检查是否满足），但生成困难
- LLM可能在指数级搜索空间中挣扎

### 启示

理解SAT的NP完全性，有助于理解：
- 为什么简单Prompt效果好
- 为什么复杂约束需要迭代优化
- 为什么"生成+验证"架构有效

---

## 练习

### 基础练习

1. **理解NP完全性**
   
   为什么NP-complete问题被称为"NP中最难的问题"？
   如果一个NP-complete问题在P中，为什么P=NP？

2. **SAT验证器**
   
   实现一个SAT验证器，给定布尔公式和赋值，判断公式是否可满足。
   
   ```python
   # 输入格式
   formula = [
       [('x1', False), ('x2', True)],   # (x1 ∨ ¬x2)
       [('x1', True), ('x3', False)]    # (¬x1 ∨ x3)
   ]
   assignment = {'x1': True, 'x2': False, 'x3': True}
   ```

### 进阶练习

3. **3-SAT转化**
   
   将以下SAT实例转化为3-SAT：
   - (x₁ ∨ x₂ ∨ x₃ ∨ x₄ ∨ x₅)
   - (x₁ ∨ x₂)
   
   证明转化前后可满足性等价。

4. **Cook定理直觉**
   
   用自己的话解释Cook定理的直觉：为什么SAT可以"模拟"任何图灵机？

### 思考题

5. **NP-hard vs NP-complete**
   
   NP-hard和NP-complete有什么区别？
   给出一个NP-hard但不是NP-complete的问题例子。

6. **Prompt设计**
   
   你认为什么样的Prompt约束会让问题变得更像SAT？
   如何设计Prompt使约束更容易满足？

---

## 小结

| 概念 | 要点 |
|------|------|
| **NP-hard** | 所有NP问题可归约到它，不一定在NP中 |
| **NP-complete** | NP-hard且在NP中，NP中最难的问题 |
| **Cook定理** | SAT是NP完全的，是NP问题的"通用语言" |
| **3-SAT** | SAT的标准化形式，每子句恰好3文字 |
| **归约链** | SAT → 3-SAT → Vertex Cover → ... |

**核心洞见**：NP完全性揭示了问题的等价性——解开了SAT，就解开了所有NP问题。这正是NP完全性理论的核心价值。

---

**下一节**：我们将学习归约的具体方法——如何把一个问题"翻译"成另一个问题。

---

## 代码实现：SAT求解器

### DPLL算法完整实现

```python
from typing import List, Tuple, Set, Optional, Dict
from copy import deepcopy

class Literal:
    """表示一个文字（变量或其否定）"""
    
    def __init__(self, variable: str, negated: bool = False):
        self.variable = variable
        self.negated = negated
    
    def __repr__(self) -> str:
        return f"¬{self.variable}" if self.negated else self.variable
    
    def __eq__(self, other) -> bool:
        if not isinstance(other, Literal):
            return False
        return self.variable == other.variable and self.negated == other.negated
    
    def __hash__(self) -> int:
        return hash((self.variable, self.negated))
    
    def negate(self) -> 'Literal':
        """返回否定文字"""
        return Literal(self.variable, not self.negated)
    
    def evaluate(self, assignment: Dict[str, bool]) -> bool:
        """在给定赋值下评估文字"""
        if self.variable not in assignment:
            raise ValueError(f"变量 '{self.variable}' 未赋值")
        return assignment[self.variable] if not self.negated else not assignment[self.variable]


class Clause:
    """表示一个子句（文字的析取）"""
    
    def __init__(self, literals: List[Literal]):
        if not literals:
            raise ValueError("子句不能为空")
        self.literals: List[Literal] = literals
    
    def __repr__(self) -> str:
        return "(" + " ∨ ".join(str(l) for l in self.literals) + ")"
    
    def __len__(self) -> int:
        return len(self.literals)
    
    def evaluate(self, assignment: Dict[str, bool]) -> Optional[bool]:
        """
        在给定赋值下评估子句
        
        Returns:
            True: 子句满足
            False: 子句不满足（所有文字为假）
            None: 子句未确定（有些变量未赋值）
        """
        has_unassigned = False
        
        for lit in self.literals:
            if lit.variable not in assignment:
                has_unassigned = True
            elif lit.evaluate(assignment):
                return True  # 有一个文字为真
        
        if has_unassigned:
            return None  # 未确定
        return False  # 所有已赋值文字为假
    
    def variables(self) -> Set[str]:
        """返回子句中所有变量"""
        return {lit.variable for lit in self.literals}
    
    def remove_literal(self, lit: Literal) -> 'Clause':
        """移除一个文字"""
        new_literals = [l for l in self.literals if l != lit]
        if not new_literals:
            raise ValueError("移除后子句为空")
        return Clause(new_literals)


class CNFFormula:
    """合取范式（CNF）公式"""
    
    def __init__(self, clauses: List[Clause] = None):
        self.clauses: List[Clause] = clauses if clauses else []
    
    def __repr__(self) -> str:
        if not self.clauses:
            return "⊤"  # 真公式
        return " ∧ ".join(str(c) for c in self.clauses)
    
    def add_clause(self, clause: Clause) -> None:
        """添加子句"""
        self.clauses.append(clause)
    
    def variables(self) -> Set[str]:
        """返回所有变量"""
        result = set()
        for clause in self.clauses:
            result.update(clause.variables())
        return result
    
    def is_empty(self) -> bool:
        """是否为空公式（恒真）"""
        return len(self.clauses) == 0
    
    def has_empty_clause(self) -> bool:
        """是否有空子句（恒假）"""
        return any(len(c) == 0 for c in self.clauses)
    
    def evaluate(self, assignment: Dict[str, bool]) -> Optional[bool]:
        """
        在给定赋值下评估公式
        
        Returns:
            True: 公式满足
            False: 公式不满足
            None: 未确定
        """
        for clause in self.clauses:
            result = clause.evaluate(assignment)
            if result == False:
                return False  # 有子句不满足
            if result is None:
                return None  # 未确定
        return True  # 所有子句满足


class DPLLSolver:
    """
    DPLL（Davis-Putnam-Logemann-Loveland）SAT求解器
    
    算法核心：
    1. 单子句传播（Unit Propagation）
    2. 纯文字消除（Pure Literal Elimination）
    3. 变量选择与分支
    
    时间复杂度：最坏情况O(2^n)，但实际中表现良好
    """
    
    def __init__(self):
        self.stats = {
            'unit_propagations': 0,
            'pure_literal_eliminations': 0,
            'branching_decisions': 0,
            'backtracks': 0
        }
    
    def solve(self, formula: CNFFormula) -> Optional[Dict[str, bool]]:
        """
        解决SAT问题
        
        Args:
            formula: CNF公式
            
        Returns:
            如果可满足，返回一个赋值；否则返回None
        """
        if formula.is_empty():
            return {}  # 空公式恒真
        
        if formula.has_empty_clause():
            return None  # 有空子句恒假
        
        # 重置统计
        self.stats = {
            'unit_propagations': 0,
            'pure_literal_eliminations': 0,
            'branching_decisions': 0,
            'backtracks': 0
        }
        
        return self._dpll(formula, {})
    
    def _dpll(
        self, 
        formula: CNFFormula, 
        assignment: Dict[str, bool]
    ) -> Optional[Dict[str, bool]]:
        """
        DPLL递归核心
        
        Args:
            formula: 当前公式
            assignment: 当前赋值
            
        Returns:
            满足赋值或None
        """
        # 1. 单子句传播
        formula, assignment = self._unit_propagate(formula, assignment)
        
        if formula.has_empty_clause():
            self.stats['backtracks'] += 1
            return None
        
        if formula.is_empty():
            return assignment
        
        # 2. 纯文字消除
        formula, assignment = self._pure_literal_eliminate(formula, assignment)
        
        if formula.has_empty_clause():
            return None
        
        if formula.is_empty():
            return assignment
        
        # 3. 选择变量分支
        variable = self._choose_variable(formula)
        if variable is None:
            return assignment
        
        self.stats['branching_decisions'] += 1
        
        # 尝试赋值为True
        formula_true = self._assign(formula, variable, True)
        assignment_true = assignment.copy()
        assignment_true[variable] = True
        
        result = self._dpll(formula_true, assignment_true)
        if result is not None:
            return result
        
        # 尝试赋值为False（回溯）
        self.stats['backtracks'] += 1
        
        formula_false = self._assign(formula, variable, False)
        assignment_false = assignment.copy()
        assignment_false[variable] = False
        
        return self._dpll(formula_false, assignment_false)
    
    def _unit_propagate(
        self, 
        formula: CNFFormula, 
        assignment: Dict[str, bool]
    ) -> Tuple[CNFFormula, Dict[str, bool]]:
        """
        单子句传播
        
        单子句：只有一个文字的子句
        该文字必须为真，可以立即赋值
        
        Args:
            formula: 当前公式
            assignment: 当前赋值
            
        Returns:
            (简化后的公式, 更新的赋值)
        """
        assignment = assignment.copy()
        new_clauses = formula.clauses.copy()
        
        changed = True
        while changed:
            changed = False
            
            for clause in new_clauses:
                # 检查是否是单子句（只有一个未赋值文字）
                unassigned_literals = [
                    lit for lit in clause.literals 
                    if lit.variable not in assignment
                ]
                assigned_true = [
                    lit for lit in clause.literals 
                    if lit.variable in assignment and lit.evaluate(assignment)
                ]
                
                if assigned_true:
                    # 子句已满足，可以移除
                    new_clauses.remove(clause)
                    changed = True
                    break
                elif len(unassigned_literals) == 0:
                    # 所有文字为假，子句不满足 → 空子句
                    new_clauses.remove(clause)
                    new_clauses.append(Clause([]))  # 添加空子句
                    changed = True
                    break
                elif len(unassigned_literals) == 1:
                    # 单子句：必须赋值使该文字为真
                    lit = unassigned_literals[0]
                    assignment[lit.variable] = not lit.negated
                    self.stats['unit_propagations'] += 1
                    
                    # 移除包含该文字的子句（已满足）
                    # 移除该文字的否定（变成假）
                    new_clauses = self._simplify_after_assignment(
                        new_clauses, lit.variable, assignment[lit.variable]
                    )
                    changed = True
                    break
        
        return CNFFormula(new_clauses), assignment
    
    def _pure_literal_eliminate(
        self, 
        formula: CNFFormula, 
        assignment: Dict[str, bool]
    ) -> Tuple[CNFFormula, Dict[str, bool]]:
        """
        纯文字消除
        
        纯文字：在所有子句中只出现一种极性（只正或只负）
        可以直接赋值使该文字为真
        
        Args:
            formula: 当前公式
            assignment: 当前赋值
            
        Returns:
            (简化后的公式, 更新的赋值)
        """
        assignment = assignment.copy()
        
        # 找所有未赋值变量的极性
        positive_vars = set()
        negative_vars = set()
        
        for clause in formula.clauses:
            for lit in clause.literals:
                if lit.variable not in assignment:
                    if lit.negated:
                        negative_vars.add(lit.variable)
                    else:
                        positive_vars.add(lit.variable)
        
        # 找纯文字
        pure_positive = positive_vars - negative_vars
        pure_negative = negative_vars - positive_vars
        
        if not pure_positive and not pure_negative:
            return formula, assignment
        
        # 赋值纯文字
        new_clauses = formula.clauses.copy()
        
        for var in pure_positive:
            assignment[var] = True
            new_clauses = self._simplify_after_assignment(new_clauses, var, True)
            self.stats['pure_literal_eliminations'] += 1
        
        for var in pure_negative:
            assignment[var] = False
            new_clauses = self._simplify_after_assignment(new_clauses, var, False)
            self.stats['pure_literal_eliminations'] += 1
        
        return CNFFormula(new_clauses), assignment
    
    def _simplify_after_assignment(
        self, 
        clauses: List[Clause], 
        variable: str, 
        value: bool
    ) -> List[Clause]:
        """
        在赋值后简化公式
        
        Args:
            clauses: 子句列表
            variable: 被赋值的变量
            value: 赋值
            
        Returns:
            简化后的子句列表
        """
        new_clauses = []
        
        for clause in clauses:
            # 检查子句是否满足
            clause_satisfied = False
            remaining_literals = []
            
            for lit in clause.literals:
                if lit.variable == variable:
                    # 检查该文字是否为真
                    lit_value = value if not lit.negated else not value
                    if lit_value:
                        clause_satisfied = True
                    # 移除该文字（无论真假）
                else:
                    remaining_literals.append(lit)
            
            if not clause_satisfied:
                if remaining_literals:
                    new_clauses.append(Clause(remaining_literals))
                else:
                    new_clauses.append(Clause([]))  # 空子句
        
        return new_clauses
    
    def _assign(
        self, 
        formula: CNFFormula, 
        variable: str, 
        value: bool
    ) -> CNFFormula:
        """
        赋值变量并简化公式
        
        Args:
            formula: 当前公式
            variable: 变量
            value: 赋值
            
        Returns:
            简化后的公式
        """
        new_clauses = self._simplify_after_assignment(formula.clauses, variable, value)
        return CNFFormula(new_clauses)
    
    def _choose_variable(self, formula: CNFFormula) -> Optional[str]:
        """
        选择下一个分支变量
        
        使用多种启发式：
        1. 选择出现频率最高的变量
        2. 优先选择短子句中的变量
        
        Args:
            formula: 当前公式
            
        Returns:
            选择的变量名
        """
        if formula.is_empty():
            return None
        
        # 统计变量出现频率
        var_count: Dict[str, int] = {}
        for clause in formula.clauses:
            for lit in clause.literals:
                var_count[lit.variable] = var_count.get(lit.variable, 0) + 1
        
        if not var_count:
            return None
        
        # 选择频率最高的变量
        max_var = max(var_count.keys(), key=lambda v: var_count[v])
        return max_var
    
    def get_stats(self) -> Dict[str, int]:
        """获取求解统计"""
        return self.stats.copy()


# ==================== SAT验证器 ====================

def verify_sat_solution(
    formula: CNFFormula, 
    assignment: Dict[str, bool]
) -> Tuple[bool, str]:
    """
    验证SAT解的正确性
    
    Args:
        formula: CNF公式
        assignment: 待验证的赋值
        
    Returns:
        (是否正确, 详细信息)
    """
    # 检查所有变量是否赋值
    all_vars = formula.variables()
    missing_vars = all_vars - set(assignment.keys())
    
    if missing_vars:
        return False, f"变量 {missing_vars} 未赋值"
    
    # 检查每个子句是否满足
    unsatisfied_clauses = []
    for clause in formula.clauses:
        if clause.evaluate(assignment) != True:
            unsatisfied_clauses.append(str(clause))
    
    if unsatisfied_clauses:
        return False, f"子句 {unsatisfied_clauses} 未满足"
    
    return True, "验证通过"


# ==================== 测试用例 ====================

import unittest

class TestDPLLSolver(unittest.TestCase):
    """DPLL求解器测试"""
    
    def test_empty_formula(self):
        """测试空公式"""
        solver = DPLLSolver()
        formula = CNFFormula()
        
        result = solver.solve(formula)
        self.assertEqual(result, {})  # 空赋值
    
    def test_single_clause_satisfiable(self):
        """测试单子句可满足"""
        solver = DPLLSolver()
        formula = CNFFormula()
        formula.add_clause(Clause([Literal('x1')]))
        
        result = solver.solve(formula)
        self.assertIsNotNone(result)
        self.assertEqual(result['x1'], True)
    
    def test_single_clause_unsatisfiable(self):
        """测试单子句不可满足"""
        solver = DPLLSolver()
        formula = CNFFormula()
        formula.add_clause(Clause([Literal('x1')]))
        formula.add_clause(Clause([Literal('x1', negated=True)]))
        
        result = solver.solve(formula)
        self.assertIsNone(result)
    
    def test_two_clause_satisfiable(self):
        """测试两子句可满足"""
        solver = DPLLSolver()
        formula = CNFFormula()
        formula.add_clause(Clause([Literal('x1'), Literal('x2')]))
        formula.add_clause(Clause([Literal('x1', negated=True), Literal('x3')]))
        
        result = solver.solve(formula)
        self.assertIsNotNone(result)
        
        # 验证解
        is_valid, msg = verify_sat_solution(formula, result)
        self.assertTrue(is_valid)
    
    def test_classic_unsatisfiable(self):
        """测试经典不可满足公式"""
        solver = DPLLSolver()
        formula = CNFFormula()
        
        # (x1 ∨ x2) ∧ (¬x1 ∨ x2) ∧ (x1 ∨ ¬x2) ∧ (¬x1 ∨ ¬x2)
        formula.add_clause(Clause([Literal('x1'), Literal('x2')]))
        formula.add_clause(Clause([Literal('x1', negated=True), Literal('x2')]))
        formula.add_clause(Clause([Literal('x1'), Literal('x2', negated=True)]))
        formula.add_clause(Clause([Literal('x1', negated=True), Literal('x2', negated=True)]))
        
        result = solver.solve(formula)
        self.assertIsNone(result)
    
    def test_unit_propagation(self):
        """测试单子句传播"""
        solver = DPLLSolver()
        formula = CNFFormula()
        
        # (x1) ∧ (¬x1 ∨ x2) ∧ (¬x2 ∨ x3)
        formula.add_clause(Clause([Literal('x1')]))
        formula.add_clause(Clause([Literal('x1', negated=True), Literal('x2')]))
        formula.add_clause(Clause([Literal('x2', negated=True), Literal('x3')]))
        
        result = solver.solve(formula)
        self.assertIsNotNone(result)
        
        # 单子句传播应自动确定 x1=True, x2=True, x3=True
        self.assertEqual(result['x1'], True)
        self.assertEqual(result['x2'], True)
        self.assertEqual(result['x3'], True)
        
        # 检查统计
        stats = solver.get_stats()
        self.assertGreater(stats['unit_propagations'], 0)
    
    def test_pure_literal_elimination(self):
        """测试纯文字消除"""
        solver = DPLLSolver()
        formula = CNFFormula()
        
        # x1只出现正极性，x2只出现负极性
        formula.add_clause(Clause([Literal('x1'), Literal('x2', negated=True)]))
        formula.add_clause(Clause([Literal('x1')]))
        formula.add_clause(Clause([Literal('x2', negated=True)]))
        
        result = solver.solve(formula)
        self.assertIsNotNone(result)
        
        # 纯文字：x1=True, x2=False
        self.assertEqual(result['x1'], True)
        self.assertEqual(result['x2'], False)
    
    def test_large_formula(self):
        """测试较大公式"""
        solver = DPLLSolver()
        formula = CNFFormula()
        
        # 随机生成可满足的公式
        import random
        random.seed(42)
        
        vars = ['x' + str(i) for i in range(10)]
        
        # 确保可满足：添加一些宽松的子句
        for _ in range(20):
            clause_lits = []
            for v in random.sample(vars, 3):
                clause_lits.append(Literal(v, random.choice([True, False])))
            formula.add_clause(Clause(clause_lits))
        
        result = solver.solve(formula)
        self.assertIsNotNone(result)
        
        if result:
            is_valid, msg = verify_sat_solution(formula, result)
            self.assertTrue(is_valid, msg)
        
        stats = solver.get_stats()
        print(f"\n大公式统计: {stats}")
    
    def test_backtracking_stats(self):
        """测试回溯统计"""
        solver = DPLLSolver()
        formula = CNFFormula()
        
        # 需要回溯的公式
        formula.add_clause(Clause([Literal('x1'), Literal('x2')]))
        formula.add_clause(Clause([Literal('x1', negated=True), Literal('x2')]))
        formula.add_clause(Clause([Literal('x1'), Literal('x2', negated=True)]))
        
        result = solver.solve(formula)
        self.assertIsNotNone(result)
        
        stats = solver.get_stats()
        self.assertGreater(stats['branching_decisions'], 0)


def run_sat_demo():
    """演示SAT求解器"""
    print("=" * 60)
    print("SAT求解器演示（DPLL算法）")
    print("=" * 60)
    
    solver = DPLLSolver()
    
    # 案例1：简单可满足
    formula1 = CNFFormula()
    formula1.add_clause(Clause([Literal('x1'), Literal('x2')]))
    formula1.add_clause(Clause([Literal('x1', negated=True), Literal('x3')]))
    
    print("\n【案例1】简单可满足公式")
    print(f"公式: {formula1}")
    
    result1 = solver.solve(formula1)
    if result1:
        is_valid, msg = verify_sat_solution(formula1, result1)
        print(f"解: {result1}")
        print(f"验证: {msg}")
    else:
        print("不可满足")
    
    stats1 = solver.get_stats()
    print(f"统计: {stats1}")
    
    # 案例2：需要单子句传播
    formula2 = CNFFormula()
    formula2.add_clause(Clause([Literal('x1')]))
    formula2.add_clause(Clause([Literal('x1', negated=True), Literal('x2')]))
    formula2.add_clause(Clause([Literal('x2', negated=True), Literal('x3')]))
    
    print("\n【案例2】单子句传播")
    print(f"公式: {formula2}")
    
    result2 = solver.solve(formula2)
    if result2:
        print(f"解: {result2}")
        print("(单子句传播自动确定所有变量)")
    
    stats2 = solver.get_stats()
    print(f"统计: 单子句传播次数={stats2['unit_propagations']}")
    
    # 案例3：经典不可满足
    formula3 = CNFFormula()
    formula3.add_clause(Clause([Literal('x1'), Literal('x2')]))
    formula3.add_clause(Clause([Literal('x1', negated=True), Literal('x2')]))
    formula3.add_clause(Clause([Literal('x1'), Literal('x2', negated=True)]))
    formula3.add_clause(Clause([Literal('x1', negated=True), Literal('x2', negated=True)]))
    
    print("\n【案例3】经典不可满足")
    print(f"公式: {formula3}")
    
    result3 = solver.solve(formula3)
    print(f"结果: {result3 if result3 else '不可满足'}")


def compare_with_bruteforce(formula: CNFFormula) -> Tuple[Optional[Dict], Optional[Dict], Dict]:
    """
    比较DPLL与暴力枚举
    
    Returns:
        (DPLL解, 暴力解, 统计信息)
    """
    import time
    
    # DPLL求解
    solver = DPLLSolver()
    start_dpll = time.time()
    dpll_result = solver.solve(formula)
    dpll_time = time.time() - start_dpll
    dpll_stats = solver.get_stats()
    
    # 暴力枚举
    vars_list = list(formula.variables())
    start_brute = time.time()
    brute_result = None
    
    from itertools import product
    for assignment_tuple in product([True, False], repeat=len(vars_list)):
        assignment = dict(zip(vars_list, assignment_tuple))
        if formula.evaluate(assignment):
            brute_result = assignment
            break
    
    brute_time = time.time() - start_brute
    
    return dpll_result, brute_result, {
        'dpll_time': dpll_time,
        'brute_time': brute_time,
        'dpll_stats': dpll_stats,
        'vars': len(vars_list),
        'clauses': len(formula.clauses)
    }


if __name__ == "__main__":
    run_sat_demo()
    print("\n" + "=" * 60)
    print("运行单元测试...")
    print("=" * 60 + "\n")
    unittest.main(verbosity=2)
```

### 简化版SAT求解器（回溯法）

```python
def simple_sat_solver(
    clauses: List[List[Tuple[str, bool]]]
) -> Optional[Dict[str, bool]]:
    """
    简化的SAT求解器（回溯法）
    
    Args:
        clauses: 子句列表，每个子句是 [(变量, 是否否定)] 的列表
        
    Returns:
        如果可满足返回赋值字典，否则返回None
        
    示例:
        clauses = [
            [('x1', False), ('x2', True)],   # (x1 ∨ ¬x2)
            [('x1', True), ('x3', False)]    # (¬x1 ∨ x3)
        ]
    """
    # 收集所有变量
    variables = set()
    for clause in clauses:
        for var, _ in clause:
            variables.add(var)
    
    vars_list = list(variables)
    
    def evaluate_clause(clause: List[Tuple[str, bool]], assignment: Dict[str, bool]) -> Optional[bool]:
        """评估单个子句"""
        has_unassigned = False
        for var, negated in clause:
            if var not in assignment:
                has_unassigned = True
            else:
                value = assignment[var] if not negated else not assignment[var]
                if value:
                    return True
        return None if has_unassigned else False
    
    def evaluate_formula(assignment: Dict[str, bool]) -> Optional[bool]:
        """评估整个公式"""
        for clause in clauses:
            result = evaluate_clause(clause, assignment)
            if result == False:
                return False
            if result is None:
                return None
        return True
    
    def backtrack(assignment: Dict[str, bool], idx: int) -> Optional[Dict[str, bool]]:
        """回溯搜索"""
        if idx == len(vars_list):
            if evaluate_formula(assignment) == True:
                return assignment.copy()
            return None
        
        var = vars_list[idx]
        
        # 尝试True
        assignment[var] = True
        result = backtrack(assignment, idx + 1)
        if result:
            return result
        
        # 尝试False
        assignment[var] = False
        result = backtrack(assignment, idx + 1)
        if result:
            return result
        
        del assignment[var]
        return None
    
    return backtrack({}, 0)
```

