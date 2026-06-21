# 7.7 综合练习

本章练习分为四个层次，从基础概念到 Agent 设计，逐步深入。

---

## 层次一：基础概念（必做）

### 练习 1：活动选择正确性证明

**问题**：用交换论证证明活动选择贪心算法的正确性。

**提示**：
1. 设贪心选择的第一个活动是 $a_1$（最早结束）
2. 设最优解的第一个活动是 $b_1$
3. 证明：可以用 $a_1$ 替换 $b_1$，最优解仍然可行

**参考答案**：

设 $A = \{a_1, a_2, \ldots, a_k\}$ 是贪心算法选择的解（按结束时间排序），$B = \{b_1, b_2, \ldots, b_m\}$ 是最优解（也按结束时间排序）。

**断言**：$k = m$（贪心选择的数量等于最优解）。

**证明**（反证法）：

假设 $k < m$。

由于 $a_1$ 是所有活动中结束最早的，有 $f(a_1) \leq f(b_1)$。

考虑用 $a_1$ 替换 $b_1$：
- $a_1$ 结束不晚于 $b_1$，所以与 $b_2, b_3, \ldots, b_m$ 不冲突
- $B' = \{a_1, b_2, b_3, \ldots, b_m\}$ 是可行解，且 $|B'| = |B| = m$

重复这个替换过程：
- 用 $a_2$ 替换 $b_2$（或 $B'$ 中的相应元素）
- ...
- 最终得到 $\{a_1, a_2, \ldots, a_k, b_{k+1}, \ldots, b_m\}$ 仍可行

但这与贪心算法的定义矛盾：贪心会继续选择 $b_{k+1}$（因为它是第一个与 $a_k$ 不冲突的活动）。

因此 $k = m$，贪心解是最优解。$\square$

---

### 练习 2：Huffman 编码实现

**问题**：实现 Huffman 编码，计算编码长度和压缩比。

**要求**：
1. 输入一个字符串，输出 Huffman 编码表
2. 计算编码后的总比特数
3. 计算压缩比（与固定长度编码比较）

**参考答案**：

```python
from typing import Dict, Optional, Tuple
from dataclasses import dataclass, field
from heapq import heappush, heappop
import json


@dataclass(order=True)
class HuffmanNode:
    """Huffman 树节点"""
    weight: int  # 频率（用于堆排序）
    char: Optional[str] = field(default=None, compare=False)
    left: Optional['HuffmanNode'] = field(default=None, compare=False)
    right: Optional['HuffmanNode'] = field(default=None, compare=False)
    
    def is_leaf(self) -> bool:
        return self.left is None and self.right is None


def build_frequency(text: str) -> Dict[str, int]:
    """统计字符频率"""
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    return freq


def build_huffman_tree(frequency: Dict[str, int]) -> HuffmanNode:
    """构建 Huffman 树"""
    if len(frequency) == 1:
        # 只有一个字符的特殊情况
        char, freq = list(frequency.items())[0]
        return HuffmanNode(weight=freq, char=char)
    
    heap = []
    for char, freq in frequency.items():
        heappush(heap, HuffmanNode(weight=freq, char=char))
    
    while len(heap) > 1:
        left = heappop(heap)
        right = heappop(heap)
        merged = HuffmanNode(
            weight=left.weight + right.weight,
            left=left,
            right=right
        )
        heappush(heap, merged)
    
    return heap[0]


def build_codes(node: HuffmanNode, prefix: str = "", codes: Dict[str, str] = None) -> Dict[str, str]:
    """从 Huffman 树构建编码表"""
    if codes is None:
        codes = {}
    
    if node.is_leaf():
        codes[node.char] = prefix if prefix else "0"  # 单字符情况
        return codes
    
    build_codes(node.left, prefix + "0", codes)
    build_codes(node.right, prefix + "1", codes)
    
    return codes


def huffman_encode(text: str) -> Tuple[Dict[str, str], int, float]:
    """
    Huffman 编码主函数
    
    Returns:
        codes: 编码表
        encoded_bits: 编码后比特数
        compression_ratio: 压缩比
    """
    if not text:
        return {}, 0, 0.0
    
    frequency = build_frequency(text)
    tree = build_huffman_tree(frequency)
    codes = build_codes(tree)
    
    # 计算编码后比特数
    encoded_bits = sum(frequency[char] * len(codes[char]) for char in frequency)
    
    # 计算压缩比（与固定长度编码比较）
    num_unique_chars = len(frequency)
    fixed_bits_per_char = (num_unique_chars - 1).bit_length()  # log2(n) 向上取整
    fixed_total_bits = len(text) * fixed_bits_per_char
    
    compression_ratio = fixed_total_bits / encoded_bits if encoded_bits > 0 else 1.0
    
    return codes, encoded_bits, compression_ratio


# 测试
if __name__ == "__main__":
    text = "this is an example for huffman encoding"
    codes, bits, ratio = huffman_encode(text)
    
    print("编码表：")
    for char, code in sorted(codes.items()):
        print(f"  '{char}': {code}")
    
    print(f"\n编码后比特数: {bits}")
    print(f"压缩比: {ratio:.2f}x")
```

