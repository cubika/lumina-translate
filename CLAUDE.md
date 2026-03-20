# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Lumina Translate — an AI-powered desktop translation app with a "Liquid Glass" aesthetic. Electron + React + TypeScript + Vite + Tailwind.

## Architecture

| Workspace | Component | Description |
|-----------|-----------|-------------|
| Translate | `src/components/translate/TranslateWorkspace.tsx` | Text translation between 24 languages |
| Proofread | `src/components/proofread/ProofreadWorkspace.tsx` | Grammar/spelling/style analysis with issue cards |
| Dictionary | `src/components/dictionary/DictionaryWorkspace.tsx` | Multilingual word lookup with etymology, synonyms |
| Documents | `src/components/documents/DocumentsWorkspace.tsx` | File upload and translation (.txt, .md, .csv, .json, .srt) |
| Settings | `src/components/settings/SettingsWorkspace.tsx` | Model selection, API key configuration |

Key files:
- `src/services/ai.ts` — AI API calls (OpenAI-compatible + Anthropic), prompt templates
- `src/services/settings.ts` — Settings persistence (localStorage)
- `src/App.tsx` — Workspace routing (CSS display:none to preserve state)
- `electron/main.ts` — Electron main process with IPC for CORS-free API calls
- `vite.config.ts` — Dev proxy for Anthropic, OpenAI, and custom endpoints (Azure)

## Build

```bash
npm run dev              # Vite dev server with Electron hot-reload
npm run build            # Full build: tsc → Vite → electron-builder
npm run build:vite       # Vite build only (skip packaging)
npm run package          # Windows NSIS installer → release/
```

No test suite. Verify with `npx tsc --noEmit` (type checking) or `npm run build` (full build).

## Git Workflow

- **Never commit directly to `master`.** Always work on a feature branch.
- Branch naming: `feature/<short-description>`, `fix/<short-description>`
- Commit early and often on the feature branch.
- When work is ready, present options to the user: merge to master, create PR, or keep iterating.

## Testing

- Use Playwright MCP for E2E testing — interact with the running dev server
- Set up API key in Playwright's localStorage before testing (separate session from user's browser)
- Azure Model Router (`model-router`) works for testing; Anthropic Sonnet/Opus may be blocked by API key tier
- Run tests sequentially — parallel Playwright agents conflict on the same browser
