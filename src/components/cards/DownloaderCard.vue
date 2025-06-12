<script setup lang="ts">
import api from '@/api'
import { formatFileSize } from '@/@core/utils/formatters'
import { DownloaderConf } from '@/api/types'
import { useToast } from 'vue-toast-notification'
import type { DownloaderInfo } from '@/api/types'
import qbittorrent_image from '@images/logos/qbittorrent.png'
import transmission_image from '@images/logos/transmission.png'
import custom_image from '@images/logos/downloader.png'
import { cloneDeep } from 'lodash-es'
import { useI18n } from 'vue-i18n'
import { downloaderDict } from '@/api/constants'
import { useDisplay } from 'vuetify'

// 显示器宽度
const display = useDisplay()

// 获取i18n实例
const { t } = useI18n()

// 定义输入
const props = defineProps({
  // 单个下载器
  downloader: {
    type: Object as PropType<DownloaderConf>,
    required: true,
  },
  // 是否允许刷新数据
  allowRefresh: {
    type: Boolean,
    default: true,
  },
  // 所有下载器
  downloaders: {
    type: Array as PropType<DownloaderConf[]>,
    required: true,
  },
})

// 定义触发的自定义事件
const emit = defineEmits(['close', 'done', 'change'])

// 提示框
const $toast = useToast()

// timeout定时器
let timeoutTimer: NodeJS.Timeout | undefined = undefined

// 上传速率
const upload_rate = ref(0)

// 下载速度
const download_rate = ref(0)

// 下载器详情弹窗
const downloaderInfoDialog = ref(false)

// 下载器详情
const downloaderInfo = ref<DownloaderConf>({
  name: '',
  type: '',
  default: false,
  enabled: false,
  config: {},
})

// 调用API查询下载器数据
async function loadDownloaderInfo() {
  if (!props.allowRefresh) {
    return
  }
  try {
    const res: DownloaderInfo = await api.get('dashboard/downloader', {
      params: {
        name: props.downloader.name,
      },
    })

    if (res) {
      upload_rate.value = res.upload_speed
      download_rate.value = res.download_speed
      // 定时查询
      clearTimeout(timeoutTimer)
      if (props.downloader.enabled) {
        timeoutTimer = setTimeout(loadDownloaderInfo, 3000)
      }
    }
  } catch (e) {
    console.log(e)
  }
}

// 打开详情弹窗
function openDownloaderInfoDialog() {
  // 深复制
  downloaderInfo.value = cloneDeep(props.downloader)
  downloaderInfoDialog.value = true
}

// 保存详情数据
function saveDownloaderInfo() {
  // 为空不保存，跳出警告框
  if (!downloaderInfo.value.name) {
    $toast.error(t('downloader.nameRequired'))
    return
  }
  // 重名判断
  if (props.downloaders.some(item => item.name === downloaderInfo.value.name && item !== props.downloader)) {
    $toast.error(t('downloader.nameDuplicate'))
    return
  }
  // 默认下载器去重
  if (downloaderInfo.value.default) {
    props.downloaders.forEach(item => {
      if (item.default && item !== props.downloader) {
        item.default = false
        $toast.info(t('downloader.defaultChanged'))
      }
    })
  }
  // 执行保存
  downloaderInfoDialog.value = false
  emit('change', downloaderInfo.value, props.downloader.name)
  emit('done')
}

// 根据存储类型选择图标
const getIcon = computed(() => {
  switch (props.downloader.type) {
    case 'qbittorrent':
      return qbittorrent_image
    case 'transmission':
      return transmission_image
    default:
      return custom_image
  }
})

// 按钮点击
function onClose() {
  emit('close')
}

onMounted(async () => {
  if (props.downloader.enabled) {
    await loadDownloaderInfo()
  }
})

