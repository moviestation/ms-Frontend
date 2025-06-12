// 1. 配置与兼容性
import './ace-config'
import '@/@core/utils/compatibility'
import '@/@iconify/icons-bundle'
import '@/plugins/webfontloader'

// 2. 核心插件和 UI 框架
import { createApp } from 'vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'
import pinia from '@/stores/index'
import i18n from '@/plugins/i18n'

// 3. 全局组件
import App from '@/App.vue'
import { VAceEditor } from 'vue3-ace-editor'
import { PerfectScrollbarPlugin } from 'vue3-perfect-scrollbar'
import { CronVuetify } from '@vue-js-cron/vuetify'

// 4. 工具函数和其他辅助模块
import { isPWA } from './@core/utils/navigator'
import { loadRemoteComponents } from './utils/federationLoader'
import { fetchGlobalSettings } from './utils/globalSetting'

// 5. 其他插件和功能模块
import ToastPlugin from 'vue-toast-notification'
import ConfirmDialog from '@/composables/useConfirm'
import VueApexCharts from 'vue3-apexcharts'

// 6. 注册自定义组件
import DialogCloseBtn from '@/@core/components/DialogCloseBtn.vue'
import ScrollToTopBtn from '@/@core/components/ScrollToTopBtn.vue'
import PageContentTitle from './@core/components/PageContentTitle.vue'
import MediaCard from './components/cards/MediaCard.vue'
import PosterCard from './components/cards/PosterCard.vue'
import BackdropCard from './components/cards/BackdropCard.vue'
import PersonCard from './components/cards/PersonCard.vue'
import MediaInfoCard from './components/cards/MediaInfoCard.vue'
import TorrentCard from './components/cards/TorrentCard.vue'
import MediaIdSelector from './components/misc/MediaIdSelector.vue'
import CronField from './components/field/CronField.vue'
import PathField from './components/field/PathField.vue'
import HeaderTab from './layouts/components/HeaderTab.vue'

// 7. 样式文件 - 合并为单一导入
import '@/styles/main.scss'

// 创建Vue实例
const app = createApp(App)

// 注册pinia
app.use(pinia)

// 初始化配置
async function initializeApp() {
  try {
    // 是否为PWA
    const pwaMode = await isPWA()
    app.provide('pwaMode', pwaMode)

    // 全局设置
    const globalSettings = await fetchGlobalSettings()
    app.provide('globalSettings', globalSettings)

    // 加载并注册远程联邦组件
    await loadRemoteComponents()
  } catch (error) {
    console.error('Failed to initialize app', error)
  }
}

// 注册全局组件
initializeApp().then(() => {
  // 1. 注册 UI 框架
  app.use(vuetify)

  // 2. 注册路由
  app.use(router)

  // 3. 注册全局组件
  app
    .component('VAceEditor', VAceEditor)
    .component('VApexChart', VueApexCharts)
    .component('VCronVuetify', CronVuetify)
    .component('VDialogCloseBtn', DialogCloseBtn)
    .component('VScrollToTopBtn', ScrollToTopBtn)
    .component('VMediaCard', MediaCard)
    .component('VPosterCard', PosterCard)
    .component('VBackdropCard', BackdropCard)
    .component('VPersonCard', PersonCard)
    .component('VMediaInfoCard', MediaInfoCard)
    .component('VTorrentCard', TorrentCard)
    .component('VMediaIdSelector', MediaIdSelector)
    .component('VCronField', CronField)
    .component('VPathField', PathField)
    .component('VHeaderTab', HeaderTab)
    .component('VPageContentTitle', PageContentTitle)

  // 5. 注册其他插件
  app
    .use(PerfectScrollbarPlugin)
    .use(ToastPlugin, {
      position: 'bottom-right',
    })
    .use(ConfirmDialog)
    .use(i18n)
    .mount('#app')
})
