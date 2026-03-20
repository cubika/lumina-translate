# Lumina Translate

AI-powered desktop translation app with a "Liquid Glass" aesthetic.

Built with Electron + React + TypeScript + Vite + Tailwind CSS.

## Features

- **Translate** — Text translation between 24 languages, powered by OpenAI or Anthropic models
- **Proofread** — Grammar, spelling, and style analysis with detailed issue-by-issue corrections
- **Dictionary** — Multilingual word lookup with definitions, etymology, synonyms, antonyms, and example sentences (analysis displayed in your native language)
- **Documents** — Upload and translate entire text files (.txt, .md, .csv, .json, .srt) with drag-and-drop

## Getting Started

### Prerequisites

- Node.js 18+
- An API key from [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/)

### Install

```bash
git clone <repo-url>
cd lumina-translate
npm install
```

### Development

```bash
npm run dev
```

Opens both the Vite dev server (http://localhost:5173) and the Electron window. The browser version uses a Vite proxy to avoid CORS issues with API calls.

### Build

```bash
npm run build        # Full build: TypeScript + Vite + Electron packager
npm run build:vite   # Vite build only (skip Electron packaging)
npm run package      # Windows NSIS installer → release/
```

## Configuration

1. Open the app and go to **Settings**
2. Select an AI model (Claude Haiku 4.5 works with standard API keys)
3. Enter your API key
4. Click **Save Changes**

### API Key Access

Not all models may be available depending on your Anthropic billing tier. You can test model access with:

```bash
curl https://api.anthropic.com/v1/messages \
  -H 'content-type: application/json' \
  -H 'anthropic-version: 2023-06-01' \
  -H 'x-api-key: YOUR_API_KEY' \
  -d '{
    "model": "claude-haiku-4-5-20251001",
    "max_tokens": 256,
    "messages": [{"role": "user", "content": "Say hi"}]
  }'
```

### Supported Models

| Provider | Model ID | Name |
|----------|----------|------|
| Anthropic | `claude-opus-4-6` | Claude Opus 4.6 |
| Anthropic | `claude-sonnet-4-6` | Claude Sonnet 4.6 |
| Anthropic | `claude-haiku-4-5-20251001` | Claude Haiku 4.5 |
| OpenAI | `gpt-5.4` | GPT-5.4 |
| OpenAI | `gpt-5.4-mini` | GPT-5.4 Mini |
| OpenAI | `gpt-4.1` | GPT-4.1 |
| OpenAI | `gpt-4o` | GPT-4o |

## Tech Stack

- **Frontend**: React 18, Tailwind CSS 3, TypeScript
- **Desktop**: Electron 33
- **Build**: Vite 6, vite-plugin-electron
- **Packaging**: electron-builder (NSIS installer for Windows)

## License

MIT
