<script lang="ts" setup>
import api from '@/api'
import type { User } from '@/api/types'
import NoDataFound from '@/components/NoDataFound.vue'
import UserCard from '@/components/cards/UserCard.vue'
import UserAddEditDialog from '@/components/dialog/UserAddEditDialog.vue'
import { useDisplay } from 'vuetify'
import { useDynamicButton } from '@/composables/useDynamicButton'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// APP
const display = useDisplay()
const appMode = inject('pwaMode') && display.mdAndDown.value

// 是否刷新过
const isRefreshed = ref(false)

// 是否加载中
const loading = ref(false)

// 新增用户窗口
const addUserDialog = ref(false)

// 所有用户信息
const allUsers = ref<User[]>([])

// 调用API，查询所有用户
async function loadAllUsers() {
  try {
    loading.value = true
    const result: User[] = await api.get('/user/')
    allUsers.value = result
    loading.value = false
    isRefreshed.value = true
  } catch (error) {
    console.log(error)
  }
}

// 用户新增完成
const onUserAdd = () => {
  addUserDialog.value = false
  loadAllUsers()
}

// 打开添加用户对话框
const openAddUserDialog = () => {
  addUserDialog.value = true
}

// 加载当前用户数据
onMounted(() => {
  loadAllUsers()
})

onActivated(() => {
  if (!loading.value) {
    loadAllUsers()
  }
})

// 使用动态按钮钩子
useDynamicButton({
  icon: 'mdi-account-plus',
  onClick: () => {
    openAddUserDialog()
  },
})
</script>

<template>
  <!-- 页面标题 -->
  <VPageContentTitle :title="t('user.management')" />
  <div class="card-list-container">
    <!-- 加载中提示 -->
    <LoadingBanner v-if="!isRefreshed" class="mt-12" />
    <!-- 用户卡片网格 -->
    <div v-if="allUsers.length > 0 && isRefreshed" class="grid gap-4 grid-user-card px-2">
      <!-- 普通用户卡片 -->
      <UserCard
        v-for="user in allUsers"
        :key="user.id"
        :user="user"
        :users="allUsers"
        @remove="loadAllUsers"
        @save="loadAllUsers"
      />
    </div>

    <!-- 无数据提示 -->
    <div v-if="allUsers.length === 0 && isRefreshed">
      <NoDataFound error-code="404" :error-title="t('user.noUsers')" :error-description="t('user.clickToAddUser')" />
    </div>

    <!-- 新增用户按钮 -->
    <VFab
      v-if="isRefreshed && !appMode"
      icon="mdi-account-plus"
      location="bottom"
      size="x-large"
      fixed
      app
      appear
      @click="openAddUserDialog"
      :class="{ 'mb-12': appMode }"
    />

    <!-- 用户添加弹窗 -->
    <UserAddEditDialog
      v-if="addUserDialog"
      v-model="addUserDialog"
      oper="add"
      max-width="45rem"
      @save="onUserAdd"
      @close="addUserDialog = false"
    />
  </div>
</template>
