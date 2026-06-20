# 3.9 二分查找与超越

## 这一节，你能解决什么问题

学完这一节，你能够：

1. **正确实现二分查找**，避免边界 bug（如溢出）
2. **理解二分查找的变体应用**（lower_bound、upper_bound）
3. **判断什么时候用二分查找**，什么时候用其他方法

---

## 问题情境

2006年，Joshua Bloch 发现 Java 的 `Arrays.binarySearch` 有隐藏 bug：

```java
int mid = (low + high) / 2;  // low + high 溢出！
```

修复：

```java
int mid = low + (high - low) / 2;  // 避免溢出
```

**教训**：二分查找看起来简单，但边界容易出错。

---

## 直观思路

**二分查找**：每次排除一半，快速缩小范围。

有序数组中找元素：

- 看中间元素
- 如果比目标大，排除右边一半
- 如果比目标小，排除左边一半
- 重复

**关键**：每次排除一半 → log n 次 → O(log n)。

---

## 规范定义

### 二分查找

**输入**：有序数组 A，目标 x
**输出**：x 的位置（或 -1 如果不存在）

### 复杂度

O(log n)

---

## 算法实现

### 基本二分查找

```python
def binary_search(A, x):
    low = 0
    high = len(A) - 1
    while low <= high:
        mid = low + (high - low) // 2  # 避免溢出
        if A[mid] == x:
            return mid
        elif A[mid] < x:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

**一步步执行**：

```
数组：[1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
查找：11

Step 1: low=0, high=9, mid=5, A[5]=11 → 找到！

查找：8

Step 1: mid=5, A[5]=11 > 8 → high=4
Step 2: mid=2, A[2]=5 < 8 → low=3
Step 3: mid=3, A[3]=7 < 8 → low=4
Step 4: mid=4, A[4]=9 > 8 → high=3
Step 5: low > high → 未找到
```

### 变体：lower_bound（第一个 ≥ x 的位置）

```python
def lower_bound(A, x):
    low = 0
    high = len(A)
    while low < high:
        mid = low + (high - low) // 2
        if A[mid] >= x:
            high = mid
        else:
            low = mid + 1
    return low
```

### 变体：upper_bound（第一个 > x 的位置）

```python
def upper_bound(A, x):
    low = 0
    high = len(A)
    while low < high:
        mid = low + (high - low) // 2
        if A[mid] > x:
            high = mid
        else:
            low = mid + 1
    return low
```

---

## 这个方法是怎么想到的

### 二分查找的思路

**问题**：有序数组中找元素。

**朴素方法**：逐个检查 → O(n)

**洞察**：有序 → 比中间元素 → 排除一半

**关键**：每次缩小一半 → log n 次

### 为什么会有 bug？

**溢出 bug**：

```java
int mid = (low + high) / 2;
```

当 low + high > INT_MAX，溢出变成负数。

**正确写法**：

```java
int mid = low + (high - low) / 2;
```

---

## 正确性分析

### 循环不变式

**不变式**：每次循环开始时：
- 目标 x 如果存在，一定在 [low, high] 范围内
- [low, high] 外的元素都不是 x

**证明**：

初始化：low=0, high=len(A)-1，范围是整个数组。成立。

保持：
- 如果 A[mid] < x，排除 [low, mid]，x 必在 [mid+1, high]
- 如果 A[mid] > x，排除 [mid, high]，x 必在 [low, mid-1]

终止：
- 找到 x → 返回位置
- low > high → x 不存在

---

## 复杂度分析

每次循环排除一半。

循环次数 = log₂(n)

时间复杂度 = O(log n)

---

## 什么时候不该用这个方法

### 该用二分查找的情况

- 数组有序
- 静态数据（不频繁插入删除）

### 不该用二分查找的情况

- 数组无序（先排序 Θ(n log n)）
- 频繁插入删除（用哈希表或树）

---

## 本节小结

**解决了什么问题？**

有序数组快速查找，O(log n)。

**核心方法是什么？**

每次排除一半 → log n 次。

**为什么正确？**

循环不变式保证目标始终在范围内。

**代价是什么？**

需要有序数组。如果频繁插入删除，维护有序的成本高。

**适用场景？**

静态有序数据查找。

---

## 练习

### 基本理解

**练习 1**：实现二分查找，特别注意边界条件。

**练习 2**：数组 [1, 2, 2, 2, 3, 4]，计算 lower_bound(2) 和 upper_bound(2)。

**练习 3**：用二分查找计算 sqrt(1000) 的整数部分。

### 错误诊断

**练习 4**：以下实现有什么问题？

```python
def binary_bug(A, x):
    low, high = 0, len(A) - 1
    while low < high:           # ← 这里
        mid = (low + high) // 2  # ← 这里
        if A[mid] == x:
            return mid
        elif A[mid] < x:
            low = mid           # ← 这里
        else:
            high = mid          # ← 这里
    return -1
```

分析：循环条件、溢出、范围更新是否正确？

### 方法应用

**练习 5**：设计一个 Skill，在 log-prob 空间中选择搜索策略。

---

**上一节：[3.8 字符串匹配](/chapters/ch03/08-string-matching)**

**下一节：[3.10 综合练习](/chapters/ch03/10-exercises)**
