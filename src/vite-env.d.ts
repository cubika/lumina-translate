/// <reference types="vite/client" />

interface ElectronAPI {
  aiCall: (req: {
    provider: 'openai' | 'anthropic'
    model: string
    messages: { role: string; content: string }[]
    system?: string
    openaiKey?: string
    openaiBase?: string
    anthropicKey?: string
  }) => Promise<{ ok: boolean; result?: string; error?: string }>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
