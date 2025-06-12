<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { isToday } from '@/@core/utils/index'
import dayjs from 'dayjs';

// 定义输入变量
const props = defineProps<{
  logfile: string
}>()

// 国际化
const { t } = useI18n()

// 已解析的日志列表
const parsedLogs = ref<{ level: string; date: string; time: string; program: string; content: string }[]>([])

// 表头
const headers = [
  { title: t('logging.level'), value: 'level' },
  { title: t('logging.time'), value: 'time' },
  { title: t('logging.program'), value: 'program' },
  { title: t('logging.content'), value: 'content' },
]

// SSE消息对象
let eventSource: EventSource | null = null

// 日志颜色映射表
const logColorMap: Record<string, string> = {
  DEBUG: 'secondary',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
}

// 获取日志颜色
function getLogColor(level: string): string {
  return logColorMap[level] || 'secondary'
}

// SSE持续获取日志
function startSSELogging() {
  console.log(props.logfile)
  eventSource = new EventSource(
    `${import.meta.env.VITE_API_BASE_URL}system/logging?logfile=${
      encodeURIComponent(props.logfile) ?? 'moviestation.log'
    }`,
  )
  const buffer: string[] = []
  let timeoutId: number | null = null

  eventSource.addEventListener('message', event => {
    const message = event.data
    if (message) {
      buffer.push(message)
      if (!timeoutId) {
        timeoutId = window.setTimeout(() => {
          // 解析新日志
          const newParsedLogs = buffer
            .map(log => {
              const logPattern = /^【(.*?)】\s*([\d]{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)\s+(.*?)\s*-\s*(.*?)\s*-\s*(.*)$/
              const matches = log.match(logPattern)
              if (matches) {
                const [, level, date, time, program, content] = matches
                return { level, date, time, program, content }
              }
              return null
            })
            .filter(Boolean)
          // 倒序后插入parsedLogs顶部
          parsedLogs.value.unshift(...(newParsedLogs.reverse() as any[]))
          // 保留最新的200条日志
          parsedLogs.value = parsedLogs.value.slice(0, 200)
          // 重置buffer
          buffer.length = 0
          timeoutId = null
        }, 100)
      }
    }
  })
}

onMounted(() => {
  startSSELogging()
})

onBeforeUnmount(() => {
  if (eventSource) eventSource.close()
})
</script>

<template>
  <LoadingBanner v-if="parsedLogs.length === 0" class="mt-12" :text="t('logging.refreshing') + ' ...'" />
  <div v-else>
    <VTable class="table-rounded" hide-default-footer disable-sort>
      <tbody>
        <VDataTableVirtual
          :headers="headers"
          :items="parsedLogs"
          height="100%"
          density="compact"
          hover
          hide-default-header
        >
          <template #item.level="{ item }">
            <VChip size="small" :color="getLogColor(item.level)" variant="elevated" v-text="item.level" />
          </template>
          <template #item.time="{ item }">
            <span class="text-sm">{{ isToday(dayjs(item.date).toDate()) ? item.time : `${item.date}
              ${item.time}` }}</span>
          </template>
          <template #item.program="{ item }">
            <h6 class="text-sm font-weight-medium">{{ item.program }}</h6>
          </template>
          <template #item.content="{ item }">
            <span class="text-sm" :class="`text-${getLogColor(item.level)}`">
              {{ item.content }}
            </span>
          </template>
        </VDataTableVirtual>
      </tbody>
    </VTable>
  </div>
</template>
