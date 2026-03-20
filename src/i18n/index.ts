import en from './en'
import zh from './zh'
import ja from './ja'

export type TranslationKey = keyof typeof en

const translations: Record<string, Record<TranslationKey, string>> = {
  English: en,
  Chinese: zh,
  Japanese: ja,
}

export function getTranslation(lang: string): (key: TranslationKey) => string {
  const dict = translations[lang] ?? en
  return (key: TranslationKey) => dict[key] ?? en[key] ?? key
}
