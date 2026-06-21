# 12.6 综合练习：将六问法编码为Agent Skill

> **核心问题**：如何将六问法编码为Agent Skill？
> 
> **直觉**：把方法论变成可复用的"小程序"——输入问题，输出诊断报告。

---

## 一、终章项目：六问诊断Agent Skill设计

### 1.1 项目目标

**目标**：将六问诊断法编码为Agent Skill，使其能自动诊断算法问题。

**输入输出**：

```
输入：算法问题描述（文本）
输出：结构化诊断报告（JSON）
```

### 1.2 Skill设计框架

```
┌─────────────────────────────────────┐
│ 输入：问题描述                       │
│ "给定一个字符串，找出最长回文子串"  │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Q1: 理解问题                        │
│ 解析：输入、输出、约束              │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Q2: 简单算法                        │
│ 生成：暴力基线方案                  │
│ 分析：瓶颈                          │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Q3: 查目录                          │
│ 匹配：问题类型                      │
│ 检索：相关章节                      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Q4: 特殊情况                        │
│ 生成：简化版本                      │
│ 分析：隐藏结构                      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Q5: 范式匹配                        │
│ 候选：分治/贪心/DP/回溯             │
│ 比较：复杂度                        │
│ 推荐：最优方案                      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ Q6: 循环修正                        │
│ 测试：反例                          │
│ 标注：待确认点                      │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│ 输出：结构化诊断报告                │
│ JSON格式                            │
└─────────────────────────────────────┘
```

---

## 二、输出模板设计

### 2.1 诊断报告JSON模板

```json
{
  "problem_understanding": {
    "input": "字符串s（长度n）",
    "output": "最长回文子串（字符串）",
    "constraints": {
      "time": "O(n²)可接受",
      "space": "O(n)或O(n²)可接受",
      "correctness": "必须是最长且是回文"
    },
    "examples": [
      {
        "input": "babad",
        "output": "bab或aba（长度3）"
      }
    ]
  },
  
  "baseline_solution": {
    "method": "枚举所有子串，检查回文，找最长",
    "complexity": {
      "time": "O(n³)",
      "space": "O(1)"
    },
    "bottleneck": "回文检查O(n)，重复计算多次"
  },
  
  "problem_type": {
    "category": "字符串问题、最优化问题",
    "related_chapters": ["Ch3扩展", "Ch6DP"]
  },
  
  "special_cases": [
    {
      "condition": "单字符",
      "solution": "总是回文（长度1）",
      "insight": "回文有对称中心"
    }
  ],
  
  "paradigm_candidates": [
    {
      "paradigm": "DP",
      "state": "dp[i][j] = s[i:j]是否回文",
      "transition": "dp[i][j] = (s[i]==s[j]) and (j-i<=2 or dp[i+1][j-1])",
      "complexity": {
        "time": "O(n²)",
        "space": "O(n²)"
      },
      "pros": "易理解，正确性保证",
      "cons": "空间较大"
    },
    {
      "paradigm": "中心扩展",
      "method": "枚举中心，向两边扩展",
      "complexity": {
        "time": "O(n²)",
        "space": "O(1)"
      },
      "pros": "空间最优",
      "cons": "思路稍复杂"
    },
    {
      "paradigm": "Manacher",
      "method": "利用对称性避免重复检查",
      "complexity": {
        "time": "O(n)",
        "space": "O(n)"
      },
      "pros": "时间最优",
      "cons": "实现复杂，理解门槛高"
    }
  ],
  
  "recommendation": {
    "primary": "中心扩展",
    "reason": "空间最优，复杂度合理",
    "alternative": {
      "simple": "DP",
      "advanced": "Manacher"
    }
  },
  
  "test_cases": [
    {
      "input": "babad",
      "expected": "bab或aba",
      "validation": "通过"
    },
    {
      "input": "cbbd",
      "expected": "bb",
      "validation": "通过"
    }
  ],
  
  "need_human_review": [
    "Manacher实现复杂度",
    "是否需要最优时间复杂度"
  ]
}
```

