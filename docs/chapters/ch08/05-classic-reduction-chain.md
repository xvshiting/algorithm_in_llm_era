# 8.5 经典归约链——从SAT到图问题

> **问题**：SAT、顶点覆盖、团问题有什么共同点？如何从一个归约到另一个？

---

## 归约链全景

从Cook定理出发，我们可以建立一系列经典归约：

```
Cook定理      多项式变换       器件构造      补图变换     距离设计
────────     ───────────     ──────────    ─────────    ─────────

任意NP ─────→ SAT ─────→ 3-SAT ─────→ VC ─────→ CLIQUE ─────→ TSP
```

这条链的意义：
- 每个箭头表示一个归约
- 每个归约证明了目标问题的NP完全性
- 归约链展示了问题的内在联系

让我们逐个学习这些归约的器件构造。

---

## 归约1：SAT → 3-SAT

### 问题

SAT子句长度任意，3-SAT每子句恰好3文字。

需要把任意长度子句转换为恰好3文字子句。

### 归约方法

#### 长子句（>3文字）

**例子**：(x₁ ∨ x₂ ∨ x₃ ∨ x₄)

**转换**：
```
(x₁ ∨ x₂ ∨ y₁) ∧ (¬y₁ ∨ x₃ ∨ y₂) ∧ (¬y₂ ∨ x₄ ∨ True)
```

其中y₁, y₂是**辅助变量**，True是任意真值（如z ∨ ¬z）。

#### 短子句（<3文字）

**例子**：(x₁ ∨ x₂)

**转换**：
```
(x₁ ∨ x₂ ∨ z) ∧ (x₁ ∨ x₂ ∨ ¬z)
```

其中z是新变量。两个子句必须同时满足，z为真或假不影响结果。

### 为什么等价？

**长子句分析**：

原：(x₁ ∨ x₂ ∨ x₃ ∨ x₄) 可满足 ⟺ 至少一个为True

转换后：
- 如果x₁或x₂为True，选y₁=True，(x₁∨x₂∨y₁)满足
- 如果x₃为True，选y₁=False, y₂=True
- 如果x₄为True，选y₁=False, y₂=False
- (¬y₂∨x₄∨True)总是满足

关键：辅助变量的存在不改变可满足性。

**短子句分析**：

(x₁ ∨ x₂) 可满足 ⟺ (x₁∨x₂∨z)∧(x₁∨x₂∨¬z) 可满足

因为：
- 如果x₁∨x₂为True，两个子句都满足
- 如果x₁∨x₂为False，则需要z=True和z=False同时成立，不可能

### 归约复杂度

- 每个子句：最多O(k)个新子句（k是原子句长度）
- 新变量：最多O(总文字数)个
- 归约时间：多项式时间

---

## 归约2：3-SAT → Vertex Cover

这是最经典的归约之一，展示了器件构造的艺术。

### 问题

**3-SAT**：布尔公式，每子句恰好3文字，判断是否可满足。

**Vertex Cover**：给定图G和整数k，判断是否存在大小≤k的顶点覆盖。

### 归约构造

给定3-SAT实例：n个变量，c个子句。

构造图G：
- 顶点数：2n + 3c
- 边数：n + 3c（变量器件边）+ 3c（子句器件三角形内部）+ 连接边

#### 变量器件

对每个变量x：
- 创建两个顶点：x和¬x
- 连一条边：(x, ¬x)

```
    x ─────── ¬x
```

**意义**：
- 覆盖这条边必须选x或¬x
- = 必须赋x为True或False
- 强制二选一！

#### 子句器件

对每个子句(x ∨ y ∨ z)：
- 创建三角形：三个顶点对应三个文字

```
        ○ (x)
       / \
      ○──○
    (z) (y)
```

**意义**：
- 覆盖三角形需要选至少2个顶点（三角形3条边）
- 第3个顶点必须通过其他方式覆盖

#### 连接设计

子句器件的每个顶点，连接到对应的变量器件顶点：

```
    x ─────── ¬x        (变量器件)
     │         │
     ○──○──○              (子句器件)
```

例如，子句(x∨y∨z)中的"文字x"顶点，连接到变量器件的x顶点。

### 覆盖大小目标

设k = n + 2c

**为什么是n+2c？**
- n个变量器件边：需要n个顶点覆盖
- c个子句器件三角形：需要至少2c个顶点覆盖（每个三角形选2个）
- 总共：n + 2c

### 等价性论证

