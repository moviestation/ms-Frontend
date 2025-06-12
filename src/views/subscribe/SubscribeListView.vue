<script lang="ts" setup>
import draggable from 'vuedraggable'
import api from '@/api'
import type { Subscribe } from '@/api/types'
import NoDataFound from '@/components/NoDataFound.vue'
import SubscribeCard from '@/components/cards/SubscribeCard.vue'
import SubscribeHistoryDialog from '@/components/dialog/SubscribeHistoryDialog.vue'
import { useUserStore } from '@/stores'
import { useDisplay } from 'vuetify'
import { useDynamicButton } from '@/composables/useDynamicButton'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// APP
const display = useDisplay()
const appMode = inject('pwaMode') && display.mdAndDown.value

// 用户 Store
const userStore = useUserStore()

// 从 Store 中获取用户信息
const superUser = userStore.superUser
const userName = userStore.userName

// 输入参数
const props = defineProps({
  type: String,
  subid: String,
  keyword: String,
})

// 是否刷新过
let isRefreshed = ref(false)

// 刷新状态
const loading = ref(false)

// 数据列表
const dataList = ref<Subscribe[]>([])

// 历史记录弹窗
const historyDialog = ref(false)

// 订阅顺序配置
const orderConfig = ref<{ id: number }[]>([])

// 显示的订阅列表
const displayList = ref<Subscribe[]>([])

// 顺序存储键值（计算属性）
const localOrderKey = computed(() => (props.type === '电影' ? 'MP_SUBSCRIBE_MOVIE_ORDER' : 'MP_SUBSCRIBE_TV_ORDER'))
const orderRequestKey = computed(() => (props.type === '电影' ? 'SubscribeMovieOrder' : 'SubscribeTvOrder'))

// 监听dataList变化，同步更新displayList
watch([dataList, () => props.keyword], () => {
  if (superUser)
    displayList.value = dataList.value.filter(
      data =>
        data.type === props.type && (!props.keyword || data.name.toLowerCase().includes(props.keyword.toLowerCase())),
    )
  else
    displayList.value = dataList.value.filter(
      data =>
        data.type === props.type &&
        data.username === userName &&
        (!props.keyword || data.name.toLowerCase().includes(props.keyword.toLowerCase())),
    )
  // 排序
  sortSubscribeOrder()
})

// 加载顺序
async function loadSubscribeOrderConfig() {
  // 顺序配置
  const local_order = localStorage.getItem(localOrderKey.value)
  if (local_order) {
    orderConfig.value = JSON.parse(local_order)
  } else {
    const response = await api.get(`/user/config/${orderRequestKey}`)
    if (response && response.data && response.data.value) {
      orderConfig.value = response.data.value
      localStorage.setItem(localOrderKey.value, JSON.stringify(orderConfig.value))
    }
  }
}

// 按order的顺序排序
async function sortSubscribeOrder() {
  if (!orderConfig.value) {
    return
  }
  if (displayList.value.length === 0) {
    return
  }
  await loadSubscribeOrderConfig()
  displayList.value.sort((a, b) => {
    const aIndex = orderConfig.value.findIndex((item: { id: number }) => item.id === a.id)
    const bIndex = orderConfig.value.findIndex((item: { id: number }) => item.id === b.id)
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex)
  })
}

// 保存顺序设置
async function saveSubscribeOrder() {
  // 顺序配置
  const orderObj = displayList.value.map(item => ({ id: item.id }))
  orderConfig.value = orderObj
  const orderString = JSON.stringify(orderObj)
  localStorage.setItem(localOrderKey.value, orderString)

  // 保存到服务端
  try {
    await api.post(`/user/config/${orderRequestKey}`, orderObj)
  } catch (error) {
    console.error(error)
  }
}

// 获取订阅列表数据
async function fetchData() {
  try {
    loading.value = true
    dataList.value = await api.get('subscribe/')
    loading.value = false
    isRefreshed.value = true
  } catch (error) {
    console.error(error)
  }
}

// 历史记录窗口完成
function historyDone() {
  historyDialog.value = false
  fetchData()
}

onMounted(async () => {
  await fetchData()
  if (props.subid) {
    // 找到这个订阅
    const sub = dataList.value.find(sub => sub.id.toString() == props.subid?.toString())
    if (sub) {
      // 打开编辑弹窗
      sub.page_open = true
    }
  }
})

onActivated(async () => {
  if (!loading.value) {
    fetchData()
  }
})

// 使用动态按钮钩子
useDynamicButton({
  icon: 'mdi-history',
  onClick: () => {
    historyDialog.value = true
  },
})
</script>

<template>
  <VPageContentTitle v-if="keyword" :title="`${t('subscribe.filterSubscriptions')}：${keyword}`" />
  <LoadingBanner v-if="!isRefreshed" class="mt-12" />
  <draggable
    v-if="displayList.length > 0"
    v-model="displayList"
    @end="saveSubscribeOrder"
    handle=".cursor-move"
    item-key="id"
    tag="div"
    :component-data="{ class: 'grid gap-4 grid-subscribe-card px-2' }"
  >
    <template #item="{ element }">
      <SubscribeCard :key="element.id" :media="element" @remove="fetchData" @save="fetchData" />
    </template>
  </draggable>
  <NoDataFound
    v-if="displayList.length === 0 && isRefreshed"
    error-code="404"
    :error-title="t('common.noData')"
    :error-description="keyword ? t('subscribe.noFilterData') : t('subscribe.noSubscribeData')"
  />
  <!-- 底部操作按钮 -->
  <div v-if="isRefreshed">
    <VFab
      v-if="userStore.superUser && !appMode"
      icon="mdi-history"
      color="info"
      location="bottom"
      :class="{ 'mb-12': appMode }"
      size="x-large"
      fixed
      app
      appear
      @click="historyDialog = true"
    />
  </div>
  <!-- 历史记录弹窗 -->
  <SubscribeHistoryDialog
    v-if="historyDialog"
    v-model="historyDialog"
    :type="props.type"
    @close="historyDialog = false"
    @save="historyDone"
  />
</template>
