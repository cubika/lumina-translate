export interface AppSettings {
  selectedModel: string
  providerType: 'openai' | 'anthropic'
  openaiApiKey: string
  openaiBaseUrl: string
  anthropicApiKey: string
  zeroRetention: boolean
  localProcessing: boolean
  sourceLang: string
  targetLang: string
}

const STORAGE_KEY = 'lumina-settings'

export const defaultSettings: AppSettings = {
  selectedModel: 'gpt-4.1',
  providerType: 'openai',
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com/v1',
  anthropicApiKey: '',
  zeroRetention: false,
  localProcessing: false,
  sourceLang: 'English',
  targetLang: 'Chinese',
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
}

export const LANGUAGES = [
  'English', 'Chinese', 'Spanish', 'French', 'German', 'Japanese',
  'Korean', 'Portuguese', 'Russian', 'Arabic', 'Italian', 'Dutch',
  'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Hindi', 'Polish',
  'Swedish', 'Czech', 'Romanian', 'Hungarian', 'Ukrainian', 'Greek',
]