---

## 三、练习设计：分层次综合练习

### 3.1 基础理解练习（15%）

**练习 12.6-1**：为什么六问法是"设计算法的算法"？

**参考答案**：

```
六问法是一个决策流程：
输入：问题描述
输出：推荐方案

这个流程本身是一个"元算法"：
├── Q1-Q5：决策步骤（if-else分支）
├── Q6：迭代修正（while循环）
└── 输出：结构化诊断报告

六问法解决了"面对陌生问题时如何推进"的问题，
给出了一个系统化的方法，而非依赖"灵感"。
```

**练习 12.6-2**：六问法与七步法的区别是什么？

**参考答案**：

```
七步法（教学框架）：
├── 目的：系统讲解每种算法范式
├── 应用：教材章节结构设计
└── 对象：教师/教材编写者

六问法（求解流程）：
├── 目的：面对陌生问题时系统推进
├── 应用：算法设计实践
└── 对象：学习者/工程师

类比：
├── 七步法：教材章节结构（"教"的框架）
└── 六问法：医生诊断清单（"学"的流程）
```

### 3.2 范式回顾练习（25%）

**练习 12.6-3**：对比四种范式在"排序问题"上的适用性。

**参考答案**：

```
排序问题：将数组按升序排列

分治：
├── 适用：归并排序、快速排序
├── 理由：可以分成两半分别排序，再合并
├── 复杂度：O(n log n)
└── 推荐：归并排序（稳定）、快速排序（平均最优）

贪心：
├── 不适用：排序不是贪心问题
├── 理由：局部最优（选最小元素）不能保证全局最优（整个数组有序）
└── 失败反例：选择排序O(n²)，不是贪心

DP：
├── 不适用：排序不是DP问题
├── 理由：无重叠子问题（每次比较都是独立的）
└── 强行DP：复杂度更高

回溯：
├── 不适用：排序不需要枚举所有排列
├── 理由：回溯求所有解，排序只需一个解
└── 强行回溯：生成所有排列O(n!)

结论：排序问题适合分治（归并排序、快速排序）
```

**练习 12.6-4**：分析为何"活动选择问题"贪心优于DP。

**参考答案**：

```
活动选择问题：选最多不重叠活动

贪心解法：
├── 策略：按结束时间排序，每次选最早结束的不重叠活动
├── 复杂度：O(n log n)（排序）+ O(n)（选择）= O(n log n)
├── 正确性：交换论证证明
└── 优点：简单高效

DP解法：
├── 状态：dp[i] = 以活动i结束的最大活动数
├── 转移：dp[i] = max(dp[j] + 1) for j < i且activity[j]不重叠activity[i]
├── 复杂度：O(n²)
└── 缺点：复杂度更高

为何贪心优于DP：
├── 贪心满足两个条件：贪心选择性质 + 最优子结构
├── 贪心复杂度O(n log n)优于DP复杂度O(n²)
└── 贪心思路更直观

教训：当贪心条件满足时，贪心优于DP（更简单、更快）
```

### 3.3 六问法应用练习（20%）

**练习 12.6-5**：用六问诊断法分析"最长公共子串"问题。

**参考答案**：

