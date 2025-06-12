<script setup lang="ts">
import { formatDateDifference } from '@core/utils/formatters'
import { SystemNotification } from '@/api/types'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 是否有新消息
const hasNewMessage = ref(false)

// 通知列表
const notificationList = ref<SystemNotification[]>([])

// 事件源
let eventSource: EventSource | null = null

// 弹窗
const appsMenu = ref(false)

// SSE持续接收消息
function startSSEMessager() {
  // 延迟 3 秒启动 SSE，避免相关认证信息尚未写入 Cookie 导致 403
  setTimeout(() => {
    eventSource = new EventSource(`${import.meta.env.VITE_API_BASE_URL}system/message`)
    eventSource.addEventListener('message', event => {
      if (event.data) {
        const noti: SystemNotification = JSON.parse(event.data)
        notificationList.value.unshift(noti)
        hasNewMessage.value = true
      }
    })
  }, 3000)
}

// 页面加载时，加载当前用户数据
onBeforeMount(async () => {
  startSSEMessager()
})

// 页面卸载时，关闭事件源
onBeforeUnmount(() => {
  if (eventSource) eventSource.close()
})
</script>

<template>
  <VMenu
    v-model="appsMenu"
    width="400"
    transition="scale-transition"
    close-on-content-click
    class="notification-menu"
    scrim
  >
    <!-- Menu Activator -->
    <template #activator="{ props }">
      <VBadge v-if="hasNewMessage" dot color="error" :offset-x="5" :offset-y="5" v-bind="props">
        <IconBtn>
          <VIcon icon="mdi-bell-outline" />
        </IconBtn>
      </VBadge>
      <IconBtn v-else v-bind="props">
        <VIcon icon="mdi-bell-outline" />
      </IconBtn>
    </template>
    <!-- Menu Content -->
    <VCard>
      <VCardItem class="py-3">
        <VCardTitle>{{ t('notification.center') }}</VCardTitle>
        <template #append>
          <VTooltip :text="t('notification.markRead')">
            <template #activator="{ props }">
              <IconBtn
                v-bind="props"
                @click="
                  () => {
                    hasNewMessage = false
                    appsMenu = false
                  }
                "
              >
                <VIcon icon="mdi-email-check-outline" size="20" />
              </IconBtn>
            </template>
          </VTooltip>
        </template>
      </VCardItem>
      <VDivider />
      <div class="notification-list-container">
        <div v-if="notificationList.length > 0" class="h-full overflow-y-auto">
          <VListItem v-for="(item, i) in notificationList" :key="i" lines="two" class="mb-1">
            <template #prepend>
              <VAvatar rounded>
                <VIcon v-if="item.type === 'user'" icon="mdi-account-alert" size="large"></VIcon>
                <VIcon v-else-if="item.type === 'plugin'" icon="mdi-robot" size="large"></VIcon>
                <VIcon v-else icon="mdi-laptop" size="large"></VIcon>
              </VAvatar>
            </template>
            <div>
              <div class="text-body-1 text-high-emphasis break-words whitespace-break-spaces">
                {{ item.title }}
              </div>
              <div class="text-caption mt-1.5">
                {{ item.text }}
              </div>
              <div class="text-sm text-primary mt-1.5">
                {{ formatDateDifference(item.date) }}
              </div>
            </div>
          </VListItem>
        </div>
        <div v-else class="py-8 text-center">
          <VIcon icon="mdi-bell-sleep-outline" size="40" class="mb-3" />
          <div>{{ t('notification.empty') }}</div>
        </div>
      </div>
    </VCard>
  </VMenu>
</template>

<style scoped>
.notification-list-container {
  overflow: hidden;
  max-block-size: 50vh;
}
</style>
