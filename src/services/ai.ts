import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

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
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Delay cleanup so the download actually starts
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

// Route API calls through Tauri backend (no CORS).
// Falls back to direct fetch in browser-only dev mode.
async function callAI(
  messages: { role: string; content: string }[],
  model: string,
  providerType: 'openai' | 'anthropic',
  system?: string,
  maxTokens?: number
): Promise<string> {
  const settings = loadSettings()
  const config = { openaiKey: settings.openaiApiKey, openaiBase: settings.openaiBaseUrl, anthropicKey: settings.anthropicApiKey }

  // Tauri backend path — no CORS issues
  if (window.__TAURI_INTERNALS__) {
    const resp = await invoke<{ ok: boolean; result?: string; error?: string }>('ai_call', {
      req: {
        provider: providerType,
        model,
        messages,
        system,
        openaiKey: config.openaiKey,
        openaiBase: config.openaiBase,
        anthropicKey: config.anthropicKey,
        maxTokens: maxTokens || 4096,
      },
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
    const text = data?.content?.[0]?.text
    if (!text) throw new Error('Unexpected Anthropic response format')
    return text
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
    // OpenAI format: system message goes in the messages array
    const openaiMessages = system
      ? [{ role: 'system', content: system }, ...messages]
      : messages
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages: openaiMessages, temperature: 0.3 }),
    })
    if (!response.ok) {
      const detail = await parseApiError(response)
      throw new Error(`OpenAI API error (${response.status}): ${detail}`)
    }
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error('Unexpected OpenAI response format')
    return text
  }
}

async function callAIStream(
  messages: { role: string; content: string }[],
  model: string,
  providerType: 'openai' | 'anthropic',
  onChunk: (text: string) => void,
  system?: string,
  maxTokens?: number
): Promise<string> {
  const settings = loadSettings()
  const config = { openaiKey: settings.openaiApiKey, openaiBase: settings.openaiBaseUrl, anthropicKey: settings.anthropicApiKey }

  if (window.__TAURI_INTERNALS__) {
    const unlisten = await listen<string>('ai-stream-chunk', (event) => {
      onChunk(event.payload)
    })

    try {
      const resp = await invoke<{ ok: boolean; result?: string; error?: string }>('ai_call_stream', {
        req: {
          provider: providerType,
          model,
          messages,
          system,
          openaiKey: config.openaiKey,
          openaiBase: config.openaiBase,
          anthropicKey: config.anthropicKey,
          maxTokens: maxTokens || 4096,
        },
      })
      if (!resp.ok) throw new Error(resp.error)
      return resp.result!
    } finally {
      unlisten()
    }
  }

  // Browser fallback — no streaming
  return callAI(messages, model, providerType, system, maxTokens)
}

let currentAudio: HTMLAudioElement | null = null

