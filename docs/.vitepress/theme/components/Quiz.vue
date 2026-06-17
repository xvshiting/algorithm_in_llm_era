<template>
  <div class="quiz-container">
    <h4 class="quiz-title">📝 课后测验</h4>
    
    <div v-for="(question, qIndex) in questions" :key="qIndex" class="question-block">
      <div class="question-header">
        <span class="question-number">第 {{ qIndex + 1 }} 题</span>
        <span v-if="question.type === 'multiple'" class="question-type">（多选）</span>
      </div>
      <p class="question-text">{{ question.question }}</p>
      
      <div class="options">
        <div 
          v-for="(option, oIndex) in question.options" 
          :key="oIndex"
          class="option"
          :class="{
            'selected': isSelected(qIndex, oIndex),
            'correct': showResults[qIndex] && isCorrectOption(question, oIndex),
            'wrong': showResults[qIndex] && isSelected(qIndex, oIndex) && !isCorrectOption(question, oIndex)
          }"
          @click="toggleOption(qIndex, oIndex, question.type)"
        >
          <span class="option-letter">{{ optionLabels[oIndex] }}</span>
          <span class="option-text">{{ option }}</span>
        </div>
      </div>
      
      <div v-if="showResults[qIndex]" class="explanation" :class="{ 'correct-answer': isCorrectAnswer(qIndex), 'wrong-answer': !isCorrectAnswer(qIndex) }">
        <strong>{{ isCorrectAnswer(qIndex) ? '✓ 正确！' : '✗ 错误' }}</strong>
        <p>{{ question.explanation }}</p>
      </div>
    </div>
    
    <div class="quiz-actions">
      <button v-if="!allSubmitted" class="submit-btn" @click="submitQuiz" :disabled="!allAnswered">
        提交答案
      </button>
      <button v-else class="retry-btn" @click="resetQuiz">
        重新作答
      </button>
    </div>
    
    <div v-if="allSubmitted" class="score-display">
      <div class="score-text">
        得分：<strong>{{ score }}</strong> / {{ questions.length }}
      </div>
      <div class="score-bar">
        <div class="score-fill" :style="{ width: scorePercentage + '%' }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  questions: {
    type: Array,
    default: () => []
  },
  src: {
    type: String,
    default: ''
  }
})

const loadedQuestions = ref([])
const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']

const selected = ref({})
const showResults = ref({})

const questions = computed(() => {
  return props.questions.length > 0 ? props.questions : loadedQuestions.value
})

onMounted(async () => {
  if (props.src && props.questions.length === 0) {
    try {
      const base = import.meta.env.BASE_URL || '/'
      const url = props.src.startsWith('/') ? base + props.src.slice(1) : props.src
      const res = await fetch(url)
      loadedQuestions.value = await res.json()
    } catch (e) {
      console.error('Failed to load quiz:', e)
    }
  }
})

const allAnswered = computed(() => {
  return questions.value.every((q, i) => {
    const selectedOpts = selected.value[i]
    return selectedOpts && selectedOpts.length > 0
  })
})

const allSubmitted = computed(() => {
  return Object.keys(showResults.value).length === questions.value.length
})

const score = computed(() => {
  return questions.value.filter((q, i) => isCorrectAnswer(i)).length
})

const scorePercentage = computed(() => {
  return questions.value.length > 0 ? (score.value / questions.value.length) * 100 : 0
})

function isSelected(qIndex, oIndex) {
  return selected.value[qIndex]?.includes(oIndex) || false
}

function isCorrectOption(question, oIndex) {
  if (Array.isArray(question.answer)) {
    return question.answer.includes(oIndex)
  }
  return question.answer === oIndex
}

function isCorrectAnswer(qIndex) {
  const question = questions.value[qIndex]
  const selectedOpts = selected.value[qIndex] || []
  
  if (question.type === 'multiple') {
    const correctOpts = question.answer
    return selectedOpts.length === correctOpts.length && 
           selectedOpts.every(o => correctOpts.includes(o))
  }
  return selectedOpts[0] === question.answer
}

function toggleOption(qIndex, oIndex, type) {
  if (showResults.value[qIndex]) return
  
  if (!selected.value[qIndex]) {
    selected.value[qIndex] = []
  }
  
  if (type === 'multiple') {
    const index = selected.value[qIndex].indexOf(oIndex)
    if (index > -1) {
      selected.value[qIndex].splice(index, 1)
    } else {
      selected.value[qIndex].push(oIndex)
    }
  } else {
    selected.value[qIndex] = [oIndex]
  }
}

function submitQuiz() {
  questions.value.forEach((_, i) => {
    showResults.value[i] = true
  })
}

function resetQuiz() {
  selected.value = {}
  showResults.value = {}
}
</script>

<style scoped>
.quiz-container {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 24px;
  margin: 24px 0;
  background: #f6f8fa;
}

.quiz-title {
  margin: 0 0 20px 0;
  color: #24292f;
  font-size: 18px;
  border-bottom: 2px solid #0969da;
  padding-bottom: 8px;
}

.question-block {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #d0d7de;
}

.question-block:last-of-type {
  border-bottom: none;
  margin-bottom: 16px;
}

.question-header {
  margin-bottom: 8px;
}

.question-number {
  font-weight: 600;
  color: #0969da;
  font-size: 14px;
}

.question-type {
  color: #57606a;
  font-size: 13px;
}

.question-text {
  margin: 0 0 16px 0;
  font-size: 15px;
  line-height: 1.6;
  color: #24292f;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #0969da;
  background: #f0f6fc;
}

.option.selected {
  border-color: #0969da;
  background: #f0f6fc;
}

.option.correct {
  border-color: #1a7f37;
  background: #dafbe1;
}

.option.wrong {
  border-color: #cf222e;
  background: #ffebe9;
}

.option-letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #d0d7de;
  color: #57606a;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.option.selected .option-letter {
  background: #0969da;
  color: white;
}

.option.correct .option-letter {
  background: #1a7f37;
  color: white;
}

.option.wrong .option-letter {
  background: #cf222e;
  color: white;
}

.option-text {
  font-size: 14px;
  line-height: 1.5;
  color: #24292f;
}

.explanation {
  margin-top: 12px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}

.explanation.correct-answer {
  background: #dafbe1;
  border-left: 4px solid #1a7f37;
}

.explanation.wrong-answer {
  background: #ffebe9;
  border-left: 4px solid #cf222e;
}

.explanation strong {
  display: block;
  margin-bottom: 4px;
}

.explanation p {
  margin: 0;
  color: #24292f;
}

.quiz-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.submit-btn,
.retry-btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn {
  background: #0969da;
  color: white;
  border: none;
}

.submit-btn:hover:not(:disabled) {
  background: #0860ca;
}

.submit-btn:disabled {
  background: #8c959f;
  cursor: not-allowed;
}

.retry-btn {
  background: white;
  color: #24292f;
  border: 1px solid #d0d7de;
}

.retry-btn:hover {
  background: #f6f8fa;
}

.score-display {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #d0d7de;
  text-align: center;
}

.score-text {
  font-size: 16px;
  margin-bottom: 12px;
}

.score-text strong {
  font-size: 24px;
  color: #0969da;
}

.score-bar {
  height: 8px;
  background: #d0d7de;
  border-radius: 4px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a7f37, #2da44e);
  transition: width 0.5s ease;
}
</style>
