<script setup lang="ts">
import { useTheme } from 'vuetify'
import api from '@/api'
import { hexToRgb } from '@layouts/utils'
import { useUserStore } from '@/stores'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

const vuetifyTheme = useTheme()

// 用户 Store
const userStore = useUserStore()
const superUser = userStore.superUser

const options = controlledComputed(
  () => vuetifyTheme.name.value,
  () => {
    const currentTheme = ref(vuetifyTheme.current.value.colors)
    const variableTheme = ref(vuetifyTheme.current.value.variables)

    const disabledColor = `rgba(${hexToRgb(currentTheme.value['on-surface'])},${
      variableTheme.value['disabled-opacity']
    })`

    const borderColor = `rgba(${hexToRgb(String(variableTheme.value['border-color']))},${
      variableTheme.value['border-opacity']
    })`

    return {
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 9,
          distributed: true,
          columnWidth: '40%',
          endingShape: 'rounded',
          startingShape: 'rounded',
        },
      },
      stroke: {
        width: 2,
        colors: [currentTheme.value.surface],
      },
      legend: { show: false },
      tooltip: {
        enabled: false,
      },
      grid: {
        borderColor,
        strokeDashArray: 7,
        padding: {
          top: -1,
          right: 0,
          left: -12,
          bottom: 5,
        },
      },
      dataLabels: { enabled: false },
      colors: [currentTheme.value.primary],
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } },
      },
      xaxis: {
        categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        tickPlacement: 'on',
        labels: { show: false },
        crosshairs: { opacity: 0 },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: {
        show: true,
        tickAmount: 4,
        labels: {
          offsetX: -17,
          style: {
            colors: disabledColor,
            fontSize: '12px',
          },

          formatter: (value: number) => {
            if (value > 999) {
              return (value / 1000).toFixed(1) + 'k'
            } else {
              return value.toString()
            }
          },
        },
      },
    }
  },
)

// 图表数据
const series = ref([{ data: [0, 0, 0, 0, 0, 0, 0] }])

// 总数
const totalCount = computed(() => series.value[0].data.reduce((a, b) => a + b, 0))

// 调用API接口获取数据近7天数据
async function getWeeklyData() {
  try {
    const res: number[] = await api.get('dashboard/transfer')

    series.value = [{ data: res }]
  } catch (e) {
    console.log(e)
  }
}

onMounted(() => {
  getWeeklyData()
})

onActivated(() => {
  getWeeklyData()
})
</script>

<template>
  <VHover>
    <template #default="hover">
      <VCard v-bind="hover.props">
        <VCardItem>
          <template #append>
            <VIcon class="cursor-move" v-if="hover.isHovering">mdi-drag</VIcon>
          </template>
          <VCardTitle>{{ t('dashboard.weeklyOverview') }}</VCardTitle>
        </VCardItem>

        <VCardText>
          <VApexChart type="bar" :options="options" :series="series" :height="160" />
          <div class="d-flex align-center mb-3">
            <h5 class="text-h5 me-4">
              {{ totalCount }}
            </h5>
            <p>{{ t('dashboard.weeklyOverviewDescription', { count: totalCount }) }} 😎</p>
          </div>

          <VBtn v-if="superUser" block to="/history"> {{ t('common.viewDetails') }} </VBtn>
        </VCardText>
      </VCard>
    </template>
  </VHover>
</template>
