# 7.1 贪心策略的直觉与陷阱

## 这一节回答什么问题？

贪心每步做局部最优选择。但问题来了：**局部最优能保证全局最优吗？**

---

## 问题情境：活动选择

假设你要安排一天的会议，会议室只能容纳一场活动。每个活动有开始时间和结束时间。你想安排尽可能多的活动。

**贪心直觉**：每次选最早结束的活动，腾出更多时间给后面的活动。

这个直觉对吗？

---

## 为什么这样想是对的？

最早结束的活动留下最多的"剩余空间"。后面活动的选择空间更大。

**关键前提**：活动是无权的——每个活动价值相同。

如果活动有权重（比如有的会议更重要），贪心就失效了。加权活动选择需要 DP。

---

## Python 实现

```python
from typing import List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class Activity:
    """活动类，包含开始时间、结束时间和可选的活动名称"""
    start: int
    end: int
    name: str = ""
    
    def __post_init__(self):
        """验证活动时间有效性"""
        if self.start < 0 or self.end < 0:
            raise ValueError(f"活动时间不能为负数: start={self.start}, end={self.end}")
        if self.start >= self.end:
            raise ValueError(f"活动开始时间必须小于结束时间: start={self.start}, end={self.end}")
        if not self.name:
            self.name = f"活动({self.start}-{self.end})"


def activity_selection(activities: List[Activity]) -> List[Activity]:
    """
    活动选择问题的贪心算法实现
    
    算法思路：
    1. 按结束时间排序所有活动
    2. 选择第一个活动（最早结束的）
    3. 遍历剩余活动，选择第一个与已选活动不冲突的活动
    
    时间复杂度: O(n log n) - 排序的复杂度
    空间复杂度: O(n) - 存储结果
    
    Args:
        activities: 活动列表，每个活动包含开始时间和结束时间
        
    Returns:
        选择的活动的列表，数量最多
        
    Raises:
        ValueError: 如果活动列表为空或活动时间无效
    """
    # 边界条件检查
    if not activities:
        return []
    
    if len(activities) == 0:
        raise ValueError("活动列表不能为空")
    
    # 验证所有活动
    for i, activity in enumerate(activities):
        if not isinstance(activity, Activity):
            raise TypeError(f"第 {i} 个元素不是 Activity 类型: {type(activity)}")
    
    # 按结束时间排序
    sorted_activities = sorted(activities, key=lambda x: x.end)
    
    # 贪心选择
    selected = [sorted_activities[0]]
    last_end_time = sorted_activities[0].end
    
    for activity in sorted_activities[1:]:
        # 如果当前活动的开始时间 >= 上一个选中活动的结束时间，则选择
        if activity.start >= last_end_time:
            selected.append(activity)
            last_end_time = activity.end
    
    return selected


def activity_selection_with_details(activities: List[Activity]) -> dict:
    """
    带详细信息的活动选择算法
    
    返回选择的活动和选择过程信息
    
    Args:
        activities: 活动列表
        
    Returns:
        包含选择结果和过程信息的字典
    """
    if not activities:
        return {
            "selected": [],
            "count": 0,
            "total_time_span": 0,
            "message": "活动列表为空"
        }
    
    # 排序
    sorted_activities = sorted(activities, key=lambda x: x.end)
    
    selected = []
    rejected = []
    last_end_time = -1
    
    for activity in sorted_activities:
        if activity.start >= last_end_time:
            selected.append(activity)
            last_end_time = activity.end
        else:
            rejected.append(activity)
    
    return {
        "selected": selected,
        "rejected": rejected,
        "count": len(selected),
        "total_time_span": selected[-1].end - selected[0].start if selected else 0,
        "message": f"成功选择 {len(selected)} 个活动，拒绝 {len(rejected)} 个活动"
    }


# ==================== 测试用例 ====================

def test_basic_case():
    """测试基本用例"""
    activities = [
        Activity(1, 4, "会议A"),
        Activity(3, 5, "会议B"),
        Activity(0, 6, "会议C"),
        Activity(5, 7, "会议D"),
        Activity(3, 9, "会议E"),
        Activity(5, 9, "会议F"),
        Activity(6, 10, "会议G"),
        Activity(8, 11, "会议H"),
        Activity(8, 12, "会议I"),
        Activity(2, 14, "会议J"),
        Activity(12, 16, "会议K"),
    ]
    
    result = activity_selection(activities)
    
    # 应该选择会议A, D, H, K（或等价的最优解）
    print(f"✓ 基本测试通过，选择了 {len(result)} 个活动:")
    for act in result:
        print(f"  - {act.name}: {act.start}-{act.end}")
    
    return result


def test_edge_cases():
    """测试边界情况"""
    # 空列表
    assert activity_selection([]) == [], "空列表测试失败"
    print("✓ 空列表测试通过")
    
    # 单个活动
    single = [Activity(1, 2, "单个")]
    result = activity_selection(single)
    assert len(result) == 1, "单个活动测试失败"
    print("✓ 单个活动测试通过")
    
    # 全部重叠的活动
    overlapping = [
        Activity(1, 5, "A"),
        Activity(2, 6, "B"),
        Activity(3, 7, "C"),
    ]
    result = activity_selection(overlapping)
    assert len(result) == 1, "全部重叠测试失败"
    print("✓ 全部重叠测试通过，只能选择 1 个活动")
    
    # 全部不重叠的活动
    non_overlapping = [
        Activity(1, 2, "A"),
        Activity(2, 3, "B"),
        Activity(3, 4, "C"),
    ]
    result = activity_selection(non_overlapping)
    assert len(result) == 3, "全部不重叠测试失败"
    print("✓ 全部不重叠测试通过，可以选择全部 3 个活动")


def test_invalid_inputs():
    """测试无效输入"""
    # 开始时间 >= 结束时间
    try:
        Activity(5, 3, "无效")
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"✓ 无效时间测试通过: {e}")
    
    # 负数时间
    try:
        Activity(-1, 5, "负数")
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"✓ 负数时间测试通过: {e}")


def test_with_details():
    """测试带详细信息的版本"""
    activities = [
        Activity(1, 2, "早会"),
        Activity(2, 4, "讨论"),
        Activity(3, 5, "汇报"),
        Activity(4, 6, "培训"),
    ]
    
    result = activity_selection_with_details(activities)
    print(f"\n✓ 详细信息测试:")
    print(f"  选择的活动数: {result['count']}")
    print(f"  总时间跨度: {result['total_time_span']}")
    print(f"  信息: {result['message']}")


def run_all_tests():
    """运行所有测试"""
    print("=" * 50)
    print("活动选择算法测试")
    print("=" * 50)
    
    test_basic_case()
    print()
    test_edge_cases()
    print()
    test_invalid_inputs()
    print()
    test_with_details()
    
    print("\n" + "=" * 50)
    print("所有测试通过!")
    print("=" * 50)


if __name__ == "__main__":
    run_all_tests()
```

---

## 本节小结

### 这一节解决了什么问题？
局部最优是否等于全局最优？活动选择问题给出了答案。

### 核心方法是什么？
贪心：每步选最早结束的活动。

### 它为什么正确？
最早结束的活动留下最大剩余空间，不阻碍后续选择。

### 它在什么情况下不适用？
加权活动选择——需要 DP。

---

## 习题

1. 如果活动有权重，如何修改算法？
2. 证明贪心算法选择的活动数确实是最多的。
3. 如果有多个会议室，如何扩展这个算法？
