# 8.4 归约——问题间的翻译艺术

> **问题**：如何证明一个问题不比另一个问题更容易？

---

## War Story：如何证明新问题是NP完全的？

某公司的面试题出了一个新的优化问题，HR想知道这个问题有多难。小张回忆起算法课学过的NP完全性理论，但不知道怎么证明这个新问题是NP完全的。

关键方法：**归约**。

归约就像翻译——把一个问题的语言，翻译成另一个问题的语言，同时保持问题的"难度"。

---

## 归约的本质

### 什么是归约？

**定义**：问题A可归约到问题B（记作A ≤ₚ B），如果存在多项式时间算法f，使得：

```
对于A的任意实例x，A(x) = B(f(x))
```

即：
- 把A的实例x转换为B的实例f(x)
- f(x)的解就是x的解
- 变换过程在多项式时间内完成

### 为什么归约有效？

归约保持了问题的"难度"：

```
如果A ≤ₚ B，且B有多项式时间算法，
则A也有多项式时间算法。
```

**证明**：
1. 给定A的实例x
2. 用多项式时间转换为B的实例f(x)
3. 用B的多项式时间算法求解f(x)
4. 总时间：多项式 + 多项式 = 多项式

### 反向结论

```
如果A ≤ₚ B，且A没有多项式时间算法（假设），
则B也没有多项式时间算法。
```

这就是NP完全性证明的核心：用已知困难问题A，证明新问题B也困难。

---

## 归约的直观理解：翻译

### 翻译类比

想象你要证明"中文考试不比英文考试更容易"。

方法：
1. 给定一份中文试卷
2. 翻译成英文试卷（多项式时间）
3. 如果英文试卷能快速解出，则中文试卷也能快速解出

关键：翻译过程不能改变问题的难度。

### 归约的翻译艺术

归约就是：
- 把A的"问题语言"翻译成B的"问题语言"
- 保持问题的本质（是否有解）
- 确保翻译不增加难度

**例子**：
- SAT的"变量赋值" → 顶点覆盖的"顶点选择"
- SAT的"子句满足" → 顶点覆盖的"边覆盖"

---

## Skiena归约六法则

Steve Skiena总结了六条实用的归约法则，被称为**Skiena六法则**：

### 法则1：源问题尽可能受限

**原理**：受限版本更简单，更容易构造器件。

**例子**：
- 用3-SAT而非SAT（每子句恰好3文字）
- 受限版本减少了需要考虑的情况

**原因**：
- SAT子句长度任意，情况复杂
- 3-SAT子句长度固定，器件设计简单
- 受限源问题 → 更容易找到对应关系

### 法则2：目标问题尽可能一般

**原理**：一般版本有更多自由度，更容易归约到。

**例子**：
- 归约到Vertex Cover而非"3-Vertex Cover"
- 增加自由度让器件设计更灵活

**原因**：
- 目标问题的自由度可以"吸收"源问题的约束
- 不要过度约束目标问题

### 法则3：从四核心源选择

**四核心源问题**：

| 源问题 | 适用场景 | 特点 |
|--------|----------|------|
| **3-SAT** | 逻辑、选择、约束满足 | 布尔器件构造 |
| **整数划分** | 分配、分割、数值问题 | 数值器件构造 |
| **顶点覆盖** | 图问题、覆盖、选择问题 | 图器件构造 |
| **哈密顿路径** | 路径、环、序列问题 | 路径器件构造 |

**决策树**：
- 问题涉及布尔约束？→ 选择3-SAT
- 问题涉及数值分配？→ 选择整数划分
- 问题涉及图结构？→ 选择顶点覆盖
- 问题涉及路径/环？→ 选择哈密顿路径

### 法则4：大胆放大不良选择的惩罚

**原理**：确保只有正确选择才可行。

**例子**：
- 3-SAT → Vertex Cover：变量器件确保只能选x或¬x之一
- 用大权重、特殊结构强制约束

**原因**：
- 归约要保持等价性
- 错误选择在源问题中导致失败
- 必须在目标问题中也导致失败
- "惩罚"机制确保这一点

### 法则5：先想战略再构小器件

**步骤**：
1. 理解两个问题的核心结构
2. 设计整体布局（战略）
3. 构造关键器件（战术）
4. 连接器件确保正确性

**避免**：一开始就陷入器件细节，没有全局视角。

