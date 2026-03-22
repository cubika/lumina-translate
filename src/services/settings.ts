import type { ThemeId } from './themes'

export interface AppSettings {
  selectedModel: string
  providerType: 'openai' | 'anthropic'
  openaiApiKey: string
  openaiBaseUrl: string
  anthropicApiKey: string
  sourceLang: string
  targetLang: string
  translationTone: 'standard' | 'formal' | 'casual' | 'academic' | 'creative'
  simplicity: 'default' | 'simplified' | 'advanced'
  proofreadMode: 'grammar' | 'readability' | 'style'
  theme: ThemeId
}

const STORAGE_KEY = 'lumina-settings'

export const defaultSettings: AppSettings = {
  selectedModel: 'claude-haiku-4-5-20251001',
  providerType: 'anthropic',
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  anthropicApiKey: '',
  sourceLang: 'English',
  targetLang: 'Chinese',
  translationTone: 'standard',
  simplicity: 'default',
  proofreadMode: 'grammar',
  theme: 'lumina-dark',
}

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {
    // ignore parse errors
  }
  return defaultSettings
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event('settings-changed'))
}

export const LANGUAGES = [
  'English', 'Chinese', 'Spanish', 'French', 'German', 'Japanese',
  'Korean', 'Portuguese', 'Russian', 'Arabic', 'Italian', 'Dutch',
  'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Hindi', 'Polish',
  'Swedish', 'Czech', 'Romanian', 'Hungarian', 'Ukrainian', 'Greek',
]

/** Map display language names to BCP-47 tags for speech synthesis */
const LANG_TO_BCP47: Record<string, string> = {
  English: 'en', Chinese: 'zh-CN', Spanish: 'es', French: 'fr',
  German: 'de', Japanese: 'ja', Korean: 'ko', Portuguese: 'pt',
  Russian: 'ru', Arabic: 'ar', Italian: 'it', Dutch: 'nl',
  Turkish: 'tr', Vietnamese: 'vi', Thai: 'th', Indonesian: 'id',
  Hindi: 'hi', Polish: 'pl', Swedish: 'sv', Czech: 'cs',
  Romanian: 'ro', Hungarian: 'hu', Ukrainian: 'uk', Greek: 'el',
}

export function langToBcp47(lang: string): string {
  return LANG_TO_BCP47[lang] ?? 'en'
}