---

### 练习 3：贪心失败实例

**问题**：给出贪心策略在 0-1 背包上失败的实例。

**要求**：
1. 构造一个至少 3 个物品的实例
2. 展示贪心解和最优解
3. 分析为什么贪心失败

**参考答案**：

**实例**：
- 背包容量：10
- 物品：
  - A: 重量 6, 价值 60, 性价比 10
  - B: 重量 5, 价值 50, 性价比 10
  - C: 重量 5, 价值 50, 性价比 10

**贪心解**（按性价比，假设先选 A）：
- 选 A（重量 6，价值 60）
- 剩余容量 4，无法放 B 或 C
- 总价值：60

**最优解**：
- 选 B 和 C（重量 5 + 5 = 10，价值 50 + 50 = 100）
- 总价值：100

**分析**：
贪心选了高性价比的 A，但 A 占用了太多空间，无法再放入其他物品。最优解是两个性价比稍低但能组合利用空间的物品。

**失败原因**：物品不可分割导致"填不满"背包，贪心选择占用了本可以装下更多价值的组合空间。

---

## 层次二：算法实现（重要）

### 练习 4：Kruskal 算法实现

**问题**：实现 Kruskal 最小生成树算法，并处理不连通图的情况。

**参考答案**：

```python
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class UnionFind:
    """并查集实现，用于检测环"""
    parent: List[int]
    rank: List[int]
    
    @classmethod
    def create(cls, n: int) -> 'UnionFind':
        return cls(parent=list(range(n)), rank=[0] * n)
    
    def find(self, x: int) -> int:
        """路径压缩查找"""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x: int, y: int) -> bool:
        """
        合并两个集合
        
        Returns:
            True 如果成功合并（之前不连通）
            False 如果已经连通（会形成环）
        """
        px, py = self.find(x), self.find(y)
        if px == py:
            return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True


def kruskal_mst(n: int, edges: List[Tuple[int, int, int]]) -> Tuple[List[Tuple[int, int, int]], int, bool]:
    """
    Kruskal 最小生成树算法
    
    Args:
        n: 顶点数
        edges: 边列表，每个元素是 (u, v, weight)
        
    Returns:
        mst_edges: 最小生成树的边列表
        total_weight: 最小生成树总权重
        is_connected: 图是否连通
    """
    # 按权重排序
    edges = sorted(edges, key=lambda e: e[2])
    
    uf = UnionFind.create(n)
    mst = []
    total_weight = 0
    
    for u, v, w in edges:
        if uf.union(u, v):
            mst.append((u, v, w))
            total_weight += w
            if len(mst) == n - 1:
                break
    
    # 检查连通性
    is_connected = len(mst) == n - 1
    
    return mst, total_weight, is_connected


def kruskal_mst_forest(n: int, edges: List[Tuple[int, int, int]]) -> List[Tuple[List[Tuple[int, int, int]], int]]:
    """
    对于不连通图，返回每个连通分量的最小生成树（最小生成森林）
    
    Returns:
        每个连通分量的 MST 及其权重
    """
    edges = sorted(edges, key=lambda e: e[2])
    
    uf = UnionFind.create(n)
    forests = {}  # root -> (edges, weight)
    
    for i in range(n):
        forests[i] = ([], 0)
    
    for u, v, w in edges:
        pu, pv = uf.find(u), uf.find(v)
        if pu != pv:
            # 合并两个连通分量
            uf.union(u, v)
            new_root = uf.find(u)
            # 合并边列表和权重
            old_root = pv if new_root == pu else pu
            edges_new, weight_new = forests[new_root]
            edges_old, weight_old = forests[old_root]
            forests[new_root] = (edges_new + edges_old + [(u, v, w)], weight_new + weight_old + w)
            del forests[old_root]
    
    return list(forests.values())
```

