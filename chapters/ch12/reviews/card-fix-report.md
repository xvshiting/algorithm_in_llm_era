# Ch12 卡片数量修复报告

**修复时间**: 2026-06-20 22:15
**修复者**: Planner (subagent)

---

## 修复内容

### 原问题

Felix 评审发现每节卡片数量不一致：
- 04-backtracking.md: 应 8 张，实际 7 张
- 05-six-question-method.md: 应 8 张，实际 11 张
- 06-comprehensive-exercises.md: 应 8 张，实际 6 张

### 修复方案

1. **04-backtracking.md**: 新增 C12-32 "回溯应用场景"
2. **05-six-question-method.md**: 重新编号 C12-32~40 → C12-33~40，移除末尾 3 张卡片
3. **06-comprehensive-exercises.md**: 新增 C12-41 "策略 vs 战术"、C12-42 "从简单到正确到高效"

### 修复后状态

| 章节 | 卡片数 | 编号范围 |
|------|--------|----------|
| 01-divide-conquer.md | 8 张 | C12-01 ~ C12-08 |
| 02-greedy.md | 8 张 | C12-09 ~ C12-16 |
| 03-dynamic-programming.md | 8 张 | C12-17 ~ C12-24 |
| 04-backtracking.md | 8 张 | C12-25 ~ C12-32 |
| 05-six-question-method.md | 8 张 | C12-33 ~ C12-40 |
| 06-comprehensive-exercises.md | 8 张 | C12-41 ~ C12-48 |
| **总计** | **48 张** | **C12-01 ~ C12-48** |

---

## 验证

✅ 索引标注 48 张 → 实际 48 张
✅ 每节 8 张卡片

---

**修复完成**