onUnmounted(() => {
  if (timeoutTimer) clearTimeout(timeoutTimer)
})
</script>
<template>
  <div>
    <VHover v-slot="hover">
      <VCard
        v-bind="hover.props"
        variant="tonal"
        @click="openDownloaderInfoDialog"
        :class="{ 'transition transform-cpu duration-300 -translate-y-1': hover.isHovering }"
      >
        <VDialogCloseBtn @click="onClose" />
        <span class="absolute top-3 right-12">
          <IconBtn>
            <VIcon class="cursor-move" icon="mdi-drag" />
          </IconBtn>
        </span>
        <VCardText class="flex justify-space-between align-center gap-4">
          <div class="align-self-start flex-1">
            <div class="flex items-center">
              <VBadge
                v-if="props.downloader.default && props.downloader.enabled"
                dot
                inline
                color="success"
                class="me-1"
              />
              <span class="text-h6">{{ downloader.name }}</span>
            </div>
            <div v-if="downloaderDict[downloader.type] && props.downloader.enabled" class="mt-1 flex flex-wrap text-sm">
              <span class="me-2">{{ `↑ ${formatFileSize(upload_rate, 1)}/s ` }}</span>
              <span>{{ `↓ ${formatFileSize(download_rate, 1)}/s` }}</span>
            </div>
            <div v-else-if="!downloaderDict[downloader.type]" class="mt-1 flex flex-wrap text-sm">
              <span class="me-2">自定义下载器</span>
            </div>
          </div>
          <div class="h-20">
            <VImg :src="getIcon" cover class="mt-7 me-3" max-width="3rem" min-width="3rem" />
          </div>
        </VCardText>
      </VCard>
    </VHover>

    <VDialog
      v-if="downloaderInfoDialog"
      v-model="downloaderInfoDialog"
      scrollable
      max-width="40rem"
      :fullscreen="!display.mdAndUp.value"
    >
      <VCard>
        <VCardItem class="py-2">
          <template #prepend>
            <VIcon icon="mdi-download" class="me-2" />
          </template>
          <VCardTitle>{{ t('common.config') }}</VCardTitle>
          <VCardSubtitle>{{ props.downloader.name }}</VCardSubtitle>
        </VCardItem>
        <VDialogCloseBtn v-model="downloaderInfoDialog" />
        <VDivider />
        <VCardText>
          <VForm>
            <VRow>
              <VCol cols="12" md="6">
                <VSwitch v-model="downloaderInfo.enabled" :label="t('downloader.enabled')" />
              </VCol>
              <VCol cols="12" md="6">
                <VSwitch
                  v-model="downloaderInfo.default"
                  :label="t('downloader.default')"
                  :disabled="!downloaderInfo.enabled"
                />
              </VCol>
            </VRow>
            <VRow v-if="downloaderInfo.type == 'qbittorrent'">
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.name"
                  :label="t('downloader.name')"
                  :placeholder="t('downloader.nameRequired')"
                  :hint="t('downloader.name')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-label"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.config.host"
                  :label="t('downloader.host')"
                  placeholder="http(s)://ip:port"
                  :hint="t('downloader.host')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-server"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.config.username"
                  :label="t('downloader.username')"
                  :hint="t('downloader.username')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-account"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.config.password"
                  type="password"
                  :label="t('downloader.password')"
                  :hint="t('downloader.password')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-lock"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSwitch
                  v-model="downloaderInfo.config.category"
                  :label="t('downloader.category')"
                  :hint="t('downloader.category')"
                  persistent-hint
                  active
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSwitch
                  v-model="downloaderInfo.config.sequentail"
                  :label="t('downloader.sequentail')"
                  :hint="t('downloader.sequentail')"
                  persistent-hint
                  active
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSwitch
                  v-model="downloaderInfo.config.force_resume"
                  :label="t('downloader.force_resume')"
                  :hint="t('downloader.force_resume')"
                  persistent-hint
                  active
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSwitch
                  v-model="downloaderInfo.config.first_last_piece"
                  :label="t('downloader.first_last_piece')"
                  :hint="t('downloader.first_last_piece')"
                  persistent-hint
                  active
                />
              </VCol>
            </VRow>
            <VRow v-else-if="downloaderInfo.type == 'transmission'">
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.name"
                  :label="t('downloader.name')"
                  :placeholder="t('downloader.nameRequired')"
                  :hint="t('downloader.name')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-label"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.config.host"
                  :label="t('downloader.host')"
                  placeholder="http(s)://ip:port"
                  :hint="t('downloader.host')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-server"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.config.username"
                  :label="t('downloader.username')"
                  :hint="t('downloader.username')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-account"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.config.password"
                  type="password"
                  :label="t('downloader.password')"
                  :hint="t('downloader.password')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-lock"
                />
              </VCol>
            </VRow>
            <VRow v-else>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.type"
                  :label="t('downloader.type')"
                  :hint="t('downloader.customTypeHint')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-cog"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="downloaderInfo.name"
                  :label="t('downloader.name')"
                  :hint="t('downloader.nameRequired')"
                  persistent-hint
                  active
                  prepend-inner-icon="mdi-label"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VCardActions class="pt-3">
          <VBtn @click="saveDownloaderInfo" prepend-icon="mdi-content-save" class="px-5">
            {{ t('common.save') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
