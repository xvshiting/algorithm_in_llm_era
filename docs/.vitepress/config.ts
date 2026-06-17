import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '算法分析与设计',
  description: '算法思维 → 人机协同 → Agent 设计',

  base: '/algorithm_in_llm_era/',
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '章节', link: '/chapters/ch01-introduction' },
      { text: '练习', link: '/exercises/ch01-exercises' },
    ],

    sidebar: {
      '/chapters/': [
        {
          text: '章节内容',
          items: [
            { text: '第1章 问题建模与算法思维', link: '/chapters/ch01-introduction' },
            { text: '第2章 数据结构——抽象接口与扩张', link: '/chapters/ch02-data-structures' },
            { text: '第3章 排序与查找——确定性到概率性', link: '/chapters/ch03-sorting-and-searching' },
            { text: '第4章 图算法——建模比算法更重要', link: '/chapters/ch04-graph-algorithms' },
            { text: '第5章 组合搜索——系统探索巨大空间', link: '/chapters/ch05-backtracking' },
            { text: '第6章 动态规划——缓存与优化', link: '/chapters/ch06-dynamic-programming' },
            { text: '第7章 贪心算法——局部选择的全局效果', link: '/chapters/ch07-greedy' },
            { text: '第8章 NP完全性与应对——验证比发现容易', link: '/chapters/ch08-np-completeness' },
            { text: '第9章 算法设计方法论——设计算法的算法', link: '/chapters/ch09-design-methodology' },
          ],
        },
      ],
      '/exercises/': [
        {
          text: '课后练习',
          items: [
            { text: '第1章 练习', link: '/exercises/ch01-exercises' },
            { text: '第2章 练习', link: '/exercises/ch02-exercises' },
            { text: '第3章 练习', link: '/exercises/ch03-exercises' },
            { text: '第4章 练习', link: '/exercises/ch04-exercises' },
            { text: '第5章 练习', link: '/exercises/ch05-exercises' },
            { text: '第6章 练习', link: '/exercises/ch06-exercises' },
            { text: '第7章 练习', link: '/exercises/ch07-exercises' },
            { text: '第8章 练习', link: '/exercises/ch08-exercises' },
            { text: '第9章 练习', link: '/exercises/ch09-exercises' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/xvshiting/algorithm_in_llm_era' },
    ],

    footer: {
      message: '算法分析与设计课程电子教材',
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