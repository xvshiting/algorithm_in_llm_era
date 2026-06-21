# 7.4 Huffman 编码

## 这一节回答什么问题？

如何设计最优的前缀编码？

---

## 问题情境

你想压缩文本。不同字符出现频率不同。高频字符用短编码，低频字符用长编码。

**约束**：编码必须是前缀码——任何编码不能是其他编码的前缀。

---

## Huffman 算法

1. 把每个字符看作一个节点，频率作为权重
2. 每次选两个最小权重的节点，合并成一个新节点（权重 = 两节点之和）
3. 重复直到只剩一个节点（根）

---

## 正确性证明

两个引理：
1. 最低频率字符是某最优树中深度最大的兄弟
2. 合并后归结为更小的子问题（最优子结构）

---

## Python 实现

```python
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass, field
from heapq import heappush, heappop
import json


@dataclass(order=True)
class HuffmanNode:
    """
    Huffman 树节点
    
    使用 heapq 时按权重排序，所以 sorted_index 设为权重
    """
    weight: int  # 频率（用于堆排序）
    char: Optional[str] = field(default=None, compare=False)  # 字符（叶子节点才有）
    left: Optional['HuffmanNode'] = field(default=None, compare=False)
    right: Optional['HuffmanNode'] = field(default=None, compare=False)
    
    def is_leaf(self) -> bool:
        """判断是否为叶子节点"""
        return self.left is None and self.right is None


class HuffmanCoder:
    """
    Huffman 编码器
    
    提供完整的编码和解码功能
    """
    
    def __init__(self):
        self.root: Optional[HuffmanNode] = None
        self.codes: Dict[str, str] = {}
        self.reverse_codes: Dict[str, str] = {}
    
    def build_tree(self, frequency: Dict[str, int]) -> None:
        """
        构建 Huffman 树
        
        算法步骤：
        1. 为每个字符创建叶子节点，权重为频率
        2. 使用最小堆维护所有节点
        3. 每次取出两个最小权重的节点，合并为一个新节点
        4. 将新节点放回堆中
        5. 重复直到堆中只剩一个节点（根节点）
        
        时间复杂度: O(n log n)，n 为不同字符数
        空间复杂度: O(n)
        
        Args:
            frequency: 字符到频率的映射字典
            
        Raises:
            ValueError: 如果频率字典为空或频率为负数
        """
        # 边界条件检查
        if not frequency:
            raise ValueError("频率字典不能为空")
        
        for char, freq in frequency.items():
            if freq < 0:
                raise ValueError(f"频率不能为负数: 字符 '{char}' 的频率为 {freq}")
            if freq == 0:
                raise ValueError(f"频率不能为 0: 字符 '{char}'")
        
        # 特殊情况：只有一个字符
        if len(frequency) == 1:
            char = list(frequency.keys())[0]
            self.root = HuffmanNode(weight=frequency[char], char=char)
            self.codes = {char: "0"}
            self.reverse_codes = {"0": char}
            return
        
        # 构建最小堆
        heap: List[HuffmanNode] = []
        for char, freq in frequency.items():
            node = HuffmanNode(weight=freq, char=char)
            heappush(heap, node)
        
        # 构建树
        while len(heap) > 1:
            # 取出两个最小权重的节点
            left = heappop(heap)
            right = heappop(heap)
            
            # 创建新的父节点
            merged = HuffmanNode(
                weight=left.weight + right.weight,
                left=left,
                right=right
            )
            heappush(heap, merged)
        
        # 根节点
        self.root = heap[0]
        
        # 生成编码表
        self._generate_codes(self.root, "")
        
        # 生成反向编码表（用于解码）
        self.reverse_codes = {v: k for k, v in self.codes.items()}
    
    def _generate_codes(self, node: Optional[HuffmanNode], code: str) -> None:
        """
        递归生成编码表
        
        Args:
            node: 当前节点
            code: 当前编码
        """
        if node is None:
            return
        
        if node.is_leaf():
            # 叶子节点：记录编码
            self.codes[node.char] = code if code else "0"  # 处理单字符情况
            return
        
        # 左子树编码为 0
        self._generate_codes(node.left, code + "0")
        # 右子树编码为 1
        self._generate_codes(node.right, code + "1")
    
    def encode(self, text: str) -> str:
        """
        编码文本
        
        Args:
            text: 待编码的文本
            
        Returns:
            编码后的二进制字符串
            
        Raises:
            ValueError: 如果文本包含未编码的字符
            RuntimeError: 如果树未构建
        """
        if self.root is None:
            raise RuntimeError("Huffman 树未构建，请先调用 build_tree()")
        
        if not text:
            return ""
        
        result = []
        for char in text:
            if char not in self.codes:
                raise ValueError(f"字符 '{char}' 未在频率表中")
            result.append(self.codes[char])
        
        return "".join(result)
    
    def decode(self, encoded: str) -> str:
        """
        解码二进制字符串
        
        Args:
            encoded: 编码后的二进制字符串
            
        Returns:
            解码后的原始文本
            
        Raises:
            ValueError: 如果编码字符串无效
            RuntimeError: 如果树未构建
        """
        if self.root is None:
            raise RuntimeError("Huffman 树未构建，请先调用 build_tree()")
        
        if not encoded:
            return ""
        
        # 特殊情况：只有一个字符
        if self.root.is_leaf():
            # 验证编码字符串只包含 0
            if any(bit != '0' for bit in encoded):
                raise ValueError("无效的编码字符串")
            return self.root.char * len(encoded)
        
        result = []
        current = self.root
        
        for bit in encoded:
            if bit not in ('0', '1'):
                raise ValueError(f"编码字符串包含非法字符: '{bit}'")
            
            # 0 向左，1 向右
            current = current.left if bit == '0' else current.right
            
            if current is None:
                raise ValueError("无效的编码字符串：无法解码")
            
            if current.is_leaf():
                result.append(current.char)
                current = self.root
        
        # 检查是否完整解码
        if current != self.root:
            raise ValueError("编码字符串不完整")
        
        return "".join(result)
    
    def get_codes(self) -> Dict[str, str]:
        """获取编码表"""
        return self.codes.copy()
    
    def get_statistics(self) -> Dict:
        """获取编码统计信息"""
        if not self.codes:
            return {"message": "未生成编码"}
        
        # 计算平均编码长度
        total_freq = sum(self.root.weight) if self.root else 0
        
        return {
            "num_characters": len(self.codes),
            "codes": self.codes,
            "tree_depth": self._get_depth(self.root),
            "total_frequency": total_freq
        }
    
    def _get_depth(self, node: Optional[HuffmanNode]) -> int:
        """计算树的深度"""
        if node is None:
            return 0
        if node.is_leaf():
            return 1
        return 1 + max(self._get_depth(node.left), self._get_depth(node.right))


def build_huffman_from_text(text: str) -> Tuple[HuffmanCoder, Dict[str, int]]:
    """
    从文本构建 Huffman 编码器
    
    Args:
        text: 原始文本
        
    Returns:
        (编码器, 频率字典)
    """
    if not text:
        raise ValueError("文本不能为空")
    
    # 统计频率
    frequency = {}
    for char in text:
        frequency[char] = frequency.get(char, 0) + 1
    
    # 构建编码器
    coder = HuffmanCoder()
    coder.build_tree(frequency)
    
    return coder, frequency


# ==================== 测试用例 ====================

def test_basic_encoding():
    """测试基本编码功能"""
    print("测试 1: 基本编码")
    
    frequency = {
        'a': 5,
        'b': 9,
        'c': 12,
        'd': 13,
        'e': 16,
        'f': 45
    }
    
    coder = HuffmanCoder()
    coder.build_tree(frequency)
    
    codes = coder.get_codes()
    print(f"  编码表: {codes}")
    
    # 验证前缀码性质
    for char1, code1 in codes.items():
        for char2, code2 in codes.items():
            if char1 != char2:
                assert not code1.startswith(code2), f"'{code1}' 是 '{code2}' 的前缀"
                assert not code2.startswith(code1), f"'{code2}' 是 '{code1}' 的前缀"
    
    print("  ✓ 前缀码验证通过")
    
    # 测试编码解码
    text = "abcdef"
    encoded = coder.encode(text)
    decoded = coder.decode(encoded)
    
    assert decoded == text, f"解码失败: 期望 '{text}'，得到 '{decoded}'"
    print(f"  原文: {text}")
    print(f"  编码: {encoded}")
    print(f"  解码: {decoded}")
    print("  ✓ 编码解码测试通过\n")


def test_from_text():
    """测试从文本构建"""
    print("测试 2: 从文本构建")
    
    text = "this is an example for huffman encoding"
    coder, frequency = build_huffman_from_text(text)
    
    print(f"  文本: '{text}'")
    print(f"  频率: {frequency}")
    print(f"  编码: {coder.get_codes()}")
    
    encoded = coder.encode(text)
    decoded = coder.decode(encoded)
    
    assert decoded == text, "解码失败"
    
    # 计算压缩比
    original_bits = len(text) * 8
    compressed_bits = len(encoded)
    ratio = original_bits / compressed_bits
    
    print(f"  原始大小: {original_bits} bits")
    print(f"  压缩后: {compressed_bits} bits")
    print(f"  压缩比: {ratio:.2f}x")
    print("  ✓ 从文本构建测试通过\n")


def test_edge_cases():
    """测试边界情况"""
    print("测试 3: 边界情况")
    
    # 单个字符
    coder = HuffmanCoder()
    coder.build_tree({'a': 10})
    assert coder.encode("a") == "0"
    assert coder.decode("000") == "aaa"
    print("  ✓ 单字符测试通过")
    
    # 两个字符
    coder.build_tree({'a': 5, 'b': 10})
    text = "abab"
    assert coder.decode(coder.encode(text)) == text
    print("  ✓ 两字符测试通过")
    
    # 空字符串
    coder.build_tree({'a': 1, 'b': 1})
    assert coder.encode("") == ""
    assert coder.decode("") == ""
    print("  ✓ 空字符串测试通过")
    print()


def test_error_handling():
    """测试错误处理"""
    print("测试 4: 错误处理")
    
    coder = HuffmanCoder()
    
    # 未构建树就编码
    try:
        coder.encode("abc")
        assert False, "应该抛出异常"
    except RuntimeError as e:
        print(f"  ✓ 未构建树错误: {e}")
    
    # 空频率字典
    try:
        coder.build_tree({})
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 空频率字典错误: {e}")
    
    # 负频率
    try:
        coder.build_tree({'a': -1})
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 负频率错误: {e}")
    
    # 零频率
    try:
        coder.build_tree({'a': 0})
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 零频率错误: {e}")
    
    # 编码未知字符
    coder.build_tree({'a': 1, 'b': 2})
    try:
        coder.encode("c")
        assert False, "应该抛出异常"
    except ValueError as e:
        print(f"  ✓ 未知字符错误: {e}")
    print()


def test_optimality():
    """测试最优性"""
    print("测试 5: 编码最优性")
    
    # 高频字符应该有更短的编码
    frequency = {
        'a': 100,  # 高频
        'b': 50,
        'c': 20,
        'd': 10,
        'e': 5    # 低频
    }
    
    coder = HuffmanCoder()
    coder.build_tree(frequency)
    codes = coder.get_codes()
    
    # 高频字符编码长度 <= 低频字符编码长度
    assert len(codes['a']) <= len(codes['e']), "高频字符编码应该更短"
    print(f"  高频字符 'a': 编码 '{codes['a']}' (长度 {len(codes['a'])})")
    print(f"  低频字符 'e': 编码 '{codes['e']}' (长度 {len(codes['e'])})")
    print("  ✓ 最优性测试通过\n")


def run_all_tests():
    """运行所有测试"""
    print("=" * 60)
    print("Huffman 编码测试")
    print("=" * 60 + "\n")
    
    test_basic_encoding()
    test_from_text()
    test_edge_cases()
    test_error_handling()
    test_optimality()
    
    print("=" * 60)
    print("所有测试通过!")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
```

---

## 本节小结

### 这一节解决了什么问题？
如何设计最优前缀编码？

### 核心方法是什么？
Huffman 算法：每次合并最小频率节点。

### 它为什么正确？
交换论证 + 最优子结构。

### 它的代价是什么？
O(n log n)（使用堆维护频率）。

---

## 习题

1. 如何修改 Huffman 算法支持解码时的错误检测？
2. 比较 Huffman 编码和算术编码的优缺点。
3. 如果需要支持动态更新的频率表，如何改进 Huffman 树？
