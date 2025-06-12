<script setup lang="ts">
import { debounce } from 'lodash-es'
import { VForm } from 'vuetify/components/VForm'
import { useAuthStore, useUserStore } from '@/stores'
import { authState, userState } from '@/stores/types'
import { requiredValidator } from '@/@validators'
import api from '@/api'
import router from '@/router'
import logo from '@images/logo.png'
import { urlBase64ToUint8Array } from '@/@core/utils/navigator'
import { SUPPORTED_LOCALES, SupportedLocale } from '@/types/i18n'
import { getCurrentLocale, setI18nLanguage } from '@/plugins/i18n'
import { useTheme } from 'vuetify'

// 国际化
const { t } = useI18n()
// 认证 Store
const authStore = useAuthStore()
//用户 Store
const userStore = useUserStore()

// 表单
const form = ref({
  username: '',
  password: '',
  otp_password: '',
  remember: true,
})

const refForm = ref<InstanceType<typeof VForm> | null>(null)

// 密码输入
const isPasswordVisible = ref(false)

// 错误信息
const errorMessage = ref('')

// 是否开启双重验证
const isOTP = ref(false)

// 用户名称输入框
const usernameInput = ref()

// 语言选择菜单
const langMenu = ref(false)

// 当前语言
const currentLocale = ref(getCurrentLocale())

// 当前主题
const vuetifyTheme = useTheme()

// 判断是否为透明主题
const isTransparentTheme = computed(() => {
  return vuetifyTheme.name.value === 'transparent'
})

// 可用的语言列表
const locales = Object.values(SUPPORTED_LOCALES)

// 登录按钮 loading
const loading = ref(false)

// 切换语言
async function switchLanguage(locale: SupportedLocale) {
  await setI18nLanguage(locale)
  currentLocale.value = locale
  langMenu.value = false
}

// 查询是否开启双重验证
const fetchOTP = debounce(async () => {
  const userid = usernameInput.value?.value
  if (!userid) {
    isOTP.value = false
    return
  }
  api
    .get(`/user/otp/${userid}`)
    .then((response: any) => {
      isOTP.value = response.success
    })
    .catch((error: any) => {
      console.log(error)
    })
}, 500)

// 订阅推送通知
async function subscribeForPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    const registration = await navigator.serviceWorker.ready
    // 获取订阅信息
    const subscription = await registration.pushManager.getSubscription().then(function (subscription) {
      if (subscription === null) {
        const convertedVapidKey = urlBase64ToUint8Array(import.meta.env.VITE_PUBLIC_VAPID_KEY)
        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })
      } else {
        return subscription
      }
    })
    // 发送订阅请求
    try {
      await api.post('/message/webpush/subscribe', subscription)
    } catch (e) {
      console.log(e)
    }
  }
}

// 登录后处理
async function afterLogin(superuser: boolean) {
  // 跳转到首页或回原始页面
  router.push(authStore.originalPath ?? '/')
  // 订阅推送通知
  if (superuser) await subscribeForPushNotifications()
  // 登录按钮 loading
  loading.value = false
}

// 登录获取token事件
function login() {
  errorMessage.value = ''

  // 进行表单校验
  if (!form.value.username || !form.value.password || (isOTP.value && !form.value.otp_password)) {
    return
  }

  // 登录按钮 loading
  loading.value = true

  // 用户名密码
  const formData = new FormData()

  formData.append('username', form.value.username)
  formData.append('password', form.value.password)
  formData.append('otp_password', form.value.otp_password)

  // 请求token
  api
    .post('/login/access-token', formData, {
      headers: {
        Accept: 'application/json', // 设置 Accept 类型
      },
    })
    .then((response: any) => {
      const authPayLoad: authState = {
        token: response.access_token,
        remember: form.value.remember,
      }

      const userPayload: userState = {
        superUser: response.super_user,
        userID: response.user_id,
        userName: response.user_name,
        avatar: response.avatar,
        level: response.level,
        permissions: response.permissions,
      }

      authStore.login(authPayLoad)
      userStore.loginUser(userPayload)

      // 登录后处理
      afterLogin(userPayload.superUser)
    })
    .catch((error: any) => {
      // 登录失败，显示错误提示
      if (!error.response) errorMessage.value = t('login.networkError')
      else if (error.response.status === 401) errorMessage.value = t('login.authFailure')
      else if (error.response.status === 403) errorMessage.value = t('login.permissionDenied')
      else if (error.response.status === 500) errorMessage.value = t('login.serverError')
      else errorMessage.value = `${t('login.loginFailed')} ${error.response.status}，${t('login.checkCredentials')}`
      // 登录按钮 loading
      loading.value = false
    })
}

