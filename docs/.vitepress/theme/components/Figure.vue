<template>
  <figure class="course-figure">
    <img :src="resolvedSrc" :alt="alt || caption" loading="lazy" decoding="async" />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  alt: {
    type: String,
    default: ''
  }
})

const resolvedSrc = computed(() => {
  if (!props.src) return ''
  return props.src.startsWith('/') ? withBase(props.src) : props.src
})
</script>

<style scoped>
.course-figure {
  margin: 28px 0;
}

.course-figure img {
  display: block;
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.course-figure figcaption {
  margin-top: 8px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}
</style>
