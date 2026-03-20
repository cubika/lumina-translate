import { useState, useCallback, useEffect } from 'react'
import { type AppSettings, loadSettings, saveSettings } from '../services/settings'

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    const handleStorage = () => setSettingsState(loadSettings())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...partial }
      saveSettings(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
