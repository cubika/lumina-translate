export interface AIProvider {
  id: string
  name: string
  type: 'openai' | 'anthropic'
}

export const AI_PROVIDERS: AIProvider[] = [
  // OpenAI-compatible - latest first
  { id: 'model-router', name: 'Azure Model Router', type: 'openai' },
  { id: 'gpt-5.4', name: 'GPT-5.4', type: 'openai' },
  { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini', type: 'openai' },
  { id: 'gpt-5.4-nano', name: 'GPT-5.4 Nano', type: 'openai' },
  { id: 'gpt-5.2', name: 'GPT-5.2', type: 'openai' },
  { id: 'gpt-4.1', name: 'GPT-4.1', type: 'openai' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', type: 'openai' },
  { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', type: 'openai' },
  { id: 'gpt-4o', name: 'GPT-4o', type: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'openai' },
  // Anthropic - latest first
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6', type: 'anthropic' },
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', type: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', type: 'anthropic' },
]

export interface TranslationRequest {
  text: string
  sourceLang: string
  targetLang: string
  model: string
  providerType: 'openai' | 'anthropic'
}

export interface ProofreadRequest {
  text: string
  model: string
  providerType: 'openai' | 'anthropic'
}

export interface DictionaryRequest {
  word: string
  context?: string
  nativeLang?: string
  model: string
  providerType: 'openai' | 'anthropic'
}

import { loadSettings } from './settings'

async function parseApiError(response: Response): Promise<string> {
  const text = await response.text()
  try {
    const json = JSON.parse(text)
    return json.error?.message || text
  } catch { return text }
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Route API calls through Electron main process (no CORS).
// Falls back to direct fetch in browser dev mode.
async function callAI(
  messages: { role: string; content: string }[],
  model: string,
  providerType: 'openai' | 'anthropic',
  system?: string,
  maxTokens?: number
): Promise<string> {
  const settings = loadSettings()
  const config = { openaiKey: settings.openaiApiKey, openaiBase: settings.openaiBaseUrl, anthropicKey: settings.anthropicApiKey }

  // Electron IPC path — no CORS issues
  if (window.electronAPI?.aiCall) {
    const resp = await window.electronAPI.aiCall({
      provider: providerType,
      model,
      messages,
      system,
      openaiKey: config.openaiKey,
      openaiBase: config.openaiBase,
      anthropicKey: config.anthropicKey,
    })
    if (!resp.ok) throw new Error(resp.error)
    return resp.result!
  }

  // Browser fallback — use Vite dev proxy to avoid CORS
  const isDev = import.meta.env.DEV
  if (providerType === 'anthropic') {
    if (!config.anthropicKey) throw new Error('Anthropic API key not configured. Please set it in Settings.')
    const anthropicUrl = isDev ? '/proxy/anthropic/v1/messages' : 'https://api.anthropic.com/v1/messages'
    const response = await fetch(anthropicUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 4096,
        system: system || undefined,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    })
    if (!response.ok) {
      let detail = await parseApiError(response)
      if (detail === 'Error' || detail === 'error') {
        detail = `Model "${model}" may not be available with your API key. Try a different model in Settings.`
      }
      throw new Error(`Anthropic API error (${response.status}): ${detail}`)
    }
    const data = await response.json()
    return data.content[0].text
  } else {
    if (!config.openaiKey) throw new Error('OpenAI API key not configured. Please set it in Settings.')
    // In dev mode, route through Vite proxy to avoid CORS
    const isCustomBase = config.openaiBase !== 'https://api.openai.com/v1'
    let fetchUrl: string
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiKey}`,
    }
    if (isDev) {
      if (isCustomBase) {
        fetchUrl = '/proxy/custom/chat/completions'
        headers['x-proxy-target'] = config.openaiBase
      } else {
        fetchUrl = '/proxy/openai/v1/chat/completions'
      }
    } else {
      fetchUrl = `${config.openaiBase}/chat/completions`
    }
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
    })
    if (!response.ok) {
      const detail = await parseApiError(response)
      throw new Error(`OpenAI API error (${response.status}): ${detail}`)
    }
    const data = await response.json()
    return data.choices[0].message.content
  }
}

function extractJSON(text: string): string {
  // Strip markdown code fences (handles various formats)
  const fenceMatch = text.match(/```\w*\s*([\s\S]*?)\s*```/)
  if (fenceMatch) return fenceMatch[1].trim()
  // Try to extract bare JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return jsonMatch[0]
  return text.trim()
}

export async function translate(req: TranslationRequest): Promise<string> {
  const systemMsg = `You are a professional translator. Translate the following text from ${req.sourceLang} to ${req.targetLang}. Return ONLY the translated text, no explanations.`

  const messages = [{ role: 'user', content: req.text }]

  // Scale max_tokens: ~1 token per 3 chars, translation can expand 2x, min 4096
  const estimatedTokens = Math.ceil(req.text.length / 3) * 2
  const maxTokens = Math.max(4096, estimatedTokens)

  return callAI(messages, req.model, req.providerType, systemMsg, maxTokens)
}

export async function proofread(req: ProofreadRequest): Promise<{
  corrected: string
  issues: { type: string; severity: string; original: string; suggestion: string; explanation: string }[]
}> {
  const systemMsg = `You are a professional proofreader. Analyze the text for grammar, spelling, tone, and style issues. Return a JSON object with:
- "corrected": the full corrected text
- "issues": array of objects with "type" (Grammar Fix|Spelling|Tone & Style), "severity" (Critical|Optimal|Minor), "original" (the problematic text), "suggestion" (the fix), "explanation" (why)
Return ONLY valid JSON, no markdown fences.`

  const messages = [{ role: 'user', content: req.text }]

  // Proofread returns corrected text + issues JSON, can be large
  const estimatedTokens = Math.max(4096, Math.ceil(req.text.length / 3) * 3)
  const result = await callAI(messages, req.model, req.providerType, systemMsg, estimatedTokens)
  try {
    return JSON.parse(extractJSON(result))
  } catch {
    return { corrected: result, issues: [] }
  }
}

export async function lookupWord(req: DictionaryRequest): Promise<{
  word: string
  phonetics: string
  wordClass: string
  definition: string
  etymology: string
  synonyms: string[]
  antonyms: string[]
  examples: string[]
}> {
  const contextPart = req.context ? ` in the context: "${req.context}"` : ''
  const langNote = req.nativeLang && req.nativeLang !== 'English'
    ? ` Write the "definition", "etymology" and "examples" in ${req.nativeLang} so a ${req.nativeLang} speaker can understand. Keep "word", "phonetics", "wordClass", "synonyms" and "antonyms" in the original language of the word.`
    : ''
  const systemMsg = `You are a multilingual linguistic expert. Analyze the word/phrase "${req.word}"${contextPart}. The input may be in any language — detect it automatically. Return a JSON object with:
- "word": the word/phrase as given
- "phonetics": IPA pronunciation
- "wordClass": part of speech (Noun, Verb, Adjective, etc.)
- "definition": clear definition
- "etymology": brief etymology
- "synonyms": array of 5-7 synonyms in the same language as the word
- "antonyms": array of 2-4 antonyms in the same language as the word
- "examples": array of 2 example sentences using the word${langNote}
Return ONLY valid JSON, no markdown fences.`

  const messages = [{ role: 'user', content: `Analyze: ${req.word}` }]

  const result = await callAI(messages, req.model, req.providerType, systemMsg)
  try {
    return JSON.parse(extractJSON(result))
  } catch {
    return {
      word: req.word,
      phonetics: '',
      wordClass: '',
      definition: result,
      etymology: '',
      synonyms: [],
      antonyms: [],
      examples: [],
    }
  }
}
