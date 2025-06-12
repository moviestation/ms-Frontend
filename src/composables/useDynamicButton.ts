import { ref, inject, nextTick, onMounted, onActivated, onDeactivated, onUnmounted } from 'vue'

// 声明全局变量类型
declare global {
  interface Window {
    __VUE_INJECT_DYNAMIC_BUTTON__?: (button: any) => void
  }
}

/**
 * 动态按钮钩子函数
 *
 * @param options 配置选项
 * @returns 控制函数和状态
 *
 * @example
 * // 在页面中使用
 * const { openDialog } = useDynamicButton({
 *   icon: 'mdi-cog',
 *   onClick: () => {
 *     dialog.value = true
 *   }
 * })
 */
export function useDynamicButton(options: {
  icon: string
  onClick: () => void
  autoRegister?: boolean // 是否自动注册，默认为true
}) {
  // 提取配置
  const { icon, onClick, autoRegister = true } = options

  // 动态按钮相关
  const registerDynamicButton = inject<((button: any) => void) | null>('registerDynamicButton', null)
  const unregisterDynamicButton = inject<(() => void) | null>('unregisterDynamicButton', null)

  // 按钮注册状态
  const dynamicButtonRegistered = ref(false)

  // 注册动态按钮
  function setupDynamicButton() {
    // 避免重复注册
    if (dynamicButtonRegistered.value) return

    // 确保注册方法存在
    if (!registerDynamicButton) {
      // 尝试获取全局注册方法
      const tryUseGlobalMethod = () => {
        if (typeof window !== 'undefined' && window.__VUE_INJECT_DYNAMIC_BUTTON__) {
          window.__VUE_INJECT_DYNAMIC_BUTTON__({
            icon,
            action: onClick,
            show: true,
          })
          dynamicButtonRegistered.value = true
          return true
        }
        return false
      }

      // 立即尝试一次
      if (!tryUseGlobalMethod()) {
        // 如果失败，延迟再试一次
        setTimeout(tryUseGlobalMethod, 1000)
      }
      return
    }

    // 如果注册方法存在，直接注册
    nextTick(() => {
      registerDynamicButton({
        icon,
        action: onClick,
        show: true,
      })
      dynamicButtonRegistered.value = true
    })
  }

  // 取消注册动态按钮
  function cleanupDynamicButton() {
    if (unregisterDynamicButton && dynamicButtonRegistered.value) {
      unregisterDynamicButton()
      dynamicButtonRegistered.value = false
    }
  }

  // 暴露方法：手动打开对话框
  function openDialog() {
    onClick()
  }

  // 生命周期钩子
  if (autoRegister) {
    onMounted(() => {
      // 延迟执行，确保Footer组件已加载
      setTimeout(() => {
        setupDynamicButton()
      }, 500)
    })

    onActivated(() => {
      // 重置注册状态，确保每次激活时都重新注册
      dynamicButtonRegistered.value = false
      setupDynamicButton()
    })

    onDeactivated(() => {
      cleanupDynamicButton()
    })

    onUnmounted(() => {
      cleanupDynamicButton()
    })
  }

  // 返回控制函数和状态
  return {
    setupDynamicButton, // 手动注册按钮
    cleanupDynamicButton, // 手动取消注册
    openDialog, // 手动触发点击事件
    isRegistered: dynamicButtonRegistered, // 注册状态
  }
}
