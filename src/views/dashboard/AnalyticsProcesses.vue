<script lang="ts" setup>
import { formatSeconds } from '@/@core/utils/formatters'
import api from '@/api'
import type { Process } from '@/api/types'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 表头
const headers = [
  t('dashboard.processes.pid'),
  t('dashboard.processes.name'),
  t('dashboard.processes.runtime'),
  t('dashboard.processes.memory'),
]

// 数据列表
const processList = ref<Process[]>([])

// 定时器
let refreshTimer: NodeJS.Timeout | null = null

// 调用API加载数据
async function loadProcessList() {
  try {
    const res: Process[] = await api.get('dashboard/processes')

    processList.value = res
  } catch (e) {
    console.log(e)
  }
}

onMounted(() => {
  loadProcessList()

  // 启动定时器
  refreshTimer = setInterval(() => {
    loadProcessList()
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
      <template #append>
        <VIcon class="cursor-move">mdi-drag</VIcon>
      </template>
      <VCardTitle>{{ t('dashboard.processes.title') }}</VCardTitle>
    </VCardItem>
    <VTable item-key="fullName" class="table-rounded" hide-default-footer disable-sort>
      <thead>
        <tr>
          <th v-for="header in headers" :id="header" :key="header">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in processList" :key="row.pid">
          <td class="text-sm" v-text="row.pid" />
          <!-- name -->
          <td>
            <h6 class="text-sm font-weight-medium">
              {{ row.name }}
            </h6>
          </td>
          <td class="text-sm" v-text="formatSeconds(row.run_time)" />
          <td class="text-sm" v-text="`${row.memory} MB`" />
        </tr>
      </tbody>
    </VTable>
  </VCard>
</template>
