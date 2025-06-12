import api from '@/api'
export async function fetchGlobalSettings() {
  try {
    const result: { [key: string]: any } = await api.get('system/global', {
      params: {
        token: 'moviepilot',
      },
    })
    return result.data || {}
  } catch (error) {
    console.error('Failed to fetch global settings', error)
    throw error
  }
}
