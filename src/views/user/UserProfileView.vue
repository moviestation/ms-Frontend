<script lang="ts" setup>
import { useToast } from 'vue-toast-notification'
import QrcodeVue from 'qrcode.vue'
import { VForm } from 'vuetify/lib/components/index.mjs'
import api from '@/api'
import type { User } from '@/api/types'
import avatar1 from '@images/avatars/avatar-1.png'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 显示器宽度
const display = useDisplay()

const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// 用户 Store
const userStore = useUserStore()

// 提示框
const $toast = useToast()

const refInputEl = ref<HTMLElement>()

// 正在保存
const isSaving = ref(false)

// 开启双重验证窗口
const otpDialog = ref(false)

// otp uri
const otpUri = ref('')

// otp secret
const secret = ref('')

// 确认双重验证密码
const otpPassword = ref('')

// 当前头像缓存
const currentAvatar = ref(avatar1)

// 当前用户名
const currentUserName = ref('')

// 当前用户信息
const accountInfo = ref<User>({
  id: 0,
  name: '',
  password: '',
  email: '',
  is_active: false,
  is_superuser: false,
  avatar: '',
  is_otp: false,
  permissions: {},
  settings: {},
  nickname: '',
})

// 二维码信息
const qrCode = ref('')

// 更新头像
function changeAvatar(file: Event) {
  const fileReader = new FileReader()
  const { files } = file.target as HTMLInputElement
  if (files && files.length > 0) {
    const selectedFile = files[0]
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 800 * 1024
    // 检查文件是否为图片
    if (!allowedTypes.includes(selectedFile.type)) {
      $toast.error(t('profile.avatarFormatError'))
      return
    }
    // 检查文件大小
    if (selectedFile.size > maxSize) {
      $toast.error(t('profile.avatarSizeError'))
      return
    }
    fileReader.readAsDataURL(selectedFile)
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string') {
        currentAvatar.value = fileReader.result
        $toast.success(t('profile.avatarUploadSuccess'))
      }
    }
  }
}

// 重置默认头像
function resetDefaultAvatar() {
  currentAvatar.value = avatar1
  $toast.success(t('profile.resetAvatarSuccess'))
}

// 还原当前头像
function restoreCurrentAvatar() {
  currentAvatar.value = accountInfo.value.avatar
  $toast.success(t('profile.restoreAvatarSuccess'))
}

// 加载当前用户信息
async function fetchUserInfo() {
  try {
    const result: User = await api.get(`user/${userStore.userName}`)
    if (result) {
      accountInfo.value = result
      accountInfo.value.avatar = accountInfo.value.avatar ? accountInfo.value.avatar : avatar1
      currentUserName.value = accountInfo.value.name
      currentAvatar.value = accountInfo.value.avatar
    }
  } catch (error) {
    console.log(error)
  }
}

// 保存用户信息
async function saveAccountInfo() {
  if (isSaving.value) {
    $toast.error(t('profile.savingInProgress'))
    return
  }
  if (!currentUserName.value) {
    $toast.error(t('profile.usernameRequired'))
    return
  }
  if (newPassword.value || confirmPassword.value) {
    if (newPassword.value !== confirmPassword.value) {
      $toast.error(t('profile.passwordMismatch'))
      return
    }
    accountInfo.value.password = newPassword.value
  }

  // 将nickname保存到settings中，后端可以直接处理JSON对象
  if (accountInfo.value.nickname) {
    if (!accountInfo.value.settings) {
      accountInfo.value.settings = {}
    }
    accountInfo.value.settings.nickname = accountInfo.value.nickname
  }

  const oldUserName = accountInfo.value.name
  const oldAvatar = accountInfo.value.avatar
  accountInfo.value.avatar = currentAvatar.value
  accountInfo.value.name = currentUserName.value
  isSaving.value = true
  try {
    // 创建一个临时对象来保存用户数据，确保所有字段都会发送
    const userData = { ...accountInfo.value }

    const result: { [key: string]: any } = await api.put('user/', userData)

    if (result.success) {
      if (oldUserName !== currentUserName.value) {
        $toast.success(t('profile.usernameChangeSuccess', { oldName: oldUserName, newName: currentUserName.value }))
        // 更新本地用户名显示
        userStore.setUserName(currentUserName.value)
      } else {
        $toast.success(t('profile.saveSuccess'))
      }
      // 更新本地头像显示
      if (oldAvatar !== currentAvatar.value) {
        userStore.setAvatar(currentAvatar.value)
      }
    } else {
      if (oldAvatar !== currentAvatar.value) {
        $toast.error(
          t('profile.saveFailedWithNameChange', {
            oldName: oldUserName,
            newName: currentUserName.value,
            message: result.message,
          }),
        )
      } else {
        $toast.error(t('profile.saveFailed', { message: result.message }))
      }
      // 失败缓存值还原
      currentUserName.value = accountInfo.value.name
      accountInfo.value.name = oldUserName
      currentAvatar.value = accountInfo.value.avatar
      accountInfo.value.avatar = oldAvatar
    }
  } catch (error) {
    console.log('保存失败:', error)
  }
  isSaving.value = false
}

