# Lumina Translate

AI-powered desktop translation app with a "Liquid Glass" aesthetic.

Built with Tauri v2 + React + TypeScript + Vite + Tailwind CSS.

## Features

- **Translate** — Text translation between 24 languages, powered by OpenAI or Anthropic models
- **Proofread** — Grammar, spelling, and style analysis with detailed issue-by-issue corrections
- **Dictionary** — Multilingual word lookup with definitions, etymology, synonyms, antonyms, and example sentences (analysis displayed in your native language)
- **Documents** — Upload and translate entire text files (.txt, .md, .csv, .json, .srt) with drag-and-drop
- **i18n** — UI available in English, Chinese, and Japanese (auto-switches with native language setting)
- **TTS** — Native Windows text-to-speech for translated text

## Getting Started

### Prerequisites

- Node.js 18+
- Rust toolchain (for building Tauri)
- An API key from [Anthropic](https://console.anthropic.com/) or [OpenAI](https://platform.openai.com/)

### Install

```bash
git clone <repo-url>
cd lumina-translate
npm install
```

### Development

```bash
npm run dev          # Vite dev server only (browser, uses proxy for API calls)
npm run tauri:dev    # Tauri dev (Vite + native window with full TTS support)
```

### Build

```bash
npm run tauri:build  # Production build → src-tauri/target/release/
npm run package      # Build + copy portable exe → release/LuminaTranslate.exe
```

The portable exe (≈11 MB) can be distributed directly — no installation needed.

## Configuration

1. Open the app and go to **Settings**
2. Set your **Native Language** (determines UI language and default translation target)
3. Select an AI model (Claude Haiku 4.5 works with standard API keys)
4. Enter your API key
5. Click **Save Changes**

### TTS Voice Support

Text-to-speech uses Windows native speech synthesis. To speak non-English languages, install the corresponding language pack in Windows Settings → Time & Language → Language & Region.

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
- **Desktop**: Tauri v2 (Rust backend, WebView2)
- **Build**: Vite 6
- **TTS**: Windows Media SpeechSynthesis (native, via Rust)

## License

MIT
