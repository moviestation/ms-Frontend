<script lang="ts" setup>
import draggable from 'vuedraggable'
import api from '@/api'
import type { Site, SiteUserData } from '@/api/types'
import SiteCard from '@/components/cards/SiteCard.vue'
import NoDataFound from '@/components/NoDataFound.vue'
import SiteAddEditDialog from '@/components/dialog/SiteAddEditDialog.vue'
import { useDisplay } from 'vuetify'
import { useDynamicButton } from '@/composables/useDynamicButton'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// APP
const display = useDisplay()
const appMode = inject('pwaMode') && display.mdAndDown.value

// 站点列表
const siteList = ref<Site[]>([])

// 站点数据列表
const userDataList = ref<SiteUserData[]>([])

// 是否刷新过
const isRefreshed = ref(false)

// 是否加载中
const loading = ref(false)

// 新增站点对话框
const siteAddDialog = ref(false)

// 获取站点列表数据
async function fetchData() {
  try {
    loading.value = true
    siteList.value = await api.get('site/')
    loading.value = false
    isRefreshed.value = true
  } catch (error) {
    console.error(error)
  }
}

// 获取站点最新数据
async function fetchUserData() {
  try {
    userDataList.value = await api.get('site/userdata/latest')
  } catch (error) {
    console.error(error)
  }
}

// 保存站点排序
async function savaSitesPriority() {
  // 重新排序
  const priorities = siteList.value.map((site, index) => ({ id: site.id, pri: index + 1 }))
  try {
    const result: { [key: string]: any } = await api.post('site/priorities', priorities)
    if (result.success) {
      fetchData()
    }
  } catch (error) {
    console.error(error)
  }
}

// 根据站点ID获取站点数据
function getUserData(domain: string) {
  return userDataList.value.find(userData => userData.domain === domain)
}

// 更新站点事件时
function onSiteSave() {
  siteAddDialog.value = false
  fetchData()
}

// 加载时获取数据
onBeforeMount(() => {
  fetchData()
  fetchUserData()
})

onActivated(() => {
  if (!loading.value) {
    fetchData()
    fetchUserData()
  }
})

// 使用动态按钮钩子
useDynamicButton({
  icon: 'mdi-web-plus',
  onClick: () => {
    siteAddDialog.value = true
  },
})
</script>

<template>
  <div class="card-list-container">
    <!-- 页面标题 -->
    <VPageContentTitle :title="t('navItems.siteManager')" />
    <LoadingBanner v-if="!isRefreshed" class="mt-12" />
    <draggable
      v-if="siteList.length > 0"
      v-model="siteList"
      @end="savaSitesPriority"
      handle=".cursor-move"
      item-key="id"
      tag="div"
      :component-data="{ 'class': 'grid gap-4 grid-site-card px-2' }"
    >
      <template #item="{ element }">
        <SiteCard :site="element" :data="getUserData(element.domain)" @remove="fetchData" @update="fetchData" />
      </template>
    </draggable>
  </div>
  <NoDataFound
    v-if="siteList.length === 0 && isRefreshed"
    error-code="404"
    :error-title="t('site.noSites')"
    :error-description="t('site.sitesWillBeShownHere')"
  />
  <!-- 新增站点按钮 -->
  <VFab
    v-if="isRefreshed && !appMode"
    icon="mdi-web-plus"
    location="bottom"
    size="x-large"
    fixed
    app
    appear
    @click="siteAddDialog = true"
    :class="{ 'mb-12': appMode }"
  />
  <!-- 新增站点弹窗 -->
  <SiteAddEditDialog
    v-if="siteAddDialog"
    v-model="siteAddDialog"
    oper="add"
    @save="onSiteSave"
    @close="siteAddDialog = false"
  />
</template>
