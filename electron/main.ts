import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#111318',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#111318',
      symbolColor: '#e2e2e8',
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// ─── AI API calls (runs in Node.js — no CORS) ───

interface AICallRequest {
  provider: 'openai' | 'anthropic'
  model: string
  messages: { role: string; content: string }[]
  system?: string
  // OpenAI config
  openaiKey?: string
  openaiBase?: string
  // Anthropic config
  anthropicKey?: string
}

async function callOpenAI(req: AICallRequest): Promise<string> {
  const base = req.openaiBase || 'https://api.openai.com/v1'
  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${req.openaiKey}`,
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages,
      temperature: 0.3,
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`OpenAI API error: ${resp.status} ${err}`)
  }

  const data = await resp.json()
  return data.choices[0].message.content
}

async function callAnthropic(req: AICallRequest): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.anthropicKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: req.model,
      max_tokens: 4096,
      system: req.system || undefined,
      messages: req.messages.filter(m => m.role !== 'system'),
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Anthropic API error: ${resp.status} ${err}`)
  }

  const data = await resp.json()
  return data.content[0].text
}

ipcMain.handle('ai:call', async (_event, req: AICallRequest) => {
  try {
    if (req.provider === 'anthropic') {
      if (!req.anthropicKey) throw new Error('Anthropic API key not configured. Please set it in Settings.')
      return { ok: true, result: await callAnthropic(req) }
    } else {
      if (!req.openaiKey) throw new Error('OpenAI API key not configured. Please set it in Settings.')
      return { ok: true, result: await callOpenAI(req) }
    }
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) }
  }
})