```
问题：给定两个字符串，找最长公共子串（连续片段）

Q1: 理解问题
输入：两个字符串X和Y（长度m和n）
输出：最长公共子串（字符串）
约束：O(mn)时间可接受
小例子：X="ABCDEF", Y="ZBCDXY" → 公共子串"BCD"长度3

Q2: 简单算法
暴力解法：枚举X的所有子串，检查是否在Y中，找最长的
复杂度：O(m² × n) 或 O(m × n²)
瓶颈：子串数O(m²)，检查需O(n)

Q3: 查目录
问题类型：字符串问题、最优化问题
候选范式：DP

Q4: 特殊情况
固定参数：单字符匹配
启发：公共子串有连续性

Q5: 范式匹配
候选方案：DP
状态：dp[i][j] = 以X[i]和Y[j]结尾的最长公共子串长度
转移：dp[i][j] = dp[i-1][j-1] + 1 if X[i]==Y[j] else 0
复杂度：O(mn)时间，O(mn)空间（可优化到O(min(m,n))）

推荐方案：DP

Q6: 循环修正
小例子验证：X="ABC", Y="BC"
dp[1][0] = (B==B) → dp[0][-1]未定义？需要边界处理
修正：dp[i][j] = (X[i]==Y[j]) ? (dp[i-1][j-1] + 1 if i>0 and j>0 else 1) : 0
验证通过 ✓
```

### 3.4 错误诊断练习（15%）

**练习 12.6-6**：诊断一个错误的贪心策略。

**问题描述**：某人用贪心策略解决"区间覆盖问题"，每次选最长的区间。

**诊断过程**：

```
问题：用最少的区间覆盖[0, L]

错误贪心策略：每次选最长的区间

反例构造：
区间：[0, 5], [3, 8], [5, 10], [8, 12]
目标：覆盖[0, 12]

贪心选择：
Step1: 选最长区间[0, 5]或[5, 10]（长度5）
假设选[0, 5]，覆盖[0, 5]
Step2: 选能接上的最长区间[5, 10]，覆盖[0, 10]
Step3: 选能接上的最长区间[8, 12]，覆盖[0, 12]
总区间数：3

最优解：
选[0, 5], [3, 8], [8, 12]
或选[0, 5], [5, 10], [8, 12]
总区间数：3？

等等，贪心也是3个，看起来没问题？
再构造：
区间：[0, 3], [2, 6], [5, 8], [7, 10]
目标：覆盖[0, 10]

贪心选最长：
Step1: 选[2, 6]（长度4），覆盖[0-2未覆盖，2-6已覆盖]
问题：贪心选的最长区间不一定从起点开始！

修正贪心：
策略：每次选能覆盖当前起点且最长的区间
Step1: 起点=0，可选[0, 3]，覆盖[0, 3]
Step2: 起点=3，可选[2, 6]（起点需≤3）→ 不行！
可选[5, 8]（起点5>3）→ 不行！
没有可选区间？失败！

原因：贪心选了[0, 3]，但后续没有区间从3开始
最优解：[0, 3], [2, 6], [5, 8], [7, 10] → 需要重叠区间

正确策略：
每次选能覆盖当前起点且终点最远的区间
（贪心选择性质：终点最远一定是某个最优解的一部分）
```

### 3.5 Agent Skill设计练习（15%）

**练习 12.6-7**：实现六问诊断Agent Skill的核心逻辑。

**参考实现**：