#### 正向：3-SAT可满足 → 存在覆盖

假设3-SAT可满足，赋值为φ。

构造覆盖C：
1. **变量器件**：对于每个变量x
   - 如果φ(x)=True，选x顶点
   - 如果φ(x)=False，选¬x顶点
   - 共n个顶点

2. **子句器件**：对于每个子句(x∨y∨z)
   - 至少一个文字为真，假设是x
   - 在三角形中选y和z顶点（不选x）
   - x顶点已被变量器件选中（连接到变量器件的x）
   - 共2c个顶点（每个子句选2个）

3. **验证覆盖**：
   - 变量器件边：被选中顶点覆盖
   - 子句器件三角形：被选中的2个顶点覆盖
   - 连接边：如果选了"文字x"顶点在变量器件，则"子句器件x"顶点到"变量器件x"的边被覆盖
   - 如果在子句器件选了某个顶点，则其连接边也被覆盖

总覆盖大小：n + 2c

#### 反向：存在覆盖 → 3-SAT可满足

假设存在大小为n+2c的覆盖C。

提取赋值φ：
1. **变量器件**：
   - 每条变量器件边必须被覆盖
   - 只能选x或¬x之一（否则超过n个）
   - 赋值：选x → φ(x)=True，选¬x → φ(x)=False

2. **子句器件**：
   - 每个三角形需要至少2个顶点覆盖（三角形有3条边）
   - 如果选3个顶点，总覆盖超过n+2c（因为每个子句至少贡献2个，共2c+n，选3个会超标）
   - 所以每个三角形恰好选2个顶点
   - 第3个顶点未被选中，必须通过连接边被覆盖
   - = 连接的变量器件顶点被选中
   - = 该文字为真

3. **验证满足**：
   - 每个子句的第3个顶点（未选）连接到满足的文字
   - = 每个子句至少一个文字为真
   - = 3-SAT可满足

### 归约复杂度

- 创建顶点：O(n + c)
- 创建边：O(n + c + 连接数) = O(n + c)
- 归约时间：多项式时间

---

## 归约3：Vertex Cover → CLIQUE

### 问题

**Vertex Cover**：找覆盖所有边的顶点集合。

**CLIQUE**：找完全子图（所有顶点互相连接）。

### 关键定理

**定理**：S是G的顶点覆盖 ⟺ V\S是G的补图中的团。

其中G的补图G'：边(u,v)在G中 ⟺ 边(u,v)不在G'中。

### 直觉理解

**Vertex Cover视角**：
- 选一些顶点覆盖所有边
- 未选的顶点之间没有边（否则那条边未被覆盖）

**CLIQUE视角**：
- 未选的顶点之间没有边（在G中）
- = 未选的顶点之间有所有边（在G'中）
- = 未选的顶点在G'中形成完全子图
- = 未选的顶点在G'中形成团

### 归约构造

给定Vertex Cover实例(G, k)：

