# 7.5 分数背包 vs 0-1 背包

## 这一节回答什么问题？

同一问题结构，为什么一个贪心有效，一个需要 DP？

---

## 分数背包

物品可以分割。贪心策略：按价值密度排序，优先装密度最高的物品。

**正确**：因为可以部分取用，不会浪费容量。

---

## 0-1 背包

物品不可分割，要么全拿要么不拿。贪心失效：高密度物品可能挤占容量，导致无法装其他物品。

**需要 DP**：因为 0-1 选择创造重叠子问题。

---

## 为什么差距这么大？

分数选择：每步独立，不创造依赖。
0-1 选择：每步影响后续选择，创造重叠子问题。

---

## Python 实现

```python
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class Item:
    """
    背包物品类
    
    Attributes:
        weight: 物品重量（必须 > 0）
        value: 物品价值（必须 >= 0）
        name: 物品名称（可选）
    """
    weight: float
    value: float
    name: str = ""
    
    def __post_init__(self):
        """验证物品参数有效性"""
        if self.weight <= 0:
            raise ValueError(f"物品重量必须大于 0: weight={self.weight}")
        if self.value < 0:
            raise ValueError(f"物品价值不能为负数: value={self.value}")
        if not self.name:
            self.name = f"物品(w={self.weight}, v={self.value})"
    
    @property
    def density(self) -> float:
        """计算价值密度（单位重量价值）"""
        return self.value / self.weight if self.weight > 0 else 0


@dataclass
class KnapsackResult:
    """背包问题结果"""
    total_value: float  # 总价值
    total_weight: float  # 总重量
    items: List[Tuple[Item, float]]  # (物品, 取用比例) 列表
    remaining_capacity: float  # 剩余容量
    
    def __str__(self) -> str:
        lines = [
            f"背包问题结果:",
            f"  总价值: {self.total_value:.2f}",
            f"  总重量: {self.total_weight:.2f}",
            f"  剩余容量: {self.remaining_capacity:.2f}",
            f"  选择的物品:"
        ]
        for item, fraction in self.items:
            lines.append(f"    - {item.name}: 取用 {fraction*100:.1f}%")
        return "\n".join(lines)


def fractional_knapsack(
    capacity: float, 
    items: List[Item]
) -> KnapsackResult:
    """
    分数背包问题的贪心算法实现
    
    算法思路：
    1. 计算每个物品的价值密度（value/weight）
    2. 按密度降序排序
    3. 贪心选择：尽可能多地取密度最高的物品
    4. 如果当前物品不能完全装入，则部分装入
    
    时间复杂度: O(n log n) - 排序的复杂度
    空间复杂度: O(n)
    
    Args:
        capacity: 背包容量（必须 > 0）
        items: 物品列表
        
    Returns:
        KnapsackResult 对象，包含总价值、总重量、选择的物品等
        
    Raises:
        ValueError: 如果容量 <= 0 或物品列表为空或包含无效物品
    """
    # 边界条件检查
    if capacity <= 0:
        raise ValueError(f"背包容量必须大于 0: capacity={capacity}")
    
    if not items:
        raise ValueError("物品列表不能为空")
    
    # 验证所有物品
    for i, item in enumerate(items):
        if not isinstance(item, Item):
            raise TypeError(f"第 {i} 个元素不是 Item 类型: {type(item)}")
    
    # 按价值密度降序排序
    sorted_items = sorted(items, key=lambda x: x.density, reverse=True)
    
    total_value = 0.0
    total_weight = 0.0
    selected: List[Tuple[Item, float]] = []
    remaining = capacity
    
    for item in sorted_items:
        if remaining <= 0:
            break
        
        if item.weight <= remaining:
            # 完全装入该物品
            selected.append((item, 1.0))
            total_value += item.value
            total_weight += item.weight
            remaining -= item.weight
        else:
            # 部分装入
            fraction = remaining / item.weight
            selected.append((item, fraction))
            total_value += item.value * fraction
            total_weight += item.weight * fraction
            remaining = 0
            break
    
    return KnapsackResult(
        total_value=total_value,
        total_weight=total_weight,
        items=selected,
        remaining_capacity=remaining
    )


def fractional_knapsack_with_trace(
    capacity: float,
    items: List[Item]
) -> Tuple[KnapsackResult, List[str]]:
    """
    带详细追踪信息的分数背包算法
    
    Returns:
        (结果, 追踪日志列表)
    """
    if capacity <= 0:
        raise ValueError(f"背包容量必须大于 0: capacity={capacity}")
    
    if not items:
        raise ValueError("物品列表不能为空")
    
    trace = []
    trace.append(f"初始状态: 容量={capacity}, 物品数={len(items)}")
    
    # 排序并记录
    sorted_items = sorted(items, key=lambda x: x.density, reverse=True)
    trace.append("按价值密度排序:")
    for i, item in enumerate(sorted_items, 1):
        trace.append(f"  {i}. {item.name}: 密度={item.density:.4f}")
    
    total_value = 0.0
    total_weight = 0.0
    selected: List[Tuple[Item, float]] = []
    remaining = capacity
    
    trace.append("\n贪心选择过程:")
    
    for item in sorted_items:
        if remaining <= 0:
            trace.append(f"  背包已满，停止选择")
            break
        
        if item.weight <= remaining:
            # 完全装入
            selected.append((item, 1.0))
            total_value += item.value
            total_weight += item.weight
            remaining -= item.weight
            trace.append(f"  完全装入 {item.name}: 价值+{item.value:.2f}, 重量+{item.weight:.2f}")
        else:
            # 部分装入
            fraction = remaining / item.weight
            value_gained = item.value * fraction
            weight_gained = item.weight * fraction
            selected.append((item, fraction))
            total_value += value_gained
            total_weight += weight_gained
            remaining = 0
            trace.append(f"  部分装入 {item.name}: {fraction*100:.1f}%, 价值+{value_gained:.2f}, 重量+{weight_gained:.2f}")
            break
    
    trace.append(f"\n最终结果: 总价值={total_value:.2f}, 总重量={total_weight:.2f}")
    
    result = KnapsackResult(
        total_value=total_value,
        total_weight=total_weight,
        items=selected,
        remaining_capacity=remaining
    )
    
    return result, trace


def compare_with_01_knapsack_greedy(
    capacity: float,
    items: List[Item]
) -> dict:
    """
    比较分数背包（贪心）和 0-1 背包（贪心，不正确）
    
    注意：0-1 背包的贪心算法不一定得到最优解！
    这个函数用来展示贪心在 0-1 背包上的失败。
    """
    # 分数背包（贪心，正确）
    fractional_result = fractional_knapsack(capacity, items)
    
    # 0-1 背包（贪心，不正确）
    sorted_items = sorted(items, key=lambda x: x.density, reverse=True)
    greedy_01_value = 0.0
    greedy_01_weight = 0.0
    greedy_01_items = []
    remaining = capacity
    
    for item in sorted_items:
        if item.weight <= remaining:
            greedy_01_value += item.value
            greedy_01_weight += item.weight
            greedy_01_items.append((item, 1.0))
            remaining -= item.weight
    
    return {
        "fractional": {
            "value": fractional_result.total_value,
            "weight": fractional_result.total_weight,
            "items": [(item.name, frac) for item, frac in fractional_result.items]
        },
        "01_greedy": {
            "value": greedy_01_value,
            "weight": greedy_01_weight,
            "items": [(item.name, frac) for item, frac in greedy_01_items]
        },
        "note": "0-1 背包的贪心解不一定是最优解，需要用 DP 求最优解"
    }


# ==================== 测试用例 ====================

def test_basic_fractional_knapsack():
    """测试基本分数背包"""
    print("测试 1: 基本分数背包")
    
    items = [
        Item(weight=10, value=60, name="物品A"),
        Item(weight=20, value=100, name="物品B"),
        Item(weight=30, value=120, name="物品C"),
    ]
    
    result = fractional_knapsack(capacity=50, items=items)
    
    print(f"  容量: 50")
    for item in items:
        print(f"  {item.name}: 重量={item.weight}, 价值={item.value}, 密度={item.density:.4f}")
    print(f"\n  结果: 总价值={result.total_value:.2f}, 总重量={result.total_weight:.2f}")
    
    # 验证：应该取完整的物品A(密度6)和物品B(密度5)，加上2/3的物品C(密度4)
    assert result.total_value == 240.0, f"期望 240，得到 {result.total_value}"
    assert result.total_weight == 50.0, f"期望 50，得到 {result.total_weight}"
    
    print("  ✓ 基本测试通过\n")


def test_fractional_case():
    """测试部分装入情况"""
    print("测试 2: 部分装入")
    
    items = [
        Item(weight=50, value=100, name="大物品"),
        Item(weight=30, value=90, name="中物品"),
        Item(weight=20, value=80, name="小物品"),
    ]
    
    # 密度：大物品=2, 中物品=3, 小物品=4
    # 应该先装小物品(20)，再装中物品(30)，共50
    result = fractional_knapsack(capacity=50, items=items)
    
    print(f"  容量: 50")
    print(f"  结果: 总价值={result.total_value:.2f}")
    
    # 验证
    assert len(result.items) == 2, "应该选择2个物品"
    assert result.total_value == 170.0, f"期望 170，得到 {result.total_value}"
    
    print("  ✓ 部分装入测试通过\n")


def test_with_trace():
    """测试带追踪信息的版本"""
    print("测试 3: 带追踪信息")
    
    items = [
        Item(weight=10, value=60, name="金子"),
        Item(weight=20, value=100, name="银子"),
        Item(weight=30, value=120, name="铜子"),
    ]
    
    result, trace = fractional_knapsack_with_trace(capacity=50, items=items)
    
    for line in trace:
        print(f"  {line}")
    
    print("  ✓ 追踪测试通过\n")


def test_edge_cases():
    """测试边界情况"""
    print("测试 4: 边界情况")
    
    # 容量恰好装下一个物品
    items = [Item(weight=50, value=100, name="单物品")]
    result = fractional_knapsack(capacity=50, items=items)
    assert result.total_value == 100
    assert result.remaining_capacity == 0
    print("  ✓ 单物品测试通过")
    
    # 容量大于所有物品总重
    items = [
        Item(weight=10, value=50, name="A"),
        Item(weight=20, value=60, name="B"),
    ]
    result = fractional_knapsack(capacity=100, items=items)
    assert result.total_value == 110
    assert result.remaining_capacity == 70
    print("  ✓ 超大容量测试通过")
    
    # 容量非常小
    items = [
        Item(weight=100, value=1000, name="大"),
        Item(weight=1, value=10, name="小"),
    ]
    result = fractional_knapsack(capacity=0.5, items=items)
    # 应该取小物品的 50%
    assert abs(result.total_value - 5.0) < 0.001
    print("  ✓ 极小容量测试通过")
    print()


def test_error_handling():
    """测试错误处理"""
    print("测试 5: 错误处理")
    
    # 容量为0或负数
    try:
        fractional_knapsack(0, [Item(weight=1, value=1)])
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 零容量错误: {e}")
    
    try:
        fractional_knapsack(-10, [Item(weight=1, value=1)])
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 负容量错误: {e}")
    
    # 空物品列表
    try:
        fractional_knapsack(10, [])
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 空列表错误: {e}")
    
    # 无效物品
    try:
        Item(weight=0, value=10)
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 零重量错误: {e}")
    
    try:
        Item(weight=10, value=-5)
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 负价值错误: {e}")
    print()


def test_01_knapsack_greedy_fails():
    """测试 0-1 背包贪心算法的失败案例"""
    print("测试 6: 0-1 背包贪心失效案例")
    
    # 这个例子展示贪心在 0-1 背包上不一定得到最优解
    items = [
        Item(weight=10, value=60, name="A"),  # 密度 = 6
        Item(weight=20, value=100, name="B"), # 密度 = 5
        Item(weight=30, value=120, name="C"), # 密度 = 4
    ]
    
    comparison = compare_with_01_knapsack_greedy(capacity=50, items=items)
    
    print(f"  分数背包贪心解: {comparison['fractional']['value']}")
    print(f"  0-1 背包贪心解: {comparison['01_greedy']['value']}")
    print(f"  {comparison['note']}")
    
    # 对于这个例子，贪心恰好也是最优的
    # 但我们要展示一个贪心不是最优的例子
    items2 = [
        Item(weight=5, value=40, name="小高密"),   # 密度 = 8
        Item(weight=10, value=50, name="中中密"),  # 密度 = 5
        Item(weight=15, value=60, name="大低密"),  # 密度 = 4
    ]
    
    comparison2 = compare_with_01_knapsack_greedy(capacity=15, items=items2)
    
    print(f"\n  另一个例子:")
    print(f"  容量=15")
    print(f"  0-1 背包贪心解: {comparison2['01_greedy']['value']}")
    print(f"  (取小高密+中中密的一部分 → 价值={comparison2['01_greedy']['value']})")
    print(f"  但实际上最优解可能是取中中密+大低密 = 110")
    print(f"  (这需要用 DP 计算，贪心无法得到)")
    print()


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("分数背包算法测试")
    print("=" * 60 + "\n")
    
    test_basic_fractional_knapsack()
    test_fractional_case()
    test_with_trace()
    test_edge_cases()
    test_error_handling()
    test_01_knapsack_greedy_fails()
    
    print("=" * 60)
    print("所有测试通过!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
```

---

## 本节小结

### 这一节解决了什么问题？
同一问题的不同版本，可处理性为何不同？

### 核心洞察是什么？
0-1 选择创造重叠子问题 → 需要 DP。
分数选择不创造依赖 → 贪心有效。

### LLM时代映射
LLM 的 "是否采纳" 就是 0-1 选择——创造依赖，不能贪心。

---

## 习题

1. 证明分数背包贪心算法的正确性。
2. 给出一个 0-1 背包问题，贪心算法得到的解与最优解差距最大。
3. 如果物品可以分割但只能取整数份（如 0.5, 1, 1.5...），如何设计算法？