```python
def six_question_diagnosis_agent(problem_description):
    """
    六问诊断Agent Skill核心逻辑
    
    输入：问题描述文本
    输出：结构化诊断报告
    """
    import json
    
    report = {
        "problem_understanding": {},
        "baseline_solution": {},
        "problem_type": {},
        "special_cases": [],
        "paradigm_candidates": [],
        "recommendation": {},
        "test_cases": [],
        "need_human_review": []
    }
    
    # Q1: 理解问题（NLP解析）
    report["problem_understanding"] = parse_problem(problem_description)
    
    # Q2: 简单算法（生成基线）
    baseline = generate_baseline(report["problem_understanding"])
    report["baseline_solution"] = {
        "method": baseline["method"],
        "complexity": baseline["complexity"],
        "bottleneck": baseline["bottleneck"]
    }
    
    # Q3: 查目录（检索知识库）
    problem_type = match_problem_type(report["problem_understanding"])
    report["problem_type"] = {
        "category": problem_type,
        "related_chapters": get_related_chapters(problem_type)
    }
    
    # Q4: 特殊情况（生成简化版本）
    special_cases = generate_special_cases(report["problem_understanding"])
    report["special_cases"] = special_cases
    
    # Q5: 范式匹配（核心决策）
    candidates = []
    
    # 分治候选
    if can_divide(report["problem_understanding"]):
        divide_candidate = generate_divide_candidate(report)
        candidates.append(divide_candidate)
    
    # 贪心候选
    if can_greedy(report["problem_understanding"]):
        greedy_candidate = generate_greedy_candidate(report)
        candidates.append(greedy_candidate)
    
    # DP候选
    if has_overlapping_subproblems(report["problem_understanding"]):
        dp_candidate = generate_dp_candidate(report)
        candidates.append(dp_candidate)
    
    # 回溯候选
    if needs_exhaustive_search(report["problem_understanding"]):
        backtrack_candidate = generate_backtrack_candidate(report)
        candidates.append(backtrack_candidate)
    
    report["paradigm_candidates"] = candidates
    
    # 选择最优候选
    best_candidate = select_best_candidate(candidates)
    report["recommendation"] = {
        "primary": best_candidate["paradigm"],
        "reason": best_candidate["reason"],
        "alternative": get_alternatives(candidates, best_candidate)
    }
    
    # Q6: 循环修正（生成测试案例）
    test_cases = generate_test_cases(report["recommendation"])
    report["test_cases"] = test_cases
    
    # 标注待确认点
    review_points = identify_review_points(report)
    report["need_human_review"] = review_points
    
    return json.dumps(report, indent=2)

# 辅助函数（示意）
def parse_problem(description):
    """NLP解析问题描述"""
    # 实际实现需调用NLP API或使用规则解析
    return {
        "input": "解析出的输入",
        "output": "解析出的输出",
        "constraints": "解析出的约束"
    }

def generate_baseline(problem):
    """生成暴力基线方案"""
    return {
        "method": "枚举所有可能",
        "complexity": {"time": "指数级", "space": "O(1)"},
        "bottleneck": "搜索空间太大"
    }

def match_problem_type(problem):
    """匹配问题类型"""
    # 实际实现需检索知识库
    return "字符串问题"

def get_related_chapters(problem_type):
    """获取相关章节"""
    chapter_map = {
        "排序": ["Ch3"],
        "图": ["Ch4", "Ch7"],
        "DP": ["Ch6"],
        "字符串": ["Ch3扩展"]
    }
    return chapter_map.get(problem_type, [])

def can_divide(problem):
    """判断是否可分治"""
    # 检查子问题是否独立
    return True  # 示意

def can_greedy(problem):
    """判断是否可贪心"""
    # 检查贪心选择性质
    return True  # 示意

def has_overlapping_subproblems(problem):
    """判断是否有重叠子问题"""
    # 检查子问题是否重叠
    return True  # 示意

def needs_exhaustive_search(problem):
    """判断是否需要穷举"""
    # 检查是否需要枚举所有解
    return False  # 示意

def select_best_candidate(candidates):
    """选择最优候选"""
    # 比较复杂度，选择最优
    best = candidates[0]  # 示意
    for candidate in candidates:
        if candidate["complexity"]["time"] < best["complexity"]["time"]:
            best = candidate
    return best

def identify_review_points(report):
    """标注待确认点"""
    review_points = []
    # 检查范式选择是否合理
    if len(report["paradigm_candidates"]) > 2:
        review_points.append("多种范式都适用，需人工确认选择")
    return review_points
```

### 3.6 LLM协同实验练习（10%）

**练习 12.6-8**：设计LLM协同诊断流程。

**参考设计**：