// 自动登录
onMounted(async () => {
  // 获取token和remember状态
  const token = authStore.token
  const remember = authStore.remember

  // 如果token存在，且保持登录状态为true，则跳转到首页
  if (token && remember) {
    router.push('/')
  }
})
</script>

<template>
  <!-- 登录页面容器 -->
  <div class="relative flex min-h-screen flex-col items-center justify-center">
    <!-- 登录表单 -->
    <div class="auth-wrapper d-flex align-center justify-center">
      <VCard
        class="auth-card px-7 py-3 w-full h-full"
        :class="{ 'glass-effect': !isTransparentTheme }"
        max-width="24rem"
        border
      >
        <VCardItem class="justify-center">
          <template #prepend>
            <div class="d-flex pe-0">
              <VImg src="app.svg" width="64" height="64" />
            </div>
          </template>
          <VCardTitle class="font-weight-bold text-2xl text-uppercase"> MovieStation </VCardTitle>

          <!-- 语言切换按钮 -->
          <template #append>
            <VMenu v-model="langMenu" :close-on-content-click="false">
              <template #activator="{ props }">
                <VBtn variant="text" size="small" v-bind="props" class="lang-switch-btn">
                  <span v-if="SUPPORTED_LOCALES[currentLocale].flag">{{ SUPPORTED_LOCALES[currentLocale].flag }}</span>
                  <VIcon v-else icon="mdi-translate" />
                  <span class="ms-1">{{ SUPPORTED_LOCALES[currentLocale].title }}</span>
                </VBtn>
              </template>
              <VCard min-width="180">
                <VList>
                  <VListItem
                    v-for="locale in locales"
                    :key="locale.name"
                    :value="locale.name"
                    @click="switchLanguage(locale.name as SupportedLocale)"
                  >
                    <template #prepend>
                      <span v-if="locale.flag" class="mr-2">{{ locale.flag }}</span>
                      <VIcon v-else icon="mdi-translate" size="small" />
                    </template>
                    <VListItemTitle>{{ locale.title }}</VListItemTitle>
                  </VListItem>
                </VList>
              </VCard>
            </VMenu>
          </template>
        </VCardItem>
        <VCardText>
          <VForm ref="refForm" autocomplete="on" @submit.prevent="() => {}">
            <VRow>
              <!-- username -->
              <VCol cols="12">
                <VTextField
                  ref="usernameInput"
                  v-model="form.username"
                  :label="t('login.username')"
                  type="text"
                  name="username"
                  autocomplete="username"
                  :rules="[requiredValidator]"
                  @input="fetchOTP"
                />
              </VCol>
              <!-- password -->
              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  :label="t('login.password')"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  name="current-password"
                  autocomplete="current-password"
                  :append-inner-icon="isPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  :rules="[requiredValidator]"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>
              <VCol cols="12">
                <VTextField v-if="isOTP" v-model="form.otp_password" :label="t('login.otpCode')" type="input" />
                <!-- remember me checkbox -->
                <div class="d-flex align-center justify-space-between flex-wrap">
                  <VCheckbox v-model="form.remember" :label="t('login.stayLoggedIn')" required />
                </div>
              </VCol>
              <VCol cols="12">
                <!-- login button -->
                <VBtn block type="submit" @click="login" prepend-icon="mdi-login" :loading="loading">
                  {{ t('login.login') }}
                </VBtn>
                <VAlert v-if="errorMessage" type="error" variant="tonal" class="mt-3">
                  {{ errorMessage }}
                </VAlert>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@core/scss/pages/page-auth';

.v-card-item__prepend {
  padding-inline-end: 0 !important;
}

.auth-wrapper {
  overflow: hidden;
  block-size: auto;
}

.lang-switch-btn {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-end: 8px;
}

.glass-effect {
  backdrop-filter: blur(10px) !important;
  background: rgba(var(--v-theme-surface), 0.7) !important;
}
</style>