### 法则6：卡住时切换视角

**原理**：两种视角互相启发。

- 找算法失败 → 发现问题的难度结构
- 证明难性失败 → 发现问题的特殊结构
- 切换视角有助于突破思维瓶颈

---

## 归约构造的思维过程

让我们用一个例子展示归约的思维过程：**3-SAT → Vertex Cover**。

### 第一步：理解问题核心

**3-SAT的核心**：
- 每个变量选真或假
- 每个子句至少一个文字为真

**Vertex Cover的核心**：
- 选择一些顶点
- 每条边至少一个端点被选中

### 第二步：战略设计——寻找对应关系

关键问题：如何对应？

| 3-SAT | Vertex Cover |
|-------|--------------|
| 变量选择（真/假） | 顶点选择（在覆盖中/不在） |
| 每个子句满足 | 每条边被覆盖 |
| 约束：只能选真或假 | 约束：必须覆盖所有边 |

初步想法：
- 变量 → 顶点？
- 子句 → 边？

但这里有问题：
- 变量只能选真或假（二选一）
- 顶点可以选择或不选择（任意）

需要器件来强制二选一！

### 第三步：器件构造

#### 变量器件

**目标**：确保只能选一个真值。

**构造**：
- 对每个变量x，创建两个顶点：x和¬x
- 在x和¬x之间连一条边

```
x ─────── ¬x
```

**为什么这样构造？**
- 要覆盖这条边，必须选x或¬x之一
- = 必须给x赋真或假
- 强制了二选一！

#### 子句器件

**目标**：确保至少一个文字为真。

**构造**：
- 对每个子句(x ∨ y ∨ z)，创建一个三角形
- 三角形的三个顶点对应三个文字

```
    文字x
   /    \
文字z ── 文字y
```

**覆盖策略**：
- 覆盖三角形需要选至少2个顶点（三角形有3条边）
- 第3个顶点必须通过连接到满足的文字来覆盖

**连接设计**：
- 子句器件的每个顶点，连接到对应的变量器件顶点
- 例如，子句(x ∨ y ∨ z)中的"文字x"顶点，连接到变量器件的x顶点

### 第四步：等价性论证

#### 正向：3-SAT可满足 → 存在覆盖

假设3-SAT可满足，赋值为φ。

构造覆盖：
- 变量器件：对于每个变量x，如果φ(x)=True，选x；否则选¬x
- 共n个顶点覆盖所有变量器件边

- 子句器件：对于每个子句，选2个顶点
- 但第3个顶点连接到满足的文字，那个顶点已被选中
- 共2c个顶点（每个子句选2个）

总覆盖大小：n + 2c

#### 反向：存在覆盖 → 3-SAT可满足

假设存在大小为n + 2c的覆盖。

从覆盖提取赋值：
- 每个变量器件边必须被覆盖，所以x或¬x之一被选中
- 这给出变量赋值：选x → True，选¬x → False

验证子句满足：
- 每个子句器件三角形需要至少2个顶点
- 第3个顶点必须被覆盖，但三角形内部只需2个
- 所以第3个顶点必须通过连接到变量器件来覆盖
- = 对应的文字顶点被选中
- = 该文字为真

### 第五步：复杂度分析

归约时间：
- 创建变量器件：O(n)
- 创建子句器件：O(c)
- 创建连接：O(c × 3) = O(c)

总时间：O(n + c) = 多项式时间

---

## LLM辅助归约验证

### LLM能做什么？

LLM可以验证归约的正确性：

1. **检查器件构造**：是否覆盖所有变量和子句
2. **验证等价性论证**：正向和反向证明是否完整
3. **检查边界条件**：空输入、极端情况等

### LLM不能做什么？

LLM难以创造新归约：
- 归约器件设计需要深刻理解问题结构
- 这是NP困难的工作（创造性思维）
- LLM可能在指数级器件组合中挣扎

### 人机协作模式

```
┌─────────────────────────────────────────────────────┐
│  归约设计的人机协作                                  │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  人类：                                             │
│  ├── 选择源问题（四核心源）                         │
│  ├── 设计战略（整体对应关系）                       │
│  ├── 构造关键器件                                   │
│  └── 论证等价性                                     │
│                                                     │
│  LLM：                                              │
│  ├── 验证器件覆盖完整性                             │
│  ├── 检查等价性论证漏洞                             │
│  ├── 生成反例测试边界条件                           │
│  └── 辅助表述证明过程                               │
│                                                     │
│  关键分工：                                         │
│  人类做战略设计（创造性）                           │
│  LLM做细节验证（验证性）                            │
└─────────────────────────────────────────────────────┘
```