```
LLM协同诊断流程：

Step1: 输入问题描述给LLM
├── 提示词："请用六问诊断法分析以下问题：..."
└── 输出：LLM生成的诊断报告初稿

Step2: 人工审查LLM输出
├── 审查Q1-Q3：理解是否正确？基线是否合理？
├── 审查Q5：范式选择是否正确？复杂度分析是否准确？
└── 标注待修正点

Step3: LLM迭代修正
├── 输入：人工标注的待修正点
├── 提示词："请修正诊断报告的以下部分：..."
└── 输出：修正后的诊断报告

Step4: 最终确认
├── 人工确认推荐方案
├── 测试验证
└── 输出最终诊断报告

LLM擅长与不擅长：
├── 擅长：Q1-Q3（解析、生成基线）
├── 不擅长：Q4-Q6（特殊情况判断、复杂度精确分析、反例构造）
└── 人机分工：LLM自动化Q1-Q3，人审查并补充Q4-Q6
```

---

## 四、知识卡片

### C12-41 策略 vs 战术

**直觉解释**：策略是"做什么"，战术是"怎么做"。

**核心内容**：策略 = 建模决策（范式选择、数据结构选择）；战术 = 实现细节。

**关键特征**：策略错误再好的战术也救不了，策略正确战术粗糙也能接受。

**常见误解**：

- ❌ 先优化代码——先确保策略（范式选择）正确
- ✅ 正确理解：策略优先于战术

**实例**：策略选DP但应该是贪心——代码再优化也是错误方向。

**LLM时代关联**：LLM Agent能力分层：策略层（选择范式）+ 战术层（实现细节）。

### C12-42 从简单到正确到高效

**直觉解释**：先能跑，再跑对，最后跑得快。

**核心内容**：简单算法（基线）→ 正确算法（验证通过）→ 高效算法（优化复杂度）。

**关键特征**：三层递进，不可跳过"正确"直接追"高效"。

**常见误解**：

- ❌ 直接写高效代码——复杂度优化前必须确保正确性
- ✅ 正确理解：先正确，再高效

**实例**：排序——暴力O(n²) → 归并排序O(n log n)，每步验证正确性。

**LLM时代关联**：LLM代码生成流程：先写正确的代码，再优化性能。


### C12-43 综合诊断报告

**直觉解释**：把问题诊断过程结构化输出，像医生的诊断书。

**核心内容**：问题理解 → 简单基线 → 候选范式 → 复杂度比较 → 推荐方案 → 反例风险。

**关键特征**：结构化输出便于审查和迭代。

**常见误解**：

- ❌ 报告越详细越好——应抓住关键决策点，简洁明了
- ✅ 正确理解：报告应聚焦关键决策，而非冗长细节

**实例**：最长回文子串诊断报告（暴力O(n³) → DP O(n²) → Manacher O(n))。

**LLM时代关联**：LLM代码审查报告：分析代码问题，给出改进建议。

### C12-44 Agent Skill设计

**直觉解释**：把六问法变成可复用的"小程序"。

**核心内容**：输入（问题描述）→ 处理（六问诊断）→ 输出（结构化报告）。

**关键特征**：Skill可组合、可复用、可改进。

**常见误解**：

- ❌ Skill越智能越好——清晰可预测比"智能"更重要
- ✅ 正确理解：Skill应清晰、可预测、可审查

**实例**：六问诊断Skill——自动识别问题类型、列举候选范式、比较复杂度。

**LLM时代关联**：LLM Skill工程：将算法知识编码为可复用的Agent能力。

### C12-45 范式选择决策树

**直觉解释**：像查字典，按特征找到对应范式。

**核心内容**：问题特征 → 分支判断 → 范式推荐。

**关键特征**：决策树帮助快速定位候选范式。

**常见误解**：

- ❌ 决策树覆盖所有情况——边缘情况需要灵活处理
- ✅ 正确理解：决策树是快速定位工具，不是绝对规则

**实例**：决策树片段——子问题独立？是→分治；否→子问题重叠？是→DP；否→贪心或回溯。

