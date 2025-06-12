<script lang="ts" setup>
import FileList from './filebrowser/FileList.vue'
import FileToolbar from './filebrowser/FileToolbar.vue'
import FileNavigator from './filebrowser/FileNavigator.vue'
import type { EndPoints, FileItem, StorageConf } from '@/api/types'
import { useDisplay } from 'vuetify'
import { storageIconDict } from '@/api/constants'

// 输入参数
const props = defineProps({
  storages: Array as PropType<StorageConf[]>,
  tree: Boolean,
  endpoints: Object as PropType<EndPoints>,
  axios: {
    type: Function,
    required: true,
  },
  axiosconfig: Object,
  item: {
    type: Object as PropType<FileItem>,
    required: true,
  },
  itemstack: {
    type: Array as PropType<FileItem[]>,
    default: () => [],
  },
})

// 对外事件
const emit = defineEmits(['pathchanged'])

// 显示器宽度
const display = useDisplay()

// APP
const appMode = inject('pwaMode') && display.mdAndDown.value

const fileIcons = {
  // 压缩包
  zip: 'mdi-folder-zip-outline',
  rar: 'mdi-folder-zip-outline',
  bak: 'mdi-folder-zip-outline',
  tar: 'mdi-folder-zip-outline',
  gz: 'mdi-folder-zip-outline',
  bz2: 'mdi-folder-zip-outline',
  // 开发
  htm: 'mdi-language-html5',
  html: 'mdi-language-html5',
  vue: 'mdi-vuejs',
  js: 'mdi-nodejs',
  ts: 'mdi-language-typescript',
  json: 'mdi-file-document-outline',
  css: 'mdi-language-css3',
  scss: 'mdi-language-css3',
  less: 'mdi-language-css3',
  php: 'mdi-language-php',
  py: 'mdi-language-python',
  java: 'mdi-language-java',
  go: 'mdi-language-go',
  c: 'mdi-language-c',
  cpp: 'mdi-language-cpp',
  h: 'mdi-language-c',
  cs: 'mdi-language-csharp',
  sql: 'mdi-database',
  sh: 'mdi-language-bash',
  bat: 'mdi-language-bash',
  ps1: 'mdi-language-powershell',
  // markdown
  md: 'mdi-language-markdown-outline',
  markdown: 'mdi-language-markdown-outline',
  // 图片
  png: 'mdi-file-png-box',
  jpg: 'mdi-file-jpg-box',
  jpeg: 'mdi-file-jpg-box',
  gif: 'mdi-file-gif-box',
  bmp: 'mdi-file-image-box',
  webp: 'mdi-file-image-box',
  ico: 'mdi-file-image-box',
  svg: 'mdi-file-image-box',
  // 视频
  mp4: 'mdi-filmstrip',
  mkv: 'mdi-filmstrip',
  avi: 'mdi-filmstrip',
  wmv: 'mdi-filmstrip',
  mov: 'mdi-filmstrip',
  flv: 'mdi-filmstrip',
  rmvb: 'mdi-filmstrip',
  // 文档
  txt: 'mdi-file-document-outline',
  env: 'mdi-file-cog-outline',
  yml: 'mdi-file-cog-outline',
  yaml: 'mdi-file-cog-outline',
  conf: 'mdi-file-cog-outline',
  log: 'mdi-file-document-outline',
  csv: 'mdi-file-delimited',
  // office
  xls: 'mdi-file-excel',
  xlsx: 'mdi-file-excel',
  doc: 'mdi-file-word',
  docx: 'mdi-file-word',
  ppt: 'mdi-file-powerpoint',
  pptx: 'mdi-file-powerpoint',
  pdf: 'mdi-file-pdf',
  // 音频
  mp2: 'mdi-music',
  mp3: 'mdi-music',
  m4a: 'mdi-music',
  wma: 'mdi-music',
  aac: 'mdi-music',
  ogg: 'mdi-music',
  flac: 'mdi-music',
  wav: 'mdi-music',
  // 字体
  ttf: 'mdi-format-font',
  otf: 'mdi-format-font',
  woff: 'mdi-format-font',
  woff2: 'mdi-format-font',
  eot: 'mdi-format-font',
  // 字幕
  srt: 'mdi-subtitles-outline',
  ass: 'mdi-subtitles-outline',
  sub: 'mdi-subtitles-outline',
  // 其他
  other: 'mdi-file-outline',
}

// 加载次数
const loading = ref(0)
// 当前存储
const activeStorage = ref('local')
// 刷新
const refreshPending = ref(false)
// 排序
const sort = ref('name')

// 是否显示目录树
const showDirTree = ref(false)

// 计算属性
const storagesArray = computed(() => {
  return props.storages?.map(item => ({
    title: item.name,
    value: item.type,
    icon: storageIconDict[item.type] ?? 'mdi-server-network-outline',
  }))
})

// 方法
function loadingChanged(loading: number) {
  if (loading) loading++
  else if (loading > 0) loading--
}

// 存储切换
async function storageChanged(storage: string) {
  activeStorage.value = storage
  emit('pathchanged', { storage: storage, path: '/', fileid: 'root' })
}

// 路径变化
function pathChanged(item: FileItem) {
  emit('pathchanged', item)
}

// 排序变化
function sortChanged(s: string) {
  sort.value = s
  refreshPending.value = true
}

// 切换目录树
function switchDirTree(state: boolean) {
  showDirTree.value = state
}

// 文件列表
const fileListItems = ref<FileItem[]>([])

// 文件列表数据更新
function fileListUpdated(items: FileItem[]) {
  fileListItems.value = items
}

// 外层DIV大小控制
const scrollStyle = computed(() => {
  return appMode
    ? 'height: calc(100vh - 10.5rem - env(safe-area-inset-bottom) - 6.5rem)'
    : 'height: calc(100vh - 10.5rem - env(safe-area-inset-bottom)'
})

// 文件列表大小限制
const fileListStyle = computed(() => {
  return appMode
    ? 'height: calc(100vh - 14rem - env(safe-area-inset-bottom) - 7rem)'
    : 'height: calc(100vh - 14rem - env(safe-area-inset-bottom)'
})
</script>

<template>
  <div class="mx-auto" :loading="loading > 0">
    <div v-if="activeStorage && item">
      <FileToolbar
        :item="item"
        :itemstack="itemstack"
        :storages="storagesArray"
        :storage="activeStorage"
        :endpoints="endpoints"
        :axios="axios"
        @storagechanged="storageChanged"
        @pathchanged="pathChanged"
        @foldercreated="refreshPending = true"
        @sortchanged="sortChanged"
      />
      <div class="flex" :style="scrollStyle">
        <FileNavigator
          v-if="showDirTree"
          :storage="activeStorage"
          :currentPath="item.path"
          :items="fileListItems"
          :endpoints="endpoints"
          :axios="axios"
          @navigate="pathChanged"
        />
        <FileList
          :item="item"
          :storage="activeStorage"
          :icons="fileIcons"
          :endpoints="endpoints"
          :axios="axios"
          :refreshpending="refreshPending"
          :sort="sort"
          :listStyle="fileListStyle"
          :showTree="showDirTree"
          @pathchanged="pathChanged"
          @loading="loadingChanged"
          @refreshed="refreshPending = false"
          @filedeleted="refreshPending = true"
          @renamed="refreshPending = true"
          @items-updated="fileListUpdated"
          @switch-tree="switchDirTree"
        />
      </div>
    </div>
  </div>
</template>