---

## 练习

### 基础练习

1. **理解归约**
   
   用翻译类比解释归约：为什么"翻译"能保持问题难度？
   给出A ≤ₚ B但B ≤ₚ A不成立的例子。

2. **Skiena法则分析**
   
   分析以下归约构造是否符合Skiena法则：
   
   "把SAT的每个变量变成一个顶点，每个子句变成一条边"
   
   这个构造有什么问题？如何修正？

### 进阶练习

3. **归约设计**
   
   设计SAT到3-SAT的归约：
   - 如何处理长子句（超过3文字）？
   - 如何处理短子句（少于3文字）？
   - 证明转化前后可满足性等价。

4. **错误诊断**
   
   诊断以下归约构造的错误：
   
   "CLIQUE到Vertex Cover的归约：把每个顶点变成一条边"
   
   正确的归约是什么？（提示：补图变换）

### 开放设计

5. **设计归约**
   
   选择一个你熟悉的问题，设计从3-SAT到它的归约。
   
   要求：
   - 说明器件构造
   - 论证等价性（正向和反向）
   - 分析归约时间复杂度

6. **LLM协同实验**
   
   让LLM验证你设计的归约的正确性。
   
   评价：
   - LLM发现了哪些问题？
   - LLM遗漏了哪些问题？
   - 如何改进人机协作流程？

---

## 小结

| 概念 | 要点 |
|------|------|
| **归约** | 问题间的翻译，保持难度 |
| **A ≤ₚ B** | A可多项式时间归约到B |
| **器件构造** | 归约的核心，建立对应关系 |
| **等价性论证** | 正向和反向证明 |
| **Skiena六法则** | 实用归约技巧 |
| **人机协作** | 人类设计战略，LLM验证细节 |

**核心洞见**：归约是证明问题相对难度的工具。通过"翻译"，我们可以用已知困难问题证明新问题也困难。

---

**下一节**：我们将学习经典归约链——从SAT到图问题的完整器件构造展示。

---

## 代码实现：归约验证器

### 归约正确性检查框架

