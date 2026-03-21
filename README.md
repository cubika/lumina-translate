# Lumina Translate

> AI-powered desktop translation studio — translate, proofread, and look up words in 24 languages.

Built with **Tauri v2 + React + TypeScript + Vite + Tailwind CSS**. Portable 11 MB executable.

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows-0078d4)
![Tauri](https://img.shields.io/badge/Tauri-v2-ffc131)

---

## Highlights

- **Streaming Translation** — See tokens appear in real-time as the AI translates
- **Paragraph Alignment** — Hover a translated paragraph to highlight the corresponding source text
- **PDF Support** — Translate entire PDF documents with chunked parallel processing
- **Smart Dictionary** — Multi-meaning definitions with register tags, usage notes, frequency indicators, example sentences with translations, and etymology
- **Proofread Modes** — Grammar-only fix, readability improvement, or full style revision
- **24 Languages** — UI fully localized in all supported languages
- **Edge Cloud TTS** — Neural text-to-speech for all 24 languages
- **Tone & Style Control** — Standard, Formal, Casual, Academic, or Creative tone with adjustable complexity

## Features

### Translate
Side-by-side editor with streaming output, language swap animation, skeleton loading, and bidirectional paragraph hover highlighting. Supports tone and simplicity settings.

### Proofread
Three modes: **Grammar Only** (fix errors, keep your voice), **Improve Readability** (rewrite for clarity and flow), or **Full Style Revision** (thorough editing with polish). Side-by-side comparison with accept/dismiss per issue.

### Dictionary
Look up any word to get:
- Multiple word classes (noun, verb, adjective) with numbered definitions
- Register tags per definition (informal, technical, dated, literary)
- IPA pronunciation with text-to-speech
- Usage notes, word frequency, related forms
- Synonyms and antonyms (clickable for quick lookup)
- Example sentences with translations in your native language
- Etymology and word origin

### Documents
Drag-and-drop translation for **TXT, MD, CSV, JSON, SRT, and PDF** files. Large documents are automatically chunked and translated in parallel with progress percentage.

## Quick Start

### Download

Grab the latest portable exe from [Releases](https://github.com/cubika/lumina-translate/releases) — no installation needed, just run it.

### Configure

1. Open the app and go to **Settings** (or press `Ctrl+5`)
2. Set your **Native Language**
3. Pick an AI model and enter your API key
   - [Get an OpenAI key](https://platform.openai.com/api-keys)
   - [Get an Anthropic key](https://console.anthropic.com/settings/keys)
   - Or use Azure OpenAI / any OpenAI-compatible endpoint via custom Base URL
4. Click **Save Changes**

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` to `Ctrl+5` | Switch workspaces |
| `Ctrl+Enter` | Translate / Proofread |

## Build from Source

### Prerequisites

- Node.js 18+
- Rust toolchain ([rustup.rs](https://rustup.rs/))

### Install & Run

```bash
git clone https://github.com/cubika/lumina-translate.git
cd lumina-translate
npm install
npm run tauri:dev    # Dev mode with hot reload
```

### Build

```bash
npm run package      # Portable exe → release/LuminaTranslate.exe (~11 MB)
```

## Supported Models

| Provider | Models |
|----------|--------|
| **OpenAI** | GPT-5.4, GPT-5.4 Mini/Nano, GPT-5.2, GPT-4.1, GPT-4.1 Mini/Nano, GPT-4o, GPT-4o Mini |
| **Anthropic** | Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5 |
| **Azure** | Model Router or any OpenAI-compatible endpoint |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3, TypeScript |
| Desktop | Tauri v2 (Rust, WebView2) |
| Build | Vite 6 |
| TTS | Edge Cloud Neural Voices |
| PDF | pdfjs-dist (Mozilla) |
| AI | OpenAI & Anthropic APIs with streaming SSE |

## License

MIT
