<script lang="ts" setup>
import { isNullOrEmptyObject } from '@/@core/utils'
import api from '@/api'
import { type PropType } from 'vue'
import ProgressDialog from '../dialog/ProgressDialog.vue'
import { RenderProps } from '@/api/types'

// 定议外部事件
const emit = defineEmits(['action'])

// 输入参数
const props = defineProps({
  config: Object as PropType<RenderProps>,
})

// 进度框
const progressDialog = ref(false)

// 进度框文本
const progressText = ref('正在处理...')

// 元素API事件响应
async function commonAction(api_path: string, method: string, params = {}) {
  if (!api_path || !method) return
  progressDialog.value = true
  try {
    if (method.toUpperCase() === 'GET') {
      await api.get(api_path, {
        params: params,
      })
    } else {
      await api.post(api_path, params)
    }
    emit('action')
  } catch (error) {
    console.error(error)
  }
  progressDialog.value = false
}

// 组装事件
let componentEvents = reactive<{ [key: string]: any }>({})
watchEffect(() => {
  if (!isNullOrEmptyObject(props.config?.events)) {
    for (const key in props.config?.events) {
      const attr = props.config?.events[key]
      const func = async () => {
        await commonAction(attr['api'], attr['method'], attr['params'])
      }
      componentEvents[key] = func
    }
  }
})
</script>

<template>
  <Component :is="config?.component" v-if="!config?.html" v-bind="config?.props" v-on="componentEvents">
    {{ config?.text }}
    <PageRender
      v-for="(innerItem, innerIndex) in config?.content || []"
      :key="innerIndex"
      :config="innerItem"
      @action="emit('action')"
    />
  </Component>
  <Component
    :is="config?.component"
    v-if="config?.html"
    v-bind="config?.props"
    v-html="config?.html"
    v-on="componentEvents"
  />
  <!-- 进度框 -->
  <ProgressDialog v-if="progressDialog" v-model="progressDialog" :text="progressText" />
</template>
