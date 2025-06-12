<script lang="ts" setup>
import { useToast } from 'vue-toast-notification'
import api from '@/api'
import type { ScheduleInfo } from '@/api/types'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 提示框
const $toast = useToast()

// 定时服务列表
const schedulerList = ref<ScheduleInfo[]>([])

// 定时器
let refreshTimer: NodeJS.Timeout | null = null

// 调用API加载定时服务列表
async function loadSchedulerList() {
  try {
    const res: ScheduleInfo[] = await api.get('dashboard/schedule')

    schedulerList.value = res
  } catch (e) {
    console.log(e)
  }
}

// 任务状态颜色
function getSchedulerColor(status: string) {
  switch (status) {
    case t('setting.scheduler.running'):
      return 'success'
    case t('setting.scheduler.stopped'):
      return 'error'
    case t('setting.scheduler.waiting'):
      return ''
    default:
      return ''
  }
}

// 执行命令
function runCommand(id: string) {
  try {
    // 异步提交
    api.get('system/runscheduler', {
      params: {
        jobid: id,
      },
    })
    $toast.success(t('setting.scheduler.executeSuccess'))
    // 1秒后刷新数据
    setTimeout(() => {
      loadSchedulerList()
    }, 1000)
  } catch (e) {
    console.log(e)
  }
}

onMounted(() => {
  loadSchedulerList()

  // 启动定时器
  refreshTimer = setInterval(() => {
    loadSchedulerList()
  }, 5000)
})

// 组件卸载时停止定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>{{ t('setting.scheduler.title') }}</VCardTitle>
      <VCardSubtitle>{{ t('setting.scheduler.subtitle') }}</VCardSubtitle>
    </VCardItem>
    <VTable class="text-no-wrap">
      <thead>
        <tr>
          <th scope="col">{{ t('setting.scheduler.provider') }}</th>
          <th scope="col">{{ t('setting.scheduler.taskName') }}</th>
          <th scope="col">{{ t('setting.scheduler.taskStatus') }}</th>
          <th scope="col">{{ t('setting.scheduler.nextRunTime') }}</th>
          <th scope="col" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="scheduler in schedulerList" :key="scheduler.id">
          <td>
            {{ scheduler.provider }}
          </td>
          <td>
            {{ scheduler.name }}
          </td>
          <td>
            <VChip :color="getSchedulerColor(scheduler.status)">
              {{ scheduler.status }}
            </VChip>
          </td>
          <td>
            {{ scheduler.next_run }}
          </td>
          <td>
            <VBtn
              size="small"
              :disabled="scheduler.status === t('setting.scheduler.running')"
              @click="runCommand(scheduler.id)"
            >
              <template #prepend>
                <VIcon>mdi-play</VIcon>
              </template>
              {{ t('setting.scheduler.execute') }}
            </VBtn>
          </td>
        </tr>
        <tr v-if="schedulerList.length === 0">
          <td colspan="4" class="text-center">{{ t('setting.scheduler.noService') }}</td>
        </tr>
      </tbody>
    </VTable>
  </VCard>
</template>
