# 3.9 二分查找与超越

## 学习目标

学完这一节，你能：

- 理解二分查找的分治本质
- 掌握二分查找的变体应用
- 理解 vEB 树如何突破 O(log n) 到 O(log log n)
- 将二分查找与 LLM 的 log-probability 搜索关联

---

## War Story：二分查找的 bug

2006年，Joshua Bloch 发现 Java 的 `Arrays.binarySearch` 有一个隐藏 bug：

```java
int mid = (low + high) / 2;  // 当 low + high > INT_MAX 时溢出
```

修复：

```java
int mid = low + (high - low) / 2;  // 避免溢出
```

**教训**：二分查找看起来简单，但边界条件容易出错。让 agent 写二分查找时，要特别审查边界。

---

## 二分查找

**问题**：在有序数组 A 中查找元素 x

**算法**：

```
BINARY-SEARCH(A, x):
    low = 0, high = len(A) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if A[mid] == x:
            return mid
        elif A[mid] < x:
            low = mid + 1
        else:
            high = mid - 1
    return -1  // 未找到
```

**复杂度**：O(log n)

**图解说明**：

```
数组：[1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
查找：11

Step 1: mid=5, A[5]=11 → 找到！

查找：8

Step 1: mid=5, A[5]=11 > 8 → high=4
Step 2: mid=2, A[2]=5 < 8 → low=3
Step 3: mid=3, A[3]=7 < 8 → low=4
Step 4: mid=4, A[4]=9 > 8 → high=3
Step 5: low > high → 未找到
```

---

## 二分查找的变体

### 1. 查找第一个匹配位置（重复元素）

```
LOWER-BOUND(A, x):
    low = 0, high = len(A)
    while low < high:
        mid = low + (high - low) // 2
        if A[mid] >= x:
            high = mid
        else:
            low = mid + 1
    return low
```

### 2. 查找最后一个匹配位置

```
UPPER-BOUND(A, x):
    low = 0, high = len(A)
    while low < high:
        mid = low + (high - low) // 2
        if A[mid] > x:
            high = mid
        else:
            low = mid + 1
    return low - 1
```

### 3. 计算匹配元素数量

```
COUNT(A, x):
    return UPPER-BOUND(A, x) - LOWER-BOUND(A, x)
```

### 4. 平方根近似

```
SQRT(x):
    low = 0, high = x
    while low <= high:
        mid = low + (high - low) // 2
        if mid² <= x < (mid+1)²:
            return mid
        elif mid² > x:
            high = mid - 1
        else:
            low = mid + 1
```

---

## vEB 树：突破 O(log n)

**问题**：二分查找 O(log n) 能更快吗？

**答案**：当键是整数时，可以！

**vEB 树（van Emde Boas Tree）**：

核心思想：利用键的位结构，分层"跳过"

```
键 x 是 u 位整数：
- 高 u/2 位：集群编号
- 低 u/2 位：集群内位置

查找 x：
1. 在 summary（集群编号索引）中找集群
2. 在集群中找位置

每步 O(log u/2) = O(log log u)
总共 O(log log u)
```

**复杂度**：O(log log u)，u 是键值范围

**空间**：Θ(u)

**适用场景**：

- 键是整数且范围有限
- 需要超快速查找（如高频交易）
- 空间不敏感

---

## 与 LLM 的关联

### 1. Log-probability 搜索

LLM 的 log-probability 空间可以类比有序数组：

```
LLM 输出：log-probabilities 排序后递减

最高概率 token → 最高 log-prob
Top-k → 前 k 个
Top-p → 累积概率 ≥ p

本质：在 log-prob 数组中"搜索"截断点
```

### 2. Embedding 空间搜索

LLM 的 embedding 空间是高维向量空间：

```
传统方法：k-NN 线性搜索 → O(n)
近似方法：LSH（局部敏感哈希）→ O(1) 期望

类比：
- 二分查找：有序数组的精确搜索 → O(log n)
- LSH：高维空间的近似搜索 → O(1) 期望
```

---

## 练习

### 层次一（基础）

1. **二分查找实现**：实现二分查找，特别注意边界条件（low + high 溢出）。

2. **变体验证**：对数组 [1, 2, 2, 2, 3, 4]，计算 LOWER-BOUND(2) 和 UPPER-BOUND(2)。

3. **平方根**：用二分查找计算 sqrt(1000) 的整数部分。

### 层次二（LLM 协同）

4. **边界 bug 检测**：让 LLM 写二分查找，审查是否有边界 bug。

5. **vEB 探索**：让 LLM 解释 vEB 树的结构，类比二分查找的"跳过"机制。

### 层次三（Agent 设计）

6. **搜索策略 Skill**：设计一个 Skill，在 log-prob 空间中选择搜索策略（二分 vs 线性）。

---

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Section 25.2
- van Emde Boas, "Preserving Order in a Forest in Less Than Logarithmic Time", STOC 1975
