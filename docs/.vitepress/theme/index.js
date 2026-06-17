import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import ProblemClarifier from './components/ProblemClarifier.vue'
import Quiz from './components/Quiz.vue'

export default {
  ...DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {})
  },
  enhanceApp({ app }) {
    app.component('ProblemClarifier', ProblemClarifier)
    app.component('Quiz', Quiz)
  }
}