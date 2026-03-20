import { useState, useEffect, useCallback } from 'react'
import { loadSettings } from '../services/settings'
import { getTranslation, type TranslationKey } from '../i18n'

export function useTranslation() {
  const [lang, setLang] = useState(() => loadSettings().targetLang)

  useEffect(() => {
    const sync = () => setLang(loadSettings().targetLang)
    window.addEventListener('settings-changed', sync)
    return () => window.removeEventListener('settings-changed', sync)
  }, [])

  const t = useCallback(
    (key: TranslationKey) => getTranslation(lang)(key),
    [lang],
  )

  return t
}
