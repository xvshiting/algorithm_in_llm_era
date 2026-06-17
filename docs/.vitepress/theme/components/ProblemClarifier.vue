<template>
  <div class="problem-clarifier">
    <div class="input-section">
      <h4>📝 你收到的任务描述</h4>
      <textarea v-model="taskDescription" placeholder="例如：帮我写一个搜索功能，用户输入关键词，返回匹配的商品" rows="3"></textarea>
    </div>

    <div class="clarification-section">
      <h4>🔍 需要澄清的问题</h4>
      
      <div class="question-group">
        <label>输入是什么？</label>
        <input v-model="inputFormat" placeholder="格式、范围、边界情况..." />
      </div>

      <div class="question-group">
        <label>输出是什么？</label>
        <input v-model="outputFormat" placeholder="格式、数量、空结果处理..." />
      </div>

      <div class="question-group">
        <label>数据规模</label>
        <div class="slider-group">
          <input type="range" v-model="dataScale" min="0" max="6" step="1" />
          <span class="scale-label">{{ scaleLabels[dataScale] }}</span>
        </div>
      </div>

      <div class="question-group">
        <label>时间限制</label>
        <div class="slider-group">
          <input type="range" v-model="timeLimit" min="0" max="5" step="1" />
          <span class="scale-label">{{ timeLabels[timeLimit] }}</span>
        </div>
      </div>

      <div class="question-group">
        <label>特殊情况需要处理？</label>
        <div class="checkbox-group">
          <label><input type="checkbox" v-model="edgeCases.empty" /> 空输入</label>
          <label><input type="checkbox" v-model="edgeCases.extreme" /> 极端值</label>
          <label><input type="checkbox" v-model="edgeCases.duplicate" /> 重复元素</label>
          <label><input type="checkbox" v-model="edgeCases.sorted" /> 已排序数据</label>
        </div>
      </div>
    </div>

    <div class="output-section">
      <h4>📋 清晰的问题描述</h4>
      <div class="generated-spec">
        <p><strong>任务：</strong>{{ taskDescription || '（请输入任务描述）' }}</p>
        <p><strong>输入：</strong>{{ inputFormat || '（请描述输入格式）' }}</p>
        <p><strong>输出：</strong>{{ outputFormat || '（请描述输出格式）' }}</p>
        <p><strong>规模：</strong>{{ scaleLabels[dataScale] }} 级别</p>
        <p><strong>时限：</strong>{{ timeLabels[timeLimit] }} 内返回</p>
        <p><strong>边界：</strong>{{ edgeCasesText }}</p>
        <p v-if="complexityHint" class="complexity-hint"><strong>💡 复杂度建议：</strong>{{ complexityHint }}</p>
      </div>
      
      <button class="copy-btn" @click="copySpec">复制描述</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const taskDescription = ref('')
const inputFormat = ref('')
const outputFormat = ref('')
const dataScale = ref(2)
const timeLimit = ref(2)

const edgeCases = ref({
  empty: false,
  extreme: false,
  duplicate: false,
  sorted: false
})

const scaleLabels = ['10', '100', '1,000', '10,000', '100,000', '100万', '1000万']
const timeLabels = ['10ms', '50ms', '100ms', '500ms', '1秒', '5秒']

const edgeCasesText = computed(() => {
  const cases = []
  if (edgeCases.value.empty) cases.push('空输入')
  if (edgeCases.value.extreme) cases.push('极端值')
  if (edgeCases.value.duplicate) cases.push('重复元素')
  if (edgeCases.value.sorted) cases.push('已排序')
  return cases.length ? cases.join('、') : '（未指定）'
})

const complexityHint = computed(() => {
  const n = Math.pow(10, dataScale.value)
  const t = timeLimit.value
  
  // 粗略估计：每秒 10^8 次操作
  const opsPerMs = 100000
  const maxOps = opsPerMs * [10, 50, 100, 500, 1000, 5000][t]
  
  if (n * n <= maxOps) return 'O(n²) 可能可接受'
  if (n * Math.log2(n) <= maxOps) return '需要 O(n log n) 或更好'
  if (n <= maxOps) return '需要 O(n) 或更好'
  return '需要 O(log n) 或常数时间，考虑预处理/索引'
})

function copySpec() {
  const spec = `任务：${taskDescription.value || '（未填写）'}
输入：${inputFormat.value || '（未填写）'}
输出：${outputFormat.value || '（未填写）'}
规模：${scaleLabels[dataScale.value]} 级别
时限：${timeLabels[timeLimit.value]} 内返回
边界：${edgeCasesText.value}`
  
  navigator.clipboard.writeText(spec).then(() => {
    alert('已复制到剪贴板！')
  })
}
</script>

<style scoped>
.problem-clarifier {
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #f6f8fa;
}

.input-section,
.clarification-section,
.output-section {
  margin-bottom: 20px;
}

h4 {
  margin: 0 0 12px 0;
  color: #24292f;
  font-size: 16px;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
}

.question-group {
  margin-bottom: 16px;
}

.question-group > label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #57606a;
  font-size: 14px;
}

.question-group input[type="text"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 14px;
}

.slider-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-group input[type="range"] {
  flex: 1;
  height: 6px;
}

.scale-label {
  min-width: 80px;
  font-size: 14px;
  color: #0969da;
  font-weight: 500;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #57606a;
  cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.generated-spec {
  background: white;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  padding: 16px;
  font-size: 14px;
}

.generated-spec p {
  margin: 8px 0;
}

.complexity-hint {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed #d0d7de;
  color: #1a7f37;
}

.copy-btn {
  margin-top: 12px;
  padding: 8px 16px;
  background: #0969da;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.copy-btn:hover {
  background: #0860ca;
}
</style>