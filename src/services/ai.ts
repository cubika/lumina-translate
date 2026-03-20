export interface AIProvider {
  id: string
  name: string
  type: 'openai' | 'anthropic'
}

export const AI_PROVIDERS: AIProvider[] = [
  // OpenAI - latest first
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
  model: string
  providerType: 'openai' | 'anthropic'
}

function getApiConfig(): { openaiKey: string; openaiBase: string; anthropicKey: string } {
  const stored = localStorage.getItem('lumina-settings')
  if (stored) {
    const settings = JSON.parse(stored)
    return {
      openaiKey: settings.openaiApiKey || '',
      openaiBase: settings.openaiBaseUrl || 'https://api.openai.com/v1',
      anthropicKey: settings.anthropicApiKey || '',
    }
  }
  return { openaiKey: '', openaiBase: 'https://api.openai.com/v1', anthropicKey: '' }
}

async function callOpenAI(messages: { role: string; content: string }[], model: string): Promise<string> {
  const config = getApiConfig()
  if (!config.openaiKey) throw new Error('OpenAI API key not configured. Please set it in Settings.')

  const response = await fetch(`${config.openaiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callAnthropic(messages: { role: string; content: string }[], model: string, system?: string): Promise<string> {
  const config = getApiConfig()
  if (!config.anthropicKey) throw new Error('Anthropic API key not configured. Please set it in Settings.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropicKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: system || undefined,
      messages: messages.filter(m => m.role !== 'system'),
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error: ${response.status} ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callAI(
  messages: { role: string; content: string }[],
  model: string,
  providerType: 'openai' | 'anthropic',
  system?: string
): Promise<string> {
  if (providerType === 'anthropic') {
    return callAnthropic(messages, model, system)
  }
  return callOpenAI(messages, model)
}

export async function translate(req: TranslationRequest): Promise<string> {
  const systemMsg = `You are a professional translator. Translate the following text from ${req.sourceLang} to ${req.targetLang}. Return ONLY the translated text, no explanations.`

  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: req.text },
  ]

  return callAI(messages, req.model, req.providerType, systemMsg)
}

export async function proofread(req: ProofreadRequest): Promise<{
  corrected: string
  issues: { type: string; severity: string; original: string; suggestion: string; explanation: string }[]
}> {
  const systemMsg = `You are a professional proofreader. Analyze the text for grammar, spelling, tone, and style issues. Return a JSON object with:
- "corrected": the full corrected text
- "issues": array of objects with "type" (Grammar Fix|Spelling|Tone & Style), "severity" (Critical|Optimal|Minor), "original" (the problematic text), "suggestion" (the fix), "explanation" (why)
Return ONLY valid JSON, no markdown fences.`

  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: req.text },
  ]

  const result = await callAI(messages, req.model, req.providerType, systemMsg)
  try {
    return JSON.parse(result)
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
  const systemMsg = `You are a linguistic expert. Analyze the word "${req.word}"${contextPart}. Return a JSON object with:
- "word": the word
- "phonetics": IPA pronunciation
- "wordClass": part of speech (Noun, Verb, Adjective, etc.)
- "definition": clear definition
- "etymology": brief etymology
- "synonyms": array of 5-7 synonyms
- "antonyms": array of 2-4 antonyms
- "examples": array of 2 example sentences using the word
Return ONLY valid JSON, no markdown fences.`

  const messages = [
    { role: 'system', content: systemMsg },
    { role: 'user', content: `Analyze: ${req.word}` },
  ]

  const result = await callAI(messages, req.model, req.providerType, systemMsg)
  try {
    return JSON.parse(result)
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
