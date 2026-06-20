# Ch3 排序与查找——从确定性到概率性的思想跃迁

## 文件结构

```
ch03/
├── index.md                    # 章节导入 + 核心叙事
├── 01-theory-limit.md          # 3.1 排序理论极限（决策树下界）
├── 02-insertion-sort.md        # 3.2 插入排序与循环不变式
├── 03-divide-conquer.md        # 3.3 分治排序（归并+快排）
├── 04-heap-sort.md             # 3.4 堆排序
├── 05-linear-sort.md           # 3.5 线性时间排序
├── 06-order-statistics.md      # 3.6 顺序统计量
├── 07-hash-randomization.md    # 3.7 哈希（核心章节）★
├── 08-string-matching.md       # 3.8 字符串匹配
├── 09-binary-search.md         # 3.9 二分查找与超越
├── 10-exercises.md             # 3.10 综合练习
├── 11-llm-connection.md        # 3.11 从哈希到 LLM 采样（核心章节）★
└── README.md                   # 本文件
```

## 核心叙事链条

```
确定性排序 → 理论极限 → 必须引入随机性 → 随机化作为设计 → LLM采样
```

## 重点章节

- **07-hash-randomization.md**：Skiena 视角转换——哈希是随机化算法
- **11-llm-connection.md**：哈希设计原则如何应用于 LLM 采样策略

## 图解清单

| 图解 | 位置 | 描述 |
|------|------|------|
| 决策树图 | 01-theory-limit.md | n=3 排序的决策树结构 |
| PARTITION 图 | 03-divide-conquer.md | 分区操作可视化 |
| 堆结构图 | 04-heap-sort.md | 堆的树形表示和数组映射 |
| Bloom Filter 图 | 07-hash-randomization.md | 多哈希函数映射示意 |
| KMP 失败函数图 | 08-string-matching.md | 模式串自匹配示意 |

## 练习层次

- **层次一（基础）**：手工计算、证明验证
- **层次二（LLM 协同）**：让 agent 实现，你审查和评判
- **层次三（Agent 设计）**：设计 Skill 或策略选择器

## 参考文献

- CLRS, *Introduction to Algorithms*, 4th ed., Chapters 6-11, 25
- Skiena, *The Algorithm Design Manual*, 3rd ed., Chapters 4-5
- Sedgewick & Wayne, *Algorithms*, 4th ed., Chapters 2-4
- "The Probability Spaces of QuickSort", arXiv 2025-06
- "Structure Development in List-Sorting Transformers", arXiv 2025-01
- "Top-H Decoding: Bounded Entropy", arXiv 2025-09

---

**撰写**: Dana (2026-06-20)
**结构审查**: Alex (评分 8.5/10 → 建议拆分)
**论文调研**: Nova (Ch3-research.md)