---

### 练习 5：拟阵检测器

**问题**：实现一个函数，判断给定的问题结构是否满足拟阵的三条公理。

**要求**：输入一个基础集和独立集族，输出是否为拟阵。

**参考答案**：

```python
from typing import Set, List, FrozenSet
from itertools import combinations


def is_matroid(E: Set[int], independent_sets: List[Set[int]]) -> Tuple[bool, str]:
    """
    判断 (E, I) 是否为拟阵
    
    Returns:
        is_matroid: 是否为拟阵
        reason: 如果不是，原因是什么
    """
    I = [frozenset(s) for s in independent_sets]
    I_set = set(I)
    
    # 公理 1：空集独立
    if frozenset() not in I_set:
        return False, "公理 1 失败：空集不在独立集族中"
    
    # 公理 2：遗传性
    for A in I:
        for k in range(len(A) + 1):
            for B in combinations(A, k):
                if frozenset(B) not in I_set:
                    return False, f"公理 2 失败：{set(A)} 的子集 {set(B)} 不独立"
    
    # 公理 3：交换性
    for A in I:
        for B in I:
            if len(A) < len(B):
                found = False
                for x in B - A:
                    if frozenset(A | {x}) in I_set:
                        found = True
                        break
                if not found:
                    return False, f"公理 3 失败：|{set(A)}| < |{set(B)}|，但无法扩展"
    
    return True, "是拟阵"


# 测试：图拟阵
def test_graph_matroid():
    """测试图拟阵"""
    # 三角形图：三个顶点，三条边
    # 边：0-1, 1-2, 0-2（编号为 0, 1, 2）
    
    E = {0, 1, 2}
    # 独立集 = 不形成环的边集
    independent_sets = [
        set(),           # 空集
        {0}, {1}, {2},   # 单条边
        {0, 1}, {1, 2}, {0, 2}  # 两条边（不形成环）
        # {0, 1, 2} 不独立（形成环）
    ]
    
    result, reason = is_matroid(E, independent_sets)
    print(f"图拟阵测试: {result}, {reason}")
    return result


if __name__ == "__main__":
    test_graph_matroid()
```

---

## 层次三：LLM 协同（探索）

### 练习 6：LLM 对比实验

**问题**：让 LLM 对活动选择问题分别给出贪心解和 DP 解，对比结果。

**提示词模板**：

```
问题：给定 n 个活动，每个活动有开始时间和结束时间，选择最多的不重叠活动。

活动列表：
{{activities}}

请分别用以下方法求解：
1. 贪心算法：按结束时间排序，选择最早结束的活动
2. 动态规划：按结束时间排序，定义 dp[i] 为前 i 个活动的最优解

输出两种方法的结果，并比较是否一致。
```

**预期结果**：
- 对于标准活动选择问题（无权重），贪心和 DP 应该得到相同的结果
- 贪心时间复杂度 O(n log n)，DP 时间复杂度 O(n²) 或 O(n log n)（优化后）
- 贪心更简洁，但 DP 方法更通用

---

### 练习 7：LLM 发现贪心失败

**问题**：让 LLM 在加权活动选择上用贪心策略，观察其失败，然后让 LLM 自己发现为什么贪心不够。

**提示词模板**：

```
问题：选择不重叠的活动，使得总权重最大。

活动列表：
{{weighted_activities}}

1. 先用贪心策略（按权重排序，选权重最大的不重叠活动）求解
2. 检验结果是否最优
3. 如果不是最优，分析贪心为什么失败，并给出正确解法
```

**引导 LLM 思考的问题**：
- 贪心选择性质是否成立？
- 最优子结构是否成立？
- 能举出反例吗？

---

## 层次四：Agent 设计（挑战）

### 练习 8：算法范式选择器

