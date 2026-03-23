import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import { DEVICE_ID_KEY } from '../constants'

export function useDeviceId(): { deviceId: string | null; loading: boolean } {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    AsyncStorage.getItem(DEVICE_ID_KEY).then((id) => {
      setDeviceId(id)
      setLoading(false)
    })
  }, [])

  return { deviceId, loading }
}
