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
      '/chapters/ch01/': [
        {
          text: '第1章 当你让 AI 帮你写代码时',
          items: [
            { text: '导入', link: '/chapters/ch01/' },
            { text: '1.1 你面对的是一个什么问题', link: '/chapters/ch01/01-problem' },
            { text: '1.2 六问诊断法', link: '/chapters/ch01/02-six-questions' },
            { text: '1.3 如何验证正确性', link: '/chapters/ch01/03-verification' },
            { text: '1.4 复杂度判断', link: '/chapters/ch01/04-complexity' },
            { text: '1.5 建模', link: '/chapters/ch01/05-modeling' },
            { text: '1.6 练习', link: '/chapters/ch01/06-exercises' },
          ],
        },
      ],
      '/chapters/': [
        {
          text: '章节内容',
          items: [
            { text: '第1章 当你让 AI 帮你写代码时', link: '/chapters/ch01/' },
            { text: '第2章 数据结构', link: '/chapters/ch02-data-structures' },
            { text: '第3章 排序与查找', link: '/chapters/ch03-sorting-and-searching' },
            { text: '第4章 图算法', link: '/chapters/ch04-graph-algorithms' },
            { text: '第5章 组合搜索', link: '/chapters/ch05-backtracking' },
            { text: '第6章 动态规划', link: '/chapters/ch06-dynamic-programming' },
            { text: '第7章 贪心算法', link: '/chapters/ch07-greedy' },
            { text: '第8章 NP完全性与应对', link: '/chapters/ch08-np-completeness' },
            { text: '第9章 算法设计方法论', link: '/chapters/ch09-design-methodology' },
          ],
        },
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