**LLM时代关联**：LLM算法选择：根据问题特征自动选择合适的算法范式。

### C12-46 复杂度速查表

**直觉解释**：常用范式复杂度的"小抄"。

**核心内容**：

| 范式 | 典型复杂度 |
|------|-----------|
| 分治 | O(n log n) |
| 贪心 | O(n log n)或O(n) |
| DP | O(状态数×转移成本) |
| 回溯 | O(搜索空间) |

**关键特征**：复杂度是范式选择的重要依据。

**常见误解**：

- ❌ 复杂度唯一决定范式选择——实际应用还需考虑实现难度、常数因子
- ✅ 正确理解：复杂度是重要依据，但不是唯一依据

**实例**：排序复杂度速查——冒泡O(n²)、归并O(n log n)、快速O(n log n)平均。

**LLM时代关联**：LLM复杂度估算：快速评估算法可行性，选择合适方案。

### C12-47 反例构造技巧

**直觉解释**：找到让算法"翻车"的例子。

**核心内容**：边界值测试、极端情况构造、随机测试+验证。

**关键特征**：反例是发现设计漏洞的高效方法。

**常见误解**：

- ❌ 随机测试能发现所有bug——系统性构造反例更高效
- ✅ 正确理解：系统构造反例比随机测试更高效

**实例**：贪心反例构造——找"局部最优导致全局非最优"的情况（如0-1背包）。

**LLM时代关联**：LLM测试用例生成：构造边界情况和反例，验证代码正确性。

### C12-48 LLM协同诊断

**直觉解释**：让AI帮忙诊断，但人要审查关键环节。

**核心内容**：LLM擅长Q1-Q3（解析、生成）；人擅长Q4-Q6（判断、反例）。

**关键特征**：人机协作分工，发挥各自优势。

**常见误解**：

- ❌ LLM能完全替代诊断——LLM不擅长发现反例和边界情况
- ✅ 正确理解：LLM辅助，人审查

**实例**：LLM诊断最长回文子串→输出DP方案→人审查发现Manacher更优。

---

## 五、终章总结：算法设计方法论的核心价值

### 5.1 方法论的本质

六问诊断法的本质是：**把方法论看成一个算法**。

```
元算法：设计算法的算法
├── 输入：问题描述
├── 输出：推荐方案
├── 决策流程：Q1-Q5的if-else分支
└── 迭代修正：Q6的while循环
```

这个元算法解决了"面对陌生问题时如何推进"的问题，给出了一个系统化的方法。

### 5.2 四大范式的适用边界

| 范式 | 适用条件 | 禁忌 | 典型问题 |
|------|---------|------|---------|
| **分治** | 子问题独立、合并简单 | 子问题重叠 | 归并排序、FFT |
| **贪心** | 贪心选择性质、最优子结构 | 局部最优非全局最优 | Dijkstra、MST |
| **DP** | 重叠子问题、最优子结构 | 无重叠子问题 | LIS、背包 |
| **回溯** | 无有效分解、需枚举 | 剪枝不足 | N皇后、SAT |

### 5.3 策略先于战术

**策略**（范式选择、数据结构选择）决定了算法的基本框架。

**战术**（代码优化、边界处理）只能在这个框架内优化。

**教训**：策略错误，再好的战术也救不了。

### 5.4 从简单到正确到高效

```
第一层：简单（基线）
├── 暴力解法
├── 正确性验证
└── 理解瓶颈

第二层：正确（范式）
├── 选择正确范式
├── 设计正确算法
└── 构造反例验证

第三层：高效（优化）
├── 优化复杂度
├── 空间优化
└── 常数因子优化
```

**不可跳过第二层**——先保证正确，再追求高效。

### 5.5 六问法→Agent循环

六问诊断法可以直接编码为Agent Skill：

- **Q1-Q5**：Agent规划循环的决策步骤
- **Q6**：反馈修正环节

