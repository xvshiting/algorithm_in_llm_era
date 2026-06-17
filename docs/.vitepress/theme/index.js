import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import ProblemClarifier from './components/ProblemClarifier.vue'

export default {
  ...DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {})
  },
  enhanceApp({ app }) {
    app.component('ProblemClarifier', ProblemClarifier)
  }
}