```python
from typing import Callable, Any, Tuple, List, Optional, Dict, Set
import time

class ReductionProof:
    """归约证明的记录"""
    
    def __init__(
        self, 
        source_problem: str, 
        target_problem: str,
        reduction_func: Callable,
        verifier_func: Callable
    ):
        self.source_problem = source_problem
        self.target_problem = target_problem
        self.reduction_func = reduction_func
        self.verifier_func = verifier_func
        self.test_results: List[Dict] = []
        self.verified = False
    
    def add_test_result(
        self, 
        source_instance: Any,
        target_instance: Any,
        source_satisfiable: bool,
        target_satisfiable: bool,
        is_valid: bool
    ) -> None:
        """添加测试结果"""
        self.test_results.append({
            'source': source_instance,
            'target': target_instance,
            'source_sat': source_satisfiable,
            'target_sat': target_satisfiable,
            'valid': is_valid
        })
    
    def check_all_valid(self) -> bool:
        """检查所有测试是否通过"""
        return all(r['valid'] for r in self.test_results)


class ReductionVerifierFramework:
    """
    归约验证框架
    
    验证归约的正确性需要检查两个方向：
    1. 正向：如果源问题有解，则目标问题有解
    2. 反向：如果目标问题有解，则源问题有解
    
    这框架提供：
    - 归约正确性检查
    - 边界条件测试
    - 性能分析
    - 验证报告生成
    """
    
    def __init__(self):
        self.proofs: Dict[str, ReductionProof] = {}
        self.test_generators: Dict[str, Callable] = {}
    
    def register_reduction(
        self,
        name: str,
        source_problem: str,
        target_problem: str,
        reduction_func: Callable[[Any], Any],
        solver_source: Callable[[Any], Optional[Any]],
        solver_target: Callable[[Any], Optional[Any]],
        equivalence_check: Callable[[Any, Any, Any, Any], bool]
    ) -> None:
        """
        注册一个归约
        
        Args:
            name: 归约名称
            source_problem: 源问题名称
            target_problem: 目标问题名称
            reduction_func: 归约函数 f: source_instance → target_instance
            solver_source: 源问题求解器
            solver_target: 目标问题求解器
            equivalence_check: 等价性检查函数
        """
        def verifier(source_inst, target_inst):
            # 正向检查
            source_sol = solver_source(source_inst)
            if source_sol is not None:
                # 源问题有解 → 目标问题应该有解
                target_sol = solver_target(target_inst)
                if target_sol is None:
                    return False, "正向失败：源有解但目标无解"
            
            # 反向检查
            target_sol = solver_target(target_inst)
            if target_sol is not None:
                # 目标问题有解 → 源问题应该有解
                source_sol = solver_source(source_inst)
                if source_sol is None:
                    return False, "反向失败：目标有解但源无解"
            
            return True, "等价性验证通过"
        
        self.proofs[name] = ReductionProof(
            source_problem, target_problem, reduction_func, verifier
        )
    
    def verify_reduction(
        self, 
        name: str, 
        source_instance: Any
    ) -> Tuple[bool, str]:
        """
        验证单个实例的归约正确性
        
        Args:
            name: 归约名称
            source_instance: 源问题实例
            
        Returns:
            (是否正确, 详细信息)
        """
        if name not in self.proofs:
            return False, f"归约 '{name}' 未注册"
        
        proof = self.proofs[name]
        
        # 执行归约
        try:
            start_time = time.time()
            target_instance = proof.reduction_func(source_instance)
            reduction_time = time.time() - start_time
        except Exception as e:
            return False, f"归约执行失败: {str(e)}"
        
        # 检查归约时间是否多项式
        source_size = self._estimate_size(source_instance)
        if reduction_time > source_size ** 3:  # 简化的多项式检查
            return False, f"归约时间过长，可能不是多项式时间"
        
        # 执行等价性验证
        is_valid, message = proof.verifier_func(source_instance, target_instance)
        
        proof.add_test_result(
            source_instance, target_instance,
            is_valid, is_valid, is_valid
        )
        
        return is_valid, message
    
    def batch_verify(
        self, 
        name: str, 
        instances: List[Any]
    ) -> Dict[str, Tuple[bool, str]]:
        """
        批量验证多个实例
        
        Args:
            name: 归约名称
            instances: 源问题实例列表
            
        Returns:
            验证结果字典
        """
        results = {}
        for i, instance in enumerate(instances):
            key = f"instance_{i}"
            results[key] = self.verify_reduction(name, instance)
        return results
    
    def _estimate_size(self, instance: Any) -> int:
        """估计实例大小"""
        if isinstance(instance, (list, set, dict)):
            return len(instance)
        if hasattr(instance, '__len__'):
            return len(instance)
        return 1
    
    def generate_report(self, name: str) -> str:
        """生成验证报告"""
        if name not in self.proofs:
            return f"归约 '{name}' 未注册"
        
        proof = self.proofs[name]
        
        lines = [
            f"归约验证报告: {name}",
            "=" * 50,
            f"源问题: {proof.source_problem}",
            f"目标问题: {proof.target_problem}",
            f"测试案例数: {len(proof.test_results)}",
            ""
        ]
        
        passed = sum(1 for r in proof.test_results if r['valid'])
        failed = len(proof.test_results) - passed
        
        lines.append(f"通过: {passed}/{len(proof.test_results)}")
        lines.append(f"失败: {failed}/{len(proof.test_results)}")
        
        if proof.test_results:
            lines.append("")
            lines.append("详细结果:")
            for i, result in enumerate(proof.test_results):
                status = "✓" if result['valid'] else "✗"
                lines.append(f"  案例{i}: {status}")
        
        return "\n".join(lines)


def check_reduction_correctness(
    reduction_name: str,
    source_instances: List[Any],
    reduction_func: Callable,
    solver_source: Callable,
    solver_target: Callable
) -> Tuple[bool, str]:
    """
    检查归约正确性的便捷函数
    
    验证归约的四个关键属性：
    1. 多项式时间性：归约在多项式时间内完成
    2. 正向保持性：源有解 → 目标有解
    3. 反向保持性：目标有解 → 源有解
    4. 解的对应性：解可以相互转换
    
    Args:
        reduction_name: 归约名称
        source_instances: 源问题实例列表
        reduction_func: 归约函数
        solver_source: 源问题求解器
        solver_target: 目标问题求解器
        
    Returns:
        (是否正确, 详细报告)
    """
    framework = ReductionVerifierFramework()
    
    framework.register_reduction(
        reduction_name,
        "source",
        "target",
        reduction_func,
        solver_source,
        solver_target,
        lambda s, t, ss, ts: True  # 简化的等价检查
    )
    
    results = framework.batch_verify(reduction_name, source_instances)
    
    all_passed = all(r[0] for r in results.values())
    report = framework.generate_report(reduction_name)
    
    return all_passed, report


def verify_gadget_coverage(
    gadgets: Dict[str, Any],
    source_components: Set[str],
    target_components: Set[str]
) -> Tuple[bool, List[str]]:
    """
    验证器件覆盖完整性
    
    检查归约器件是否覆盖了源问题的所有关键组件
    
    Args:
        gadgets: 器件字典，每个器件对应源问题的某个组件
        source_components: 源问题需要覆盖的组件集合
        target_components: 目标问题可用的组件集合
        
    Returns:
        (是否完整覆盖, 缺失的组件列表)
    """
    covered = set(gadgets.keys())
    missing = source_components - covered
    
    # 检查每个器件是否有效映射到目标组件
    invalid_gadgets = []
    for gadget_name, gadget in gadgets.items():
        # 简化检查：器件是否使用了目标组件
        if hasattr(gadget, 'uses'):
            uses = gadget.uses
            if not all(u in target_components for u in uses):
                invalid_gadgets.append(gadget_name)
    
    is_valid = len(missing) == 0 and len(invalid_gadgets) == 0
    issues = list(missing) + [f"{g}映射无效" for g in invalid_gadgets]
    
    return is_valid, issues


def check_polynomial_time_reduction(
    reduction_func: Callable,
    instances: List[Any],
    max_exponent: float = 3.0
) -> Tuple[bool, str]:
    """
    检查归约是否在多项式时间内完成
    
    Args:
        reduction_func: 归约函数
        instances: 测试实例列表（从小到大）
        max_exponent: 最大允许的多项式指数
        
    Returns:
        (是否多项式时间, 分析报告)
    """
    times = []
    sizes = []
    
    for instance in instances:
        size = len(instance) if hasattr(instance, '__len__') else 1
        start = time.time()
        try:
            reduction_func(instance)
            elapsed = time.time() - start
            times.append(elapsed)
            sizes.append(size)
        except Exception as e:
            return False, f"归约在大小{size}的实例上失败: {str(e)}"
    
    # 检查时间增长是否符合多项式模式
    if len(times) < 2:
        return True, "实例太少，无法判断"
    
    # 计算增长率
    growth_ratios = []
    for i in range(1, len(times)):
        if times[i-1] > 0:
            ratio = times[i] / times[i-1]
            size_ratio = sizes[i] / sizes[i-1] if sizes[i-1] > 0 else 1
            expected_ratio = size_ratio ** max_exponent
            growth_ratios.append(ratio <= expected_ratio * 2)  # 允许一定误差
    
    is_polynomial = all(growth_ratios)
    
    report = f"大小: {sizes}\n时间: {times}\n增长率符合多项式: {is_polynomial}"
    
    return is_polynomial, report


# ==================== 测试用例 ====================

import unittest

class TestReductionVerifier(unittest.TestCase):
    """归约验证器测试"""
    
    def test_framework_initialization(self):
        """测试框架初始化"""
        framework = ReductionVerifierFramework()
        self.assertEqual(len(framework.proofs), 0)
    
    def test_register_reduction(self):
        """测试归约注册"""
        framework = ReductionVerifierFramework()
        
        # 注册一个简单的归约
        framework.register_reduction(
            "test_reduction",
            "SAT",
            "3-SAT",
            lambda x: x,  # 简化归约
            lambda x: True,  # 简化求解器
            lambda x: True,
            lambda s, t, ss, ts: True
        )
        
        self.assertIn("test_reduction", framework.proofs)
    
    def test_verify_correct_reduction(self):
        """测试正确归约的验证"""
        # 简化的SAT到SAT归约（应该总是正确）
        framework = ReductionVerifierFramework()
        
        def identity_reduction(x):
            return x
        
        def always_true_solver(x):
            return True
        
        framework.register_reduction(
            "identity",
            "test",
            "test",
            identity_reduction,
            always_true_solver,
            always_true_solver,
            lambda s, t, ss, ts: True
        )
        
        is_valid, msg = framework.verify_reduction("identity", "test_instance")
        self.assertTrue(is_valid)
    
    def test_gadget_coverage(self):
        """测试器件覆盖检查"""
        gadgets = {
            'variable': 'covers variables',
            'clause': 'covers clauses'
        }
        
        source_components = {'variable', 'clause', 'constraint'}
        target_components = {'vertex', 'edge'}
        
        is_valid, issues = verify_gadget_coverage(
            gadgets, source_components, target_components
        )
        
        self.assertFalse(is_valid)  # 缺少constraint
        self.assertIn('constraint', issues)
    
    def test_polynomial_time_check(self):
        """测试多项式时间检查"""
        # 一个真正的多项式时间函数
        def polynomial_func(x):
            return [i for i in range(len(x))]
        
        instances = [
            [1] * 10,
            [1] * 100,
            [1] * 1000
        ]
        
        is_poly, report = check_polynomial_time_reduction(
            polynomial_func, instances
        )
        
        self.assertTrue(is_poly)
    
    def test_generate_report(self):
        """测试报告生成"""
        framework = ReductionVerifierFramework()
        
        framework.register_reduction(
            "test",
            "A",
            "B",
            lambda x: x,
            lambda x: True,
            lambda x: True,
            lambda s, t, ss, ts: True
        )
        
        framework.verify_reduction("test", "instance")
        report = framework.generate_report("test")
        
        self.assertIn("归约验证报告", report)
        self.assertIn("源问题", report)


def run_verifier_demo():
    """演示归约验证框架"""
    print("=" * 60)
    print("归约验证框架演示")
    print("=" * 60)
    
    framework = ReductionVerifierFramework()
    
    # 注册SAT到SAT的平凡归约
    framework.register_reduction(
        "identity_sat",
        "SAT",
        "SAT",
        lambda formula: formula,  # 平凡归约
        lambda f: True if f else False,
        lambda f: True if f else False,
        lambda s, t, ss, ts: True
    )
    
    # 测试几个实例
    test_instances = [
        [["x1", "x2"]],
        [["x1", "x2"], ["x3", "x4"]],
        [["a", "b", "c"]]
    ]
    
    for inst in test_instances:
        is_valid, msg = framework.verify_reduction("identity_sat", inst)
        print(f"实例 {inst}: {msg}")
    
    print("\n" + framework.generate_report("identity_sat"))


if __name__ == "__main__":
    run_verifier_demo()
    print("\n" + "=" * 60)
    print("运行单元测试...")
    print("=" * 60 + "\n")
    unittest.main(verbosity=2)
```