**问题**：设计一个算法范式选择器 Skill，输入问题描述，判断适合贪心还是 DP，给出理由。

**框架**：

```python
from typing import Literal
from dataclasses import dataclass


@dataclass
class ProblemAnalysis:
    """问题分析结果"""
    greedy_suitable: bool
    dp_suitable: bool
    reasoning: str
    counterexample: str = ""


def analyze_problem(problem_description: str) -> ProblemAnalysis:
    """
    分析问题，判断适合贪心还是 DP
    
    检查清单：
    1. 问题能建模为拟阵吗？
    2. 有贪心选择性质吗？
    3. 有最优子结构吗？
    4. 子问题独立吗？
    5. 能举出贪心失败的反例吗？
    """
    # 这里需要 LLM 来分析问题
    # 返回分析结果
    pass


# 使用示例
if __name__ == "__main__":
    problems = [
        "选择最多的不重叠活动",
        "0-1 背包问题：背包容量有限，物品不可分割，最大化价值",
        "分数背包问题：背包容量有限，物品可分割，最大化价值",
        "最小生成树问题",
        "最长简单路径问题",
    ]
    
    for problem in problems:
        analysis = analyze_problem(problem)
        print(f"问题：{problem}")
        print(f"  贪心适用：{analysis.greedy_suitable}")
        print(f"  DP 适用：{analysis.dp_suitable}")
        print(f"  理由：{analysis.reasoning}")
        if analysis.counterexample:
            print(f"  反例：{analysis.counterexample}")
        print()
```

**挑战**：
1. 如何让 LLM 理解问题的结构特征？
2. 如何自动生成反例？
3. 如何处理边界情况（贪心近似最优但不严格最优）？

---

### 练习 9：贪心策略调试器

**问题**：设计一个贪心策略调试器，自动检测贪心是否正确，如果不正确，找出失败原因。

**功能**：
1. 运行贪心算法
2. 用穷举或 DP 验证结果
3. 如果不一致，分析失败原因

**实现提示**：

```python
def debug_greedy(problem: str, greedy_func, brute_force_func, instances: List):
    """
    调试贪心策略
    
    Args:
        problem: 问题描述
        greedy_func: 贪心算法函数
        brute_force_func: 穷举/验证函数
        instances: 测试实例列表
    
    Returns:
        调试报告
    """
    report = {
        "problem": problem,
        "total_tests": len(instances),
        "passed": 0,
        "failed": 0,
        "failure_cases": []
    }
    
    for instance in instances:
        greedy_result = greedy_func(instance)
        optimal_result = brute_force_func(instance)
        
        if greedy_result == optimal_result:
            report["passed"] += 1
        else:
            report["failed"] += 1
            report["failure_cases"].append({
                "instance": instance,
                "greedy_result": greedy_result,
                "optimal_result": optimal_result
            })
    
    return report
```

---

## 综合项目

### 练习 10：贪心算法可视化工具

**问题**：实现一个贪心算法可视化工具，展示贪心过程和失败案例。

**功能**：
1. 活动选择的可视化（时间轴）
2. 0-1 背包 vs 分数背包的可视化
3. Kruskal MST 的可视化
4. 贪心失败案例的对比展示

**技术选型**：
- 后端：Python + Matplotlib/Plotly
- 前端：可选 Web 界面（Streamlit/Gradio）

**参考结构**：

```
greedy-visualizer/
├── algorithms/
│   ├── activity_selection.py
│   ├── knapsack.py
│   └── mst.py
├── visualizers/
│   ├── timeline.py      # 活动选择可视化
│   ├── knapsack_view.py # 背包可视化
│   └── graph_view.py    # 图可视化
├── app.py               # 主应用
└── README.md
```

---

## 本章小结

通过这些练习，你应该能够：

1. **理解贪心的正确性条件**：拟阵、贪心选择性质、最优子结构
2. **识别贪心失败的情况**：举反例、分析失败原因
3. **实现经典贪心算法**：活动选择、Huffman、Kruskal
4. **应用 LLM 辅助算法学习**：对比实验、发现问题
5. **设计算法选择工具**：自动化判断问题适合的算法范式

**核心洞察**：贪心简单高效，但不是万能的。判断贪心是否适用，需要理解问题的结构特征。