export async function speakText(text: string, lang: string): Promise<void> {
  // Stop any currently playing audio
  if (currentAudio) { currentAudio.pause(); currentAudio = null }
  if ('speechSynthesis' in window) speechSynthesis.cancel()

  // Tauri app — use Edge cloud TTS via Rust backend (WebView2 lacks online voices)
  if (window.__TAURI_INTERNALS__) {
    try {
      const audioBytes = await invoke<number[]>('speak', { text, lang })
      const blob = new Blob([new Uint8Array(audioBytes)], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      currentAudio = new Audio(url)
      currentAudio.onended = () => { URL.revokeObjectURL(url); currentAudio = null }
      await currentAudio.play()
    } catch (e) {
      console.error('TTS failed:', e)
    }
    return
  }

  // Browser dev — Web Speech API (has online voices in Chrome/Edge)
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    speechSynthesis.speak(utterance)
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

export async function testConnection(model: string, providerType: 'openai' | 'anthropic'): Promise<{ ok: boolean; error?: string }> {
  try {
    await callAI([{ role: 'user', content: 'hi' }], model, providerType, undefined, 1)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Connection failed' }
  }
}

const TRANSLATE_SYSTEM = (sourceLang: string, targetLang: string) => {
  const settings = loadSettings()
  const toneInstructions: Record<string, string> = {
    standard: '',
    formal: '\n- Use formal, professional language. Avoid colloquialisms and slang.',
    casual: '\n- Use casual, conversational language. Be natural and relaxed.',
    academic: '\n- Use academic, scholarly language. Employ precise terminology and formal structure.',
    creative: '\n- Use creative, literary language. Be expressive and elegant.',
  }
  const simplicityInstructions: Record<string, string> = {
    default: '',
    simplified: '\n- Use simple vocabulary and short sentences. Suitable for language learners.',
    advanced: '\n- Use sophisticated vocabulary and complex sentence structures.',
  }
  const tone = toneInstructions[settings.translationTone] || ''
  const simplicity = simplicityInstructions[settings.simplicity] || ''

  return `You are a master translator fluent in ${sourceLang} and ${targetLang}. Follow these three principles:

1. Faithful: Accurately convey the original meaning — no additions, omissions, or distortions
2. Expressive: Write naturally in ${targetLang} — the translation should read as if originally written in ${targetLang}, not as a word-for-word rendering. Use idiomatic expressions and natural sentence structures of ${targetLang}
3. Elegant: Match or elevate the literary quality — choose precise, refined wording appropriate to the register

Additional rules:
- Output as PLAIN TEXT only — do NOT use markdown formatting (no #, *, **, \`, etc.)
- Preserve the EXACT paragraph structure: keep the same number of paragraphs and line breaks as the source
- For technical terms with no standard translation, keep the original in parentheses
- For proper nouns (names, brands, places), keep as-is unless a widely accepted translation exists
- Output ONLY the translated text, no explanations or commentary${tone}${simplicity}`
}

export async function translate(req: TranslationRequest): Promise<string> {
  const systemMsg = TRANSLATE_SYSTEM(req.sourceLang, req.targetLang)

  const messages = [{ role: 'user', content: req.text }]

  // Scale max_tokens: ~1 token per 3 chars, translation can expand 2x, min 4096
  const estimatedTokens = Math.ceil(req.text.length / 3) * 2
  const maxTokens = Math.max(4096, estimatedTokens)

  return callAI(messages, req.model, req.providerType, systemMsg, maxTokens)
}

export async function translateStream(
  req: TranslationRequest,
  onChunk: (text: string) => void
): Promise<string> {
  const systemMsg = TRANSLATE_SYSTEM(req.sourceLang, req.targetLang)

  const messages = [{ role: 'user', content: req.text }]
  const estimatedTokens = Math.ceil(req.text.length / 3) * 2
  const maxTokens = Math.max(4096, estimatedTokens)

  return callAIStream(messages, req.model, req.providerType, onChunk, systemMsg, maxTokens)
}

export async function proofread(req: ProofreadRequest): Promise<{
  corrected: string
  issues: { type: string; severity: string; original: string; suggestion: string; explanation: string }[]
}> {
  const settings = loadSettings()
  const mode = settings.proofreadMode

  const modeInstructions: Record<string, string> = {
    grammar: `You are a grammar checker. Detect the language automatically. ONLY fix:
- Grammar errors (subject-verb agreement, tense, articles, prepositions)
- Spelling and typos
- Punctuation errors
Do NOT change style, tone, word choice, or sentence structure. Keep the author's voice intact.`,

    readability: `You are a professional editor. Detect the language automatically. Fix grammar/spelling AND improve readability:
- Grammar errors, spelling, and typos
- Awkward phrasing → clearer alternatives
- Wordiness → concise rewrites
- Passive voice → active voice where appropriate
- Sentence flow and paragraph transitions
Preserve the author's intent and key points, but make the text clearer and easier to read.`,

    style: `You are a senior editor and writing coach. Detect the language automatically. Thoroughly revise the text:
- Fix all grammar, spelling, and punctuation
- Improve clarity, flow, and readability
- Elevate word choice and sentence variety
- Strengthen transitions and paragraph structure
- Polish tone for the intended audience (infer from context)
- Remove redundancy, filler words, and weak constructions
The result should read as professionally edited content while preserving the author's core message.`,
  }

  const systemMsg = `${modeInstructions[mode] || modeInstructions.grammar}

Return a JSON object (no markdown fences, no extra text):
{
  "corrected": "the full corrected text preserving original formatting",
  "issues": [
    {
      "type": "Grammar Fix" | "Spelling" | "Readability" | "Style" | "Tone & Style",
      "severity": "Critical" | "Optimal" | "Minor",
      "original": "the exact problematic text",
      "suggestion": "the corrected text",
      "explanation": "brief explanation of why this is an issue"
    }
  ]
}
If the text has no issues, return {"corrected": "<original text>", "issues": []}.`

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

export interface DictionaryDefinition {
  text: string
  register?: string  // "informal", "formal", "technical", "dated", "literary", etc.
}

export interface DictionaryMeaning {
  wordClass: string  // "Noun", "Verb", "Adjective", etc.
  definitions: DictionaryDefinition[]
}

export interface DictionaryExample {
  sentence: string
  translation: string
}

export interface DictionaryResult {
  word: string
  phonetics: string
  meanings: DictionaryMeaning[]
  etymology: string
  usageNote: string
  frequency: string
  relatedForms: string[]
  synonyms: string[]
  antonyms: string[]
  examples: DictionaryExample[]
}

export async function lookupWord(req: DictionaryRequest): Promise<DictionaryResult> {
  const contextPart = req.context ? `\nContext: "${req.context}"` : ''
  const langNote = req.nativeLang && req.nativeLang !== 'English'
    ? `\nIMPORTANT: Write definitions, "etymology", and "usageNote" in ${req.nativeLang}. Keep "word", "phonetics", "wordClass", "synonyms", "antonyms", "examples", "relatedForms", "register", and "frequency" in the original language of the word.`
    : ''
  const systemMsg = `You are a multilingual linguistic expert. Analyze the given word or phrase. Detect the input language automatically.${contextPart}${langNote}

Return a JSON object (no markdown fences, no extra text):
{
  "word": "the word/phrase as given",
  "phonetics": "IPA pronunciation (e.g. /wɜːrd/)",
  "meanings": [
    {
      "wordClass": "Noun",
      "definitions": [
        { "text": "primary definition of this word class", "register": "informal" },
        { "text": "secondary definition if applicable", "register": "technical" }
      ]
    },
    {
      "wordClass": "Verb",
      "definitions": [
        { "text": "definition as verb", "register": "dated" }
      ]
    }
  ],
  "etymology": "origin and historical development of the word",
  "usageNote": "how the word is typically used: formal/informal register, common collocations, nuances, or pitfalls",
  "frequency": "Common | Academic | Literary | Rare | Archaic",
  "relatedForms": ["related word forms, e.g. for 'run': runner (noun), running (gerund), ran (past tense)"],
  "synonyms": ["5-7 synonyms in the same language as the word"],
  "antonyms": ["2-4 antonyms in the same language as the word"],
  "examples": [
    { "sentence": "example sentence in the word's original language", "translation": "translation of the sentence in ${req.nativeLang || 'English'}" }
  ]
}

Include ALL word classes the word can function as (e.g. both noun and verb for "slang"). For each word class, provide the primary definition and any important secondary definitions. Tag each definition with its register (informal, formal, technical, dated, literary, slang, etc.) when applicable. Provide 4 example sentences in the word's original language, each with a translation in ${req.nativeLang || 'English'}.`

  const messages = [{ role: 'user', content: `Analyze: ${req.word}` }]

  const result = await callAI(messages, req.model, req.providerType, systemMsg)
  try {
    return JSON.parse(extractJSON(result))
  } catch {
    return {
      word: req.word,
      phonetics: '',
      meanings: [{ wordClass: '', definitions: [{ text: result }] }],
      etymology: '',
      usageNote: '',
      frequency: '',
      relatedForms: [],
      synonyms: [],
      antonyms: [],
      examples: [{ sentence: result, translation: '' }],
    }
  }
}