// 为当前用户获取Otp Uri
async function getOtpUri() {
  try {
    const result: { [key: string]: any } = await api.post('user/otp/generate')
    if (result.success) {
      otpUri.value = result.data.uri
      secret.value = result.data.secret
      qrCode.value = result.data.uri
      otpDialog.value = true
    } else {
      $toast.error(t('profile.otpGenerateFailed', { message: result.message }))
    }
  } catch (error) {
    console.log(error)
  }
}

// 关闭当前用户的双重验证
async function disableOtp() {
  try {
    const result: { [key: string]: any } = await api.post('user/otp/disable')
    if (result.success) {
      accountInfo.value.is_otp = false
      $toast.success(t('profile.otpDisableSuccess'))
    } else {
      $toast.error(t('profile.otpDisableFailed', { message: result.message }))
    }
  } catch (error) {
    console.log(error)
  }
}

// 启用Otp
async function judgeOtpPassword() {
  if (!otpPassword.value) {
    $toast.error(t('profile.otpCodeRequired'))
    return
  }
  try {
    const result: { [key: string]: any } = await api.post('user/otp/judge', {
      uri: otpUri.value,
      otpPassword: otpPassword.value,
    })

    if (result.success) {
      $toast.success(t('profile.otpEnableSuccess'))
      otpDialog.value = false
      accountInfo.value.is_otp = true
    } else {
      $toast.error(t('profile.otpEnableFailed', { message: result.message }))
    }
  } catch (error) {
    console.log(error)
  }
}

// 加载当前用户数据
onMounted(() => {
  fetchUserInfo()
})