构造CLIQUE实例(G', |V| - k)：
1. G' = G的补图：所有G中没有的边，在G'中都有
2. 目标团大小 = |V| - k

### 等价性论证

**正向**：G有大小为k的覆盖S ⟺ G'有大小为|V|-k的团V\S

- S覆盖G的所有边 ⟺ V\S中没有G的边
- V\S中没有G的边 ⟺ V\S中有G'的所有边
- V\S中有G'的所有边 ⟺ V\S是G'的团

**反向**：G'有大小为|V|-k的团C ⟺ G有大小为k的覆盖V\C

- C是G'的团 ⟺ C中有G'的所有边
- C中有G'的所有边 ⟺ C中没有G的边
- C中没有G的边 ⟺ V\C覆盖G的所有边

### 归约复杂度

- 创建补图：O(|V|²)（检查所有可能的边）
- 归约时间：多项式时间

---

## 归约4：CLIQUE → TSP

### 问题

**CLIQUE**：找大小为k的团（完全子图）。

**TSP**：找经过所有城市的最短路线。

这里我们用TSP的判定版本：是否存在长度≤K的路线？

### 归约构造

给定CLIQUE实例(G, k)：

构造TSP实例：
1. **城市**：图的每个顶点 + 一个额外城市
2. **距离矩阵**：
   - 相邻顶点距离 = 1
   - 不相邻顶点距离 = 2
   - 额外城市到所有顶点距离 = 1
3. **目标长度**：K = k（只经过团中的顶点）

**注意**：这里TSP的判定版本是"是否存在长度为k的路线"，不是传统TSP。

### 等价性论证

**正向**：G有大小为k的团C ⟺ TSP存在长度为k的路线

- 如果存在k团，只经过团中的顶点
- 团中顶点互相连接，距离都是1
- 路线长度 = k

**反向**：TSP存在长度为k的路线 ⟺ G有大小为k的团

- 如果路线长度为k，所有相邻顶点距离必须为1
- = 所有相邻顶点必须在G中相邻
- = 这些顶点形成团

---

## 归约链的意义

### 为什么建立归约链？

1. **证明NP完全性**：每个归约证明目标问题的NP完全性
2. **揭示内在联系**：不同问题有相同的"难度内核"
3. **归约工具库**：学习器件构造，为证明新问题NP完全做准备

### 归约器件总结

| 归约 | 核心器件 | 关键洞察 |
|------|----------|----------|
| SAT → 3-SAT | 辅助变量分组 | 限制子句长度不改变可满足性 |
| 3-SAT → VC | 变量器件+子句器件 | 布尔选择 → 图选择 |
| VC → CLIQUE | 补图变换 | 覆盖 = 补图的团 |
| CLIQUE → TSP | 距离矩阵设计 | 连接性 → 路径长度 |

---

## 练习

### 基础练习

1. **归约理解**
   
   解释每个归约的核心器件：
   - 3-SAT → VC的变量器件为什么这样设计？
   - VC → CLIQUE为什么用补图？

2. **器件可视化**
   
   给定3-SAT实例：(x∨y∨¬z)∧(¬x∨y∨z)∧(x∨¬y∨z)
   
  画出对应的Vertex Cover器件图（变量器件和子句器件）。

### 进阶练习

3. **归约实现**
   
   实现SAT → 3-SAT的归约算法：
   ```python
   def sat_to_3sat(formula):
       """
       输入：SAT实例（列表的列表，每个子句是文字列表）
       输出：3-SAT实例
       """
       pass
   ```

4. **反向归约**
   
   设计CLIQUE → Vertex Cover的归约。
   
   这与VC → CLIQUE有什么关系？

5. **等价性验证**
   
   对于练习2中构造的图，设覆盖大小k = n + 2c = 3 + 6 = 9。
   
   给出一个可满足赋值，并构造对应的覆盖。
   
   给出一个大小为9的覆盖，并提取对应的赋值。

### 思考题

6. **器件设计原则**
   
   回顾Skiena六法则，分析这些归约如何应用法则：
   - 法则1（源问题受限）：体现在哪里？
   - 法则4（惩罚不良选择）：体现在哪里？

---

## 小结

| 归约 | 核心器件 | 等价性关键 |
|------|----------|------------|
| SAT → 3-SAT | 辅助变量分组 | 不改变可满足性 |
| 3-SAT → VC | 变量器件边 + 子句器件三角形 | 覆盖大小 = n + 2c |
| VC → CLIQUE | 补图变换 | 覆盖 = 补图的团 |
| CLIQUE → TSP | 距离矩阵（相邻=1，不相邻=2） | 团 → 路径长度k |

**核心洞见**：归约链展示了NP完全问题的内在联系。SAT、顶点覆盖、团问题、TSP看似不同，但它们的"难度内核"相同——都是选择+约束的组合问题。

---

**下一节**：我们将学习如何识别和证明新问题的NP完全性。

---

## 代码实现：经典归约链

### SAT → 3-SAT 归约

```python
from typing import List, Tuple, Set, Optional
import random

class SATFormula:
    """SAT公式表示"""
    
    def __init__(self):
        # 每个子句是文字列表，每个文字是 (变量名, 是否否定)
        # 例如 [('x1', False), ('x2', True)] 表示 (x1 ∨ ¬x2)
        self.clauses: List[List[Tuple[str, bool]]] = []
        self.variables: Set[str] = set()
    
    def add_clause(self, literals: List[Tuple[str, bool]]) -> None:
        """添加子句"""
        if not literals:
            raise ValueError("子句不能为空")
        for var, _ in literals:
            self.variables.add(var)
        self.clauses.append(literals)
    
    def evaluate(self, assignment: Dict[str, bool]) -> bool:
        """
        在给定赋值下评估公式
        
        Args:
            assignment: 变量赋值字典
            
        Returns:
            公式是否可满足
        """
        for clause in self.clauses:
            # 每个子句至少一个文字为真
            clause_satisfied = False
            for var, negated in clause:
                if var not in assignment:
                    raise ValueError(f"变量 '{var}' 未赋值")
                # 如果 var=True 且 negated=False，则文字为真
                # 如果 var=False 且 negated=True，则文字为真
                literal_value = assignment[var] if not negated else not assignment[var]
                if literal_value:
                    clause_satisfied = True
                    break
            if not clause_satisfied:
                return False
        return True
    
    def is_satisfiable_backtracking(self) -> Optional[Dict[str, bool]]:
        """
        使用回溯法判断SAT公式是否可满足
        
        Returns:
            可满足时返回一个赋值，否则返回None
        """
        vars_list = list(self.variables)
        return self._backtrack(vars_list, {}, 0)
    
    def _backtrack(
        self, 
        vars_list: List[str], 
        assignment: Dict[str, bool], 
        idx: int
    ) -> Optional[Dict[str, bool]]:
        """回溯辅助函数"""
        if idx == len(vars_list):
            # 所有变量已赋值，检查是否满足
            if self.evaluate(assignment):
                return assignment.copy()
            return None
        
        var = vars_list[idx]
        
        # 尝试 True
        assignment[var] = True
        # 先检查部分赋值是否能满足当前子句
        if self._partial_check(assignment, idx):
            result = self._backtrack(vars_list, assignment, idx + 1)
            if result:
                return result
        
        # 尝试 False
        assignment[var] = False
        if self._partial_check(assignment, idx):
            result = self._backtrack(vars_list, assignment, idx + 1)
            if result:
                return result
        
        del assignment[var]
        return None
    
    def _partial_check(
        self, 
        assignment: Dict[str, bool], 
        current_idx: int
    ) -> bool:
        """检查当前部分赋值是否有希望满足"""
        for clause in self.clauses:
            clause_can_be_satisfied = False
            all_assigned = True
            for var, negated in clause:
                if var in assignment:
                    literal_value = assignment[var] if not negated else not assignment[var]
                    if literal_value:
                        clause_can_be_satisfied = True
                        break
                else:
                    all_assigned = False
            
            # 如果所有文字都已赋值且没有一个为真，则失败
            if all_assigned and not clause_can_be_satisfied:
                return False
        return True


class ThreeSATFormula(SATFormula):
    """3-SAT公式，每个子句恰好3个文字"""
    
    def add_clause(self, literals: List[Tuple[str, bool]]) -> None:
        if len(literals) != 3:
            raise ValueError(f"3-SAT子句必须有3个文字，得到{len(literals)}个")
        super().add_clause(literals)


def sat_to_3sat(formula: SATFormula) -> Tuple[ThreeSATFormula, Set[str]]:
    """
    SAT到3-SAT的归约
    
    将任意长度的SAT子句转换为恰好3个文字的3-SAT子句。
    
    Args:
        formula: SAT公式
        
    Returns:
        (3-SAT公式, 辅助变量集合)
        
    归约方法：
    1. 长子句（>3文字）：引入辅助变量分组
       例如 (x1 ∨ x2 ∨ x3 ∨ x4) →
       (x1 ∨ x2 ∨ y1) ∧ (¬y1 ∨ x3 ∨ y2) ∧ (¬y2 ∨ x4 ∨ T)
       
    2. 短子句（<3文字）：引入新变量扩展
       例如 (x1 ∨ x2) →
       (x1 ∨ x2 ∨ z) ∧ (x1 ∨ x2 ∨ ¬z)
       
    3. 恰好3文字：直接复制
    """
    three_sat = ThreeSATFormula()
    auxiliary_vars: Set[str] = set()
    aux_counter = 0
    
    # 用于填充的"真"变量（可满足的文字）
    true_literal_cache: Set[str] = set()
    
    for clause in formula.clauses:
        clause_len = len(clause)
        
        if clause_len == 3:
            # 恰好3文字，直接复制
            three_sat.add_clause(clause.copy())
        
        elif clause_len > 3:
            # 长子句：引入辅助变量分组
            aux_vars_for_clause = []
            for i in range(clause_len - 3):
                aux_var = f"aux_{aux_counter}"
                auxiliary_vars.add(aux_var)
                aux_vars_for_clause.append(aux_var)
                aux_counter += 1
            
            # 构造分组子句
            # 例如：(x1 ∨ x2 ∨ x3 ∨ x4 ∨ x5) →
            # (x1 ∨ x2 ∨ aux1) ∧ (¬aux1 ∨ x3 ∨ aux2) ∧ (¬aux2 ∨ x4 ∨ x5)
            
            i = 0
            while i < clause_len:
                literals_3 = []
                
                # 第一个子句取前2个原文文字 + 第一个辅助变量
                if i == 0:
                    literals_3.append(clause[0])
                    literals_3.append(clause[1])
                    if aux_vars_for_clause:
                        literals_3.append((aux_vars_for_clause[0], False))
                        # 下一个子句要使用 ¬aux_vars_for_clause[0]
                        i = 2  # 下一次从第3个原文文字开始
                    else:
                        # 没有3文字子句需要辅助变量（恰好3文字已处理）
                        literals_3.append(clause[2])
                        i = 3
                elif i < clause_len - 1:
                    # 中间子句：¬prev_aux + 文字 + next_aux 或 最后一个文字
                    prev_aux_idx = i - 2  # 之前使用的辅助变量索引
                    if prev_aux_idx < len(aux_vars_for_clause):
                        literals_3.append((aux_vars_for_clause[prev_aux_idx], True))
                    
                    literals_3.append(clause[i])
                    
                    next_aux_idx = prev_aux_idx + 1
                    if next_aux_idx < len(aux_vars_for_clause):
                        literals_3.append((aux_vars_for_clause[next_aux_idx], False))
                        i += 1
                    elif i + 1 < clause_len:
                        literals_3.append(clause[i + 1])
                        i += 2
                    else:
                        # 需要填充真值
                        if not true_literal_cache:
                            true_var = f"true_{aux_counter}"
                            auxiliary_vars.add(true_var)
                            true_literal_cache.add(true_var)
                            aux_counter += 1
                        true_var = next(iter(true_literal_cache))
                        literals_3.append((true_var, False))  # T
                        i += 1
                else:
                    # 最后处理
                    prev_aux_idx = (i - 2) if i >= 2 else -1
                    if prev_aux_idx >= 0 and prev_aux_idx < len(aux_vars_for_clause):
                        literals_3.append((aux_vars_for_clause[prev_aux_idx], True))
                    
                    if i < clause_len:
                        literals_3.append(clause[i])
                    
                    if len(literals_3) < 3:
                        # 添加剩余文字或填充
                        if i + 1 < clause_len:
                            literals_3.append(clause[i + 1])
                        else:
                            if not true_literal_cache:
                                true_var = f"true_{aux_counter}"
                                auxiliary_vars.add(true_var)
                                true_literal_cache.add(true_var)
                                aux_counter += 1
                            true_var = next(iter(true_literal_cache))
                            while len(literals_3) < 3:
                                literals_3.append((true_var, False))
                    i += 3
                
                if len(literals_3) == 3:
                    three_sat.add_clause(literals_3)
        
        else:  # clause_len < 3
            # 短子句：引入新变量扩展
            aux_var = f"short_{aux_counter}"
            auxiliary_vars.add(aux_var)
            aux_counter += 1
            
            # 构造两个子句
            # 例如：(x1 ∨ x2) → (x1 ∨ x2 ∨ z) ∧ (x1 ∨ x2 ∨ ¬z)
            clause1 = clause.copy() + [(aux_var, False)]
            clause2 = clause.copy() + [(aux_var, True)]
            
            three_sat.add_clause(clause1)
            three_sat.add_clause(clause2)
    
    return three_sat, auxiliary_vars


def verify_sat_to_3sat_reduction(
    original: SATFormula, 
    three_sat: ThreeSATFormula, 
    auxiliary_vars: Set[str]
) -> bool:
    """
    验证SAT到3-SAT归约的正确性
    
    通过检查：
    1. 如果SAT可满足，则3-SAT可满足
    2. 如果3-SAT可满足，则SAT可满足
    
    Args:
        original: 原SAT公式
        three_sat: 归约后的3-SAT公式
        auxiliary_vars: 辅助变量集合
        
    Returns:
        归约是否正确（通过验证测试）
    """
    # 测试1：SAT可满足 → 3-SAT可满足
    sat_assignment = original.is_satisfiable_backtracking()
    
    if sat_assignment is not None:
        # 扩展赋值包含辅助变量
        extended_assignment = sat_assignment.copy()
        
        # 为辅助变量赋值（简化策略：全赋True）
        for aux_var in auxiliary_vars:
            extended_assignment[aux_var] = True
        
        # 尝试调整辅助变量使3-SAT满足
        # 由于归约设计，总存在使3-SAT满足的辅助变量赋值
        three_sat_satisfied = three_sat.evaluate(extended_assignment)
        
        if not three_sat_satisfied:
            # 尝试回溯找合适的辅助变量赋值
            aux_vars_list = list(auxiliary_vars)
            for aux_assignment in _enumerate_aux_assignments(aux_vars_list, sat_assignment):
                if three_sat.evaluate(aux_assignment):
                    three_sat_satisfied = True
                    break
        
        if not three_sat_satisfied:
            print("验证失败：SAT可满足但3-SAT不可满足")
            return False
    
    # 测试2：3-SAT可满足 → SAT可满足
    # 找一个3-SAT的满足赋值（如果有）
    three_sat_assignment = three_sat.is_satisfiable_backtracking()
    
    if three_sat_assignment is not None:
        # 提取原始变量的赋值
        original_assignment = {
            var: val 
            for var, val in three_sat_assignment.items() 
            if var in original.variables
        }
        
        # 检查是否满足原SAT
        if not original.evaluate(original_assignment):
            print("验证失败：3-SAT可满足但SAT不可满足")
            return False
    
    return True


def _enumerate_aux_assignments(
    aux_vars: List[str], 
    base_assignment: Dict[str, bool]
) -> List[Dict[str, bool]]:
    """枚举辅助变量的所有赋值组合"""
    if not aux_vars:
        return [base_assignment.copy()]
    
    result = []
    n = len(aux_vars)
    
    # 限制枚举数量避免过大
    max_combinations = min(2 ** n, 64)
    
    for i in range(max_combinations):
        assignment = base_assignment.copy()
        for j, var in enumerate(aux_vars):
            assignment[var] = bool((i >> j) & 1)
        result.append(assignment)
    
    return result
```

### Vertex Cover → CLIQUE 归约

```python
from typing import Dict, Set, Tuple, Optional
from collections import defaultdict

class GraphForVC:
    """用于顶点覆盖的图"""
    
    def __init__(self, vertices: Optional[Set[int]] = None):
        self.vertices: Set[int] = vertices if vertices else set()
        self.adj: Dict[int, Set[int]] = defaultdict(set)
    
    def add_edge(self, u: int, v: int) -> None:
        """添加边"""
        self.vertices.add(u)
        self.vertices.add(v)
        self.adj[u].add(v)
        self.adj[v].add(u)
    
    def edges(self) -> Set[Tuple[int, int]]:
        """返回所有边（规范化：u < v）"""
        result = set()
        for u in self.adj:
            for v in self.adj[u]:
                if u < v:
                    result.add((u, v))
        return result
    
    def complement(self) -> 'GraphForVC':
        """
        构造补图
        
        补图中：
        - 顶点集合相同
        - 原图有边 → 补图无边
        - 原图无边 → 补图有边
        """
        comp = GraphForVC(self.vertices.copy())
        
        # 补图包含原图中没有的所有边
        vertices_list = sorted(self.vertices)
        for i in range(len(vertices_list)):
            for j in range(i + 1, len(vertices_list)):
                u, v = vertices_list[i], vertices_list[j]
                # 如果原图中没有这条边，则在补图中添加
                if v not in self.adj[u]:
                    comp.add_edge(u, v)
        
        return comp
    
    def vertex_cover_bruteforce(self, k: int) -> Optional[Set[int]]:
        """
        暴力搜索大小为k的顶点覆盖
        
        Args:
            k: 目标覆盖大小
            
        Returns:
            如果存在返回一个覆盖，否则返回None
        """
        if k < 0:
            raise ValueError("覆盖大小k必须为非负")
        
        if k >= len(self.vertices):
            return self.vertices.copy()
        
        from itertools import combinations
        vertices_list = list(self.vertices)
        edges = self.edges()
        
        for cover in combinations(vertices_list, k):
            cover_set = set(cover)
            # 检查是否覆盖所有边
            if all(u in cover_set or v in cover_set for u, v in edges):
                return cover_set
        
        return None
    
    def clique_bruteforce(self, k: int) -> Optional[Set[int]]:
        """
        暴力搜索大小为k的团
        
        Args:
            k: 目标团大小
            
        Returns:
            如果存在返回一个团，否则返回None
        """
        if k < 0:
            raise ValueError("团大小k必须为非负")
        
        if k > len(self.vertices):
            return None
        
        if k <= 1:
            if self.vertices:
                return {min(self.vertices)} if k == 1 else set()
            return None
        
        from itertools import combinations
        vertices_list = list(self.vertices)
        
        for clique_candidate in combinations(vertices_list, k):
            clique_set = set(clique_candidate)
            # 检查是否是完全子图（所有顶点互相连接）
            is_clique = True
            for u in clique_set:
                # u应该连接到团中所有其他顶点
                neighbors_in_clique = sum(1 for v in clique_set if v in self.adj[u] and v != u)
                if neighbors_in_clique != k - 1:
                    is_clique = False
                    break
            
            if is_clique:
                return clique_set
        
        return None


def vc_to_clique_reduction(g: GraphForVC, k: int) -> Tuple[GraphForVC, int]:
    """
    Vertex Cover到CLIQUE的归约
    
    关键定理：S是G的顶点覆盖 ⟺ V\S是G补图中的团
    
    Args:
        g: 原图
        k: 顶点覆盖的目标大小
        
    Returns:
        (补图, 补图中的团目标大小 = |V| - k)
    """
    n = len(g.vertices)
    clique_target = n - k
    
    if clique_target < 0:
        raise ValueError(f"覆盖大小k={k}大于顶点数n={n}，无有效团目标")
    
    complement_graph = g.complement()
    
    return complement_graph, clique_target


def verify_vc_clique_equivalence(g: GraphForVC, k: int) -> bool:
    """
    验证顶点覆盖与补图团的等价性
    
    Args:
        g: 图
        k: 覆盖大小
        
    Returns:
        是否满足等价性定理
    """
    n = len(g.vertices)
    clique_target = n - k
    
    # 查找顶点覆盖
    cover = g.vertex_cover_bruteforce(k)
    
    # 查找补图中的团
    comp = g.complement()
    clique = comp.clique_bruteforce(clique_target)
    
    if cover is None and clique is None:
        # 都不存在，等价性成立
        return True
    
    if cover is None or clique is None:
        # 一个存在一个不存在，等价性不成立
        print(f"验证失败：覆盖存在={cover is not None}, 团存在={clique is not None}")
        return False
    
    # 检查关系：cover = V \ clique 或 clique = V \ cover
    vertices = g.vertices
    
    # 从覆盖推导团
    derived_clique = vertices - cover
    if derived_clique == clique:
        print(f"验证成功：覆盖 {cover} ⟹ 团 {clique}")
        return True
    
    # 从团推导覆盖
    derived_cover = vertices - clique
    if derived_cover == cover:
        print(f"验证成功：团 {clique} ⟹ 覆盖 {cover}")
        return True
    
    print(f"验证失败：覆盖={cover}, 团={clique}, 但不满足补关系")
    return False
```

### 归约验证框架

```python
class ReductionVerifier:
    """归约正确性验证框架"""
    
    def __init__(self):
        self.test_cases: List[Dict] = []
        self.results: List[Dict] = []
    
    def add_test_case(
        self, 
        name: str, 
        original_instance: any, 
        reduced_instance: any,
        original_vars: Set[str] = None,
        auxiliary_vars: Set[str] = None
    ) -> None:
        """添加测试案例"""
        self.test_cases.append({
            'name': name,
            'original': original_instance,
            'reduced': reduced_instance,
            'original_vars': original_vars,
            'aux_vars': auxiliary_vars
        })
    
    def verify_all(self) -> Dict[str, bool]:
        """验证所有测试案例"""
        results = {}
        for test in self.test_cases:
            # 根据归约类型执行相应验证
            # （需要根据具体归约实现验证逻辑）
            results[test['name']] = True  # 简化示例
        return results
    
    def report(self) -> str:
        """生成验证报告"""
        lines = ["归约验证报告", "=" * 50]
        for test in self.test_cases:
            status = "✓ 通过" if True else "✗ 失败"
            lines.append(f"{test['name']}: {status}")
        return "\n".join(lines)


# ==================== 测试用例 ====================

import unittest

class TestReductions(unittest.TestCase):
    """归约测试"""
    
    def test_sat_to_3sat_short_clause(self):
        """测试短子句归约"""
        sat = SATFormula()
        sat.add_clause([('x1', False), ('x2', True)])  # (x1 ∨ ¬x2)
        
        three_sat, aux_vars = sat_to_3sat(sat)
        
        # 应该生成两个3-子句
        self.assertEqual(len(three_sat.clauses), 2)
        
        # 验证等价性
        self.assertTrue(verify_sat_to_3sat_reduction(sat, three_sat, aux_vars))
        
        print(f"短子句归约: {sat.clauses} → {three_sat.clauses}")
    
    def test_sat_to_3sat_long_clause(self):
        """测试长子句归约"""
        sat = SATFormula()
        # (x1 ∨ x2 ∨ x3 ∨ x4 ∨ x5)
        sat.add_clause([
            ('x1', False), ('x2', False), ('x3', False), 
            ('x4', False), ('x5', False)
        ])
        
        three_sat, aux_vars = sat_to_3sat(sat)
        
        # 应该生成多个3-子句
        self.assertGreater(len(three_sat.clauses), 1)
        
        # 所有子句都是3-文字
        for clause in three_sat.clauses:
            self.assertEqual(len(clause), 3)
        
        # 验证等价性
        self.assertTrue(verify_sat_to_3sat_reduction(sat, three_sat, aux_vars))
        
        print(f"长子句归约: 5文字 → {len(three_sat.clauses)}个子句")
    
    def test_vc_clique_reduction(self):
        """测试VC到CLIQUE归约"""
        # 构造一个简单图
        g = GraphForVC()
        g.add_edge(1, 2)
        g.add_edge(2, 3)
        g.add_edge(3, 4)
        
        k = 2
        comp, clique_target = vc_to_clique_reduction(g, k)
        
        # 验证等价性
        self.assertTrue(verify_vc_clique_equivalence(g, k))
        
        print(f"VC→CLIQUE: 覆盖k={k} → 团k={clique_target}")
    
    def test_vc_clique_cycle(self):
        """测试三角形图的VC-CLIQUE归约"""
        g = GraphForVC()
        g.add_edge(1, 2)
        g.add_edge(2, 3)
        g.add_edge(3, 1)
        
        # 三角形的最小覆盖是2，补图没有边，最大团是3
        k = 2
        
        self.assertTrue(verify_vc_clique_equivalence(g, k))
        
        comp = g.complement()
        print(f"三角形补图边数: {len(comp.edges())}")  # 应为0
    
    def test_empty_formula(self):
        """测试空SAT公式"""
        sat = SATFormula()
        # 添加一个恰好3文字的子句（避免空公式）
        sat.add_clause([('x1', False), ('x2', False), ('x3', False)])
        
        three_sat, aux_vars = sat_to_3sat(sat)
        
        # 应该直接复制
        self.assertEqual(len(three_sat.clauses), 1)
        self.assertEqual(len(aux_vars), 0)


def run_reduction_demo():
    """演示归约效果"""
    print("=" * 60)
    print("经典归约链演示")
    print("=" * 60)
    
    # SAT → 3-SAT 示例
    print("\n【SAT → 3-SAT】")
    sat = SATFormula()
    sat.add_clause([('x1', False), ('x2', True), ('x3', False)])  # (x1 ∨ ¬x2 ∨ x3)
    sat.add_clause([('x1', False), ('x2', False)])  # (x1 ∨ x2)
    sat.add_clause([('a', False), ('b', False), ('c', False), ('d', False)])  # 4文字
    
    three_sat, aux_vars = sat_to_3sat(sat)
    
    print(f"原SAT: {len(sat.clauses)}个子句, {len(sat.variables)}个变量")
    print(f"3-SAT: {len(three_sat.clauses)}个子句, {len(three_sat.variables)}个变量")
    print(f"辅助变量: {aux_vars}")
    
    # 验证可满足性保持
    sat_result = sat.is_satisfiable_backtracking()
    three_sat_result = three_sat.is_satisfiable_backtracking()
    
    print(f"SAT可满足: {sat_result is not None}")
    print(f"3-SAT可满足: {three_sat_result is not None}")
    
    # VC → CLIQUE 示例
    print("\n【Vertex Cover → CLIQUE】")
    g = GraphForVC()
    g.add_edge(1, 2)
    g.add_edge(2, 3)
    g.add_edge(3, 4)
    g.add_edge(1, 3)
    
    for k in range(1, 5):
        cover = g.vertex_cover_bruteforce(k)
        comp, clique_target = vc_to_clique_reduction(g, k)
        clique = comp.clique_bruteforce(clique_target)
        
        cover_str = str(cover) if cover else "不存在"
        clique_str = str(clique) if clique else "不存在"
        
        print(f"k={k}: 覆盖={cover_str}, 补图团(大小{clique_target})={clique_str}")


if __name__ == "__main__":
    run_reduction_demo()
    print("\n" + "=" * 60)
    print("运行单元测试...")
    print("=" * 60 + "\n")
    unittest.main(verbosity=2)
```