### 边界条件检查函数

```python
def check_reduction_boundary_conditions(
    reduction_func: Callable,
    solver_source: Callable,
    solver_target: Callable
) -> Dict[str, Tuple[bool, str]]:
    """
    检查归约的边界条件
    
    包括：
    1. 空输入处理
    2. 单元素输入
    3. 极端大输入
    4. 特殊结构输入
    
    Args:
        reduction_func: 归约函数
        solver_source: 源问题求解器
        solver_target: 目标问题求解器
        
    Returns:
        边界条件检查结果
    """
    results = {}
    
    # 1. 空输入
    try:
        empty_result = reduction_func([])
        empty_valid = solver_target(empty_result) == solver_source([])
        results['empty_input'] = (empty_valid, "空输入处理正确")
    except Exception as e:
        results['empty_input'] = (True, f"空输入抛出异常（可接受）: {str(e)}")
    
    # 2. 单元素输入
    try:
        single_result = reduction_func([1])
        single_valid = solver_target(single_result) == solver_source([1])
        results['single_element'] = (single_valid, "单元素处理正确")
    except Exception as e:
        results['single_element'] = (True, f"单元素抛出异常: {str(e)}")
    
    # 3. 重复元素
    try:
        dup_result = reduction_func([1, 1, 1])
        dup_valid = solver_target(dup_result) == solver_source([1, 1, 1])
        results['duplicate_elements'] = (dup_valid, "重复元素处理正确")
    except Exception as e:
        results['duplicate_elements'] = (True, f"重复元素抛出异常: {str(e)}")
    
    return results
```

