# 算法分析与设计：AI时代的判断力训练

> 新时代的算法课程——不是教写代码，而是教判断

## 项目简介

这是一本面向AI时代的算法教材。当coding agent可以帮你写代码时，你需要掌握的核心能力不再是"如何实现"，而是"如何判断"——判断问题类型、判断解法正确性、判断复杂度、判断建模方向。

## 核心理念

- **判断力优先**：在AI可以生成代码的时代，人类的价值在于判断而非实现
- **六问诊断法**：理解问题→建立基线→检索知识→利用结构→选择范式→承认边界
- **从具体到抽象**：每个概念都从真实场景出发，逐步提炼一般规律

## 在线阅读

📚 [在线教材](https://xvshiting.github.io/algorithm_in_llm_era/)

## 目录结构

```
docs/
├── chapters/          # 教材章节
│   ├── ch01/         # 第1章：当你让AI帮你写代码时
│   ├── ch02/         # 第2章：数据结构：从接口到缓存
│   ├── ch03/         # 第3章：排序与查找：从确定性到概率性
│   └── ...
└── .vitepress/       # VitePress配置
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run docs:dev

# 构建生产版本
npm run docs:build
```

## 知识库

本项目配套独立的知识库 `dev-notes/`，采用四层结构：

- **raw/**：原始材料（论文、博客、教材扫描）
- **refined/**：消化后的结构化笔记
- **zettel/**：原子化知识卡片
- **methodology/**：写作方法论

## 技术栈

- [VitePress](https://vitepress.dev/) - 静态站点生成
- [KaTeX](https://katex.org/) - 数学公式渲染
- [Markmap](https://markmap.js.org/) - 思维导图

## License

MIT
