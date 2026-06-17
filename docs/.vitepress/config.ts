import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '算法分析与设计',
  description: '算法分析与设计课程电子教材',

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
            { text: '第1章 算法基础', link: '/chapters/ch01-introduction' },
            { text: '第2章 分治策略', link: '/chapters/ch02-divide-and-conquer' },
            { text: '第3章 动态规划', link: '/chapters/ch03-dynamic-programming' },
            { text: '第4章 贪心算法', link: '/chapters/ch04-greedy' },
            { text: '第5章 回溯与分支限界', link: '/chapters/ch05-backtracking' },
            { text: '第6章 图算法', link: '/chapters/ch06-graph-algorithms' },
            { text: '第7章 NP完全性理论', link: '/chapters/ch07-np-completeness' },
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