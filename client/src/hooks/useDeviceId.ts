import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'

export function useDeviceId(): { deviceId: string | null; loading: boolean } {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem('deviceId').then((id) => {
      setDeviceId(id)
      setLoading(false)
    })
  }, [])

  return { deviceId, loading }
}
