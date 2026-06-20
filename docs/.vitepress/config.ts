import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '算法分析与设计',
  description: '新时代的算法课程',

  base: '/algorithm_in_llm_era/',
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '章节', link: '/chapters/ch01/' },
    ],

    sidebar: {
      '/chapters/': [
        {
          text: '第1章 当你让 AI 帮你写代码时',
          link: '/chapters/ch01/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch01/' },
            { text: '1.1 你面对的是一个什么问题', link: '/chapters/ch01/01-problem' },
            { text: '1.2 六问诊断法', link: '/chapters/ch01/02-six-questions' },
            { text: '1.3 如何验证正确性', link: '/chapters/ch01/03-verification' },
            { text: '1.4 复杂度判断', link: '/chapters/ch01/04-complexity' },
            { text: '1.5 建模', link: '/chapters/ch01/05-modeling' },
            { text: '1.6 综合练习', link: '/chapters/ch01/06-exercises' },
          ],
        },
        {
          text: '第2章 数据结构：从接口到缓存',
          link: '/chapters/ch02/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch02/' },
            { text: '2.1 抽象数据类型与操作契约', link: '/chapters/ch02/01-adt-operation-contract' },
            { text: '2.2 数组与动态数组', link: '/chapters/ch02/02-array-dynamic-array' },
            { text: '2.3 链表', link: '/chapters/ch02/03-linked-list' },
            { text: '2.4 栈与队列', link: '/chapters/ch02/04-stack-queue' },
            { text: '2.5 集合与字典：哈希表', link: '/chapters/ch02/05-hash-table' },
            { text: '2.6 树与有序结构', link: '/chapters/ch02/06-tree-ordered-structure' },
            { text: '2.7 优先队列与堆', link: '/chapters/ch02/07-priority-queue-heap' },
            { text: '2.8 并查集', link: '/chapters/ch02/08-union-find' },
            { text: '2.9 摊还分析', link: '/chapters/ch02/09-amortized-analysis' },
            { text: '2.10 从接口到缓存', link: '/chapters/ch02/10-interface-cache' },
            { text: '2.11 综合练习', link: '/chapters/ch02/11-exercises' },
          ],
        },
        {
          text: '第3章 排序与查找：从确定性到概率性',
          link: '/chapters/ch03/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch03/' },
            { text: '3.1 排序的理论极限', link: '/chapters/ch03/01-theory-limit' },
            { text: '3.2 插入排序', link: '/chapters/ch03/02-insertion-sort' },
            { text: '3.3 分治排序', link: '/chapters/ch03/03-divide-conquer' },
            { text: '3.4 堆排序', link: '/chapters/ch03/04-heap-sort' },
            { text: '3.5 线性时间排序', link: '/chapters/ch03/05-linear-sort' },
            { text: '3.6 顺序统计量', link: '/chapters/ch03/06-order-statistics' },
            { text: '3.7 哈希与随机化设计', link: '/chapters/ch03/07-hash-randomization' },
            { text: '3.8 字符串匹配', link: '/chapters/ch03/08-string-matching' },
            { text: '3.9 二分查找与搜索树', link: '/chapters/ch03/09-binary-search' },
            { text: '3.10 综合练习', link: '/chapters/ch03/10-exercises' },
            { text: '3.11 LLM时代的排序思维', link: '/chapters/ch03/11-llm-connection' },
          ],
        },
        {
          text: '第4章 图算法：建模的艺术',
          link: '/chapters/ch04/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch04/' },
            { text: '4.1 图的表示', link: '/chapters/ch04/01-graph-representation' },
            { text: '4.2 BFS与DFS', link: '/chapters/ch04/02-bfs-dfs' },
            { text: '4.3 拓扑排序与强连通分量', link: '/chapters/ch04/03-topology-scc' },
            { text: '4.4 最小生成树', link: '/chapters/ch04/04-mst' },
            { text: '4.5 最短路径', link: '/chapters/ch04/05-shortest-path' },
            { text: '4.6 最大流', link: '/chapters/ch04/06-max-flow' },
            { text: '4.7 图算法设计范式', link: '/chapters/ch04/07-design-graph' },
            { text: '4.8 GNN基础', link: '/chapters/ch04/08-gnn-basics' },
            { text: '4.9 LLM与图推理', link: '/chapters/ch04/09-llm-graph' },
            { text: '4.10 综合练习', link: '/chapters/ch04/10-exercises' },
          ],
        },
        {
          text: '第5章 组合搜索：推理空间即搜索空间',
          link: '/chapters/ch05/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch05/' },
            { text: '5.1 回溯法', link: '/chapters/ch05/01-backtracking' },
            { text: '5.2 剪枝策略', link: '/chapters/ch05/02-pruning' },
            { text: '5.3 A*算法', link: '/chapters/ch05/03-a-star' },
            { text: '5.4 启发式搜索', link: '/chapters/ch05/04-heuristic-search' },
            { text: '5.5 LLM搜索策略', link: '/chapters/ch05/05-llm-search' },
            { text: '5.6 综合练习', link: '/chapters/ch05/exercises' },
          ],
        },
        {
          text: '第6章 动态规划：缓存的艺术',
          link: '/chapters/ch06/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch06/' },
            { text: '6.1 递推关系', link: '/chapters/ch06/01-recurrence' },
            { text: '6.2 最优子结构', link: '/chapters/ch06/02-optimal' },
            { text: '6.3 状态设计', link: '/chapters/ch06/03-state-design' },
            { text: '6.4 经典模型', link: '/chapters/ch06/04-classic-models' },
            { text: '6.5 LLM与动态规划', link: '/chapters/ch06/05-llm-dp' },
            { text: '6.6 综合练习', link: '/chapters/ch06/exercises' },
          ],
        },
        {
          text: '第7章 贪心算法：局部选择的全局效果',
          link: '/chapters/ch07/',
          collapsed: true,
          items: [
            { text: '导入', link: '/chapters/ch07/' },
            { text: '7.1 贪心策略的直觉与陷阱', link: '/chapters/ch07/01-intuition' },
            { text: '7.2 贪心正确性的证明', link: '/chapters/ch07/02-correctness' },
            { text: '7.3 拟阵理论', link: '/chapters/ch07/03-matroid' },
            { text: '7.4 Huffman编码', link: '/chapters/ch07/04-huffman' },
            { text: '7.5 分数背包 vs 0-1背包', link: '/chapters/ch07/05-knapsack' },
            { text: '7.6 贪心何时失败', link: '/chapters/ch07/06-when-fails' },
            { text: '7.7 综合练习', link: '/chapters/ch07/07-exercises' },
          ],
        },
        { text: '第8章 NP完全性与近似', link: '/chapters/ch08-np-completeness' },
        { text: '第9章 从单机到分布式', link: '/chapters/ch09-distributed-algorithms' },
        { text: '第10章 从存储到流式', link: '/chapters/ch10-streaming-algorithms' },
        { text: '第11章 Transformer：注意力作为算法', link: '/chapters/ch11-transformer-as-algorithm' },
        { text: '第12章 算法设计方法论', link: '/chapters/ch12-design-methodology' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xvshiting/algorithm_in_llm_era' },
    ],

    footer: {
      message: '新时代的算法课程',
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
              },
            },
          },
        },
      },
    },
  },
})
