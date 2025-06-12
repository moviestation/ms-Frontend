import copy from 'copy-to-clipboard'

// 请求和获取剪贴板内容
export async function getClipboardContent() {
  if (navigator.clipboard && window.isSecureContext) {
    return await navigator.clipboard.readText()
  } else {
    const input = document.createElement('textarea')
    document.body.appendChild(input)
    input.select()
    document.execCommand('paste')
    const content = input.value
    document.body.removeChild(input)
    return content
  }
}

// 将内容复制到剪贴板
export async function copyToClipboard(content: string) {
  const success = copy(content)
  return success
}

// VAPID公钥转Uint8Array
export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// 判断是否为PWA
// export const isPWA = async (): Promise<boolean> => {
//   if ('serviceWorker' in navigator) {
//     const registrations = await navigator.serviceWorker.getRegistrations()
//     return registrations.length > 0
//   }
//   return (window.navigator as any).standalone === true
// }

export const isPWA = async (): Promise<boolean> => {
  // 检查是否已安装为PWA
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    if (registrations.length > 0) {
      return true
    }
  }
  
  // 检查iOS的standalone模式
  if ((window.navigator as any).standalone === true) {
    return true
  }
  
  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // 在移动设备上自动启用PWA模式的UI
  return isMobile
}