这实现了"方法论算法化"——把人的思考流程编码为机器可执行的Skill。

### 5.6 人机协作的最佳模式

| 任务 | LLM擅长 | 人擅长 |
|------|---------|---------|
| 理解问题 | 解析文本 | 判断隐式约束 |
| 简单算法 | 生成基线代码 | 理解瓶颈本质 |
| 查目录 | 检索知识库 | 确认匹配准确性 |
| 特殊情况 | 生成简化版本 | 判断是否有意义 |
| 范式匹配 | 列举候选 | 比较复杂度、选择最优 |
| 循环修正 | 执行测试 | 构造反例、重新建模 |

**最佳模式**：LLM自动化Q1-Q3，人审查并补充Q4-Q6。

---

## 六、终章回顾：你学到了什么？

读完本章，你应该能够：

1. ✅ **系统回顾**四大范式（分治、贪心、DP、回溯）的核心思想
2. ✅ **清晰理解**范式间的对比（何时用、何时不用、为什么）
3. ✅ **掌握**六问诊断法的执行流程
4. ✅ **应用**六问法分析陌生问题
5. ✅ **设计**Agent Skill实现六问诊断法的自动化
6. ✅ **批判性思考**"策略先于战术"、"从简单到正确到高效"

---

## 七、全书终章：从算法思维到Agent设计

### 7.1 教材的三阶培养目标

| 阶段 | 目标 | Ch12体现 |
|------|------|---------|
| **一阶** | 算法思维 | 理解六问诊断法的逻辑，建立"策略先于战术"的思维 |
| **二阶** | 人机协同 | 用LLM走六问法，人工审查每步判断 |
| **三阶** | Agent设计 | 将六问法编码为Skill，设计"设计算法的算法" |

### 7.2 从Ch1到Ch12的完整旅程

```
Ch1 → 理解问题：六问法开场
Ch2 → 数据结构：问题表示
Ch3 → 分治：分解→合并
Ch4 → 图：网络建模
Ch5 → 回溯：系统搜索
Ch6 → DP：重叠子问题缓存
Ch7 → 贪心：局部最优
Ch8 → NP完全：难解边界
Ch9 → 分布式：规模扩展
Ch10 → 流式：无限数据
Ch11 → Transformer：检索融合
Ch12 → 方法论：元算法设计
```

### 7.3 终章的收官价值

Ch12不仅是"回顾"，更是"升华"：

- **回顾者**：系统回顾全书12章的核心概念
- **整合者**：建立概念之间的连接网络
- **方法论者**：提炼六问诊断法的决策流程
- **Agent设计者**：将方法论编码为Skill
- **收官者**：完成教材叙事闭环

---

## 八、推荐阅读与参考资料

### 8.1 经典教材

1. **Kleinberg & Tardos** - *Algorithm Design*：问题建模、范式选择
2. **Cormen et al.** - *CLRS*：复杂度分析、正确性证明
3. **Skiena** - *The Algorithm Design Manual*：War Story风格
4. **Roughgarden** - *Algorithms Illuminated*：复杂度层次

### 8.2 方法论经典

1. **Polya** - *How to Solve It*：问题解决方法论
2. **Knuth** - *The Art of Computer Programming*：算法设计艺术
3. **Tarjan** - *Data Structures and Network Algorithms*：数据结构设计思维

### 8.3 LLM与算法设计

1. **LLM作为算法设计助手**：Prompt engineering for algorithm design
2. **Agent Skill设计**：Methodology as Skill
3. **人机协作模式**：Human-AI collaboration in algorithm design

---

**导航**：[上一节：12.5 六问诊断法](./05-six-question-method.md) | [返回章节导览](./index.md)

---

**终章完成**。愿你掌握了算法设计的核心方法论，能在面对任何陌生问题时，有条不紊地推进，不再迷茫。

**算法设计不是等待灵感，而是执行清单。**——试飞员心态