// 监听 localStorage 中的用户头像变化
watch(
  () => userStore.avatar,
  () => {
    currentAvatar.value = userStore.avatar
  },
)
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard :title="t('profile.personalInfo')">
          <VCardText class="flex">
            <!-- 👉 Avatar -->
            <VAvatar rounded="lg" size="100" class="me-6" :image="currentAvatar" />

            <!-- 👉 Upload Photo -->
            <form class="flex flex-col justify-center gap-5">
              <div class="flex flex-wrap gap-2">
                <VBtn color="primary" @click="refInputEl?.click()">
                  <VIcon icon="mdi-cloud-upload-outline" />
                  <span v-if="display.mdAndUp.value" class="ms-2">{{ t('profile.uploadNewAvatar') }}</span>
                </VBtn>

                <input
                  ref="refInputEl"
                  type="file"
                  name="file"
                  accept=".jpeg,.png,.jpg,GIF"
                  hidden
                  @input="changeAvatar"
                />

                <VBtn type="reset" color="info" variant="tonal" @click="restoreCurrentAvatar">
                  <VIcon icon="mdi-refresh" />
                  <span v-if="display.mdAndUp.value" class="ms-2">{{ t('common.reset') }}</span>
                </VBtn>

                <VBtn type="reset" color="error" variant="tonal" @click="resetDefaultAvatar">
                  <VIcon icon="mdi-image-sync-outline" />
                  <span v-if="display.mdAndUp.value" class="ms-2">{{ t('common.default') }}</span>
                </VBtn>

                <VBtn
                  :color="accountInfo.is_otp ? 'warning' : 'success'"
                  variant="tonal"
                  @click.stop="accountInfo.is_otp ? disableOtp() : getOtpUri()"
                >
                  <VIcon icon="mdi-account-key" />
                  <span v-if="display.mdAndUp.value" class="ms-2">{{
                    accountInfo.is_otp ? t('profile.disableTwoFactor') : t('profile.enableTwoFactor')
                  }}</span>
                </VBtn>
              </div>

              <p class="text-body-1 mb-0">{{ t('profile.avatarFormatTip') }}</p>
            </form>
          </VCardText>

          <VCardText>
            <!-- 👉 Form -->
            <VForm class="mt-6">
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="currentUserName"
                    density="comfortable"
                    readonly
                    :label="t('user.username')"
                    prepend-inner-icon="mdi-account"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.email"
                    density="comfortable"
                    clearable
                    :label="t('user.email')"
                    type="email"
                    prepend-inner-icon="mdi-email"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="newPassword"
                    density="comfortable"
                    :type="isNewPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isNewPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    clearable
                    :label="t('user.password')"
                    autocomplete=""
                    prepend-inner-icon="mdi-lock"
                    @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <!-- 👉 confirm password -->
                  <VTextField
                    v-model="confirmPassword"
                    density="comfortable"
                    :type="isConfirmPasswordVisible ? 'text' : 'password'"
                    :append-inner-icon="isConfirmPasswordVisible ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    clearable
                    :label="t('user.confirmPassword')"
                    prepend-inner-icon="mdi-lock-check"
                    @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.nickname"
                    density="comfortable"
                    clearable
                    :label="t('profile.nickname')"
                    :placeholder="t('profile.nicknamePlaceholder')"
                    prepend-inner-icon="mdi-card-account-details"
                  />
                </VCol>
              </VRow>

              <VDivider class="my-10">
                <span>{{ t('profile.accountBinding') }}</span>
              </VDivider>

              <VRow>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.settings.wechat_userid"
                    density="comfortable"
                    clearable
                    :label="t('profile.wechatUser')"
                    prepend-inner-icon="mdi-wechat"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.settings.telegram_userid"
                    density="comfortable"
                    clearable
                    :label="t('profile.telegramUser')"
                    prepend-inner-icon="mdi-send"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.settings.slack_userid"
                    density="comfortable"
                    clearable
                    :label="t('profile.slackUser')"
                    prepend-inner-icon="mdi-slack"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.settings.vocechat_userid"
                    density="comfortable"
                    clearable
                    :label="t('profile.vocechatUser')"
                    prepend-inner-icon="mdi-chat"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.settings.synologychat_userid"
                    density="comfortable"
                    clearable
                    :label="t('profile.synologychatUser')"
                    prepend-inner-icon="mdi-message"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="accountInfo.settings.douban_userid"
                    density="comfortable"
                    clearable
                    :label="t('profile.doubanUser')"
                    prepend-inner-icon="mdi-movie"
                  />
                </VCol>
              </VRow>
              <VRow>
                <!-- 👉 Form Actions -->
                <VCol cols="12" class="d-flex flex-wrap gap-4">
                  <VBtn @click="saveAccountInfo" :disabled="isSaving" prepend-icon="mdi-content-save">
                    <span v-if="isSaving">{{ t('common.saving') }}...</span>
                    <span v-else>{{ t('common.save') }}</span>
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- 双重验证弹窗 -->
    <VDialog v-if="otpDialog" v-model="otpDialog" max-width="45rem" scrollable>
      <!-- 开启双重验证弹窗内容 -->
      <VCard>
        <VDialogCloseBtn @click="otpDialog = false" />
        <VCardText>
          <h4 class="text-h4 text-center mb-6 mt-5">{{ t('profile.twoFactorAuthentication') }}</h4>
          <h5 class="text-h5 font-weight-medium mb-2">{{ t('profile.authenticatorApp') }}</h5>
          <p class="mb-6">
            {{ t('profile.authenticatorAppDescription') }}
          </p>
          <div class="my-6">
            <QrcodeVue class="mx-auto" :value="qrCode" :size="200" max-width="25rem" />
          </div>
          <VAlert :title="secret" variant="tonal" type="warning" class="my-4" :text="t('profile.secretKeyTip')">
            <template #prepend />
          </VAlert>
          <VForm>
            <VTextField
              v-model="otpPassword"
              type="text"
              :label="t('profile.enterVerificationCode')"
              autocomplete=""
              class="mb-8"
              variant="outlined"
              prepend-inner-icon="mdi-shield-key"
            />
            <div class="d-flex justify-end flex-wrap gap-4">
              <VBtn variant="outlined" color="secondary" @click="otpDialog = false"> {{ t('common.cancel') }} </VBtn>
              <VBtn @click="judgeOtpPassword">
                <template #prepend>
                  <VIcon icon="mdi-check" />
                </template>
                {{ t('common.confirm') }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
