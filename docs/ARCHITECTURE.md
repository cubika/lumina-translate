# Architecture

## Overview

Lumina Translate is a single-window Tauri v2 desktop application. React owns
the UI and local interaction state; Rust provides native HTTP and speech
operations that avoid browser CORS and WebView2 voice limitations.

```text
React workspaces
  -> hooks and services
    -> browser mode: Vite proxy / Web APIs
    -> Tauri mode: invoke commands
      -> Rust reqwest / WebSocket clients
        -> AI providers and Edge cloud TTS
```

## Frontend

`src/main.tsx` mounts `App`. `src/App.tsx` owns the active workspace and keeps
all five workspaces mounted, using `display: none` for inactive views so their
local state is preserved.

The main workspace components are:

- `components/translate/TranslateWorkspace.tsx`
- `components/proofread/ProofreadWorkspace.tsx`
- `components/dictionary/DictionaryWorkspace.tsx`
- `components/documents/DocumentsWorkspace.tsx`
- `components/settings/SettingsWorkspace.tsx`

Cross-cutting behavior belongs in services:

- `services/ai.ts` contains provider definitions, prompts, request routing,
  streaming, response parsing, downloads, and speech dispatch.
- `services/settings.ts` owns the settings schema, defaults, language list,
  BCP-47 mapping, and persistence.
- `services/themes.ts` applies theme palettes through CSS variables.
- `services/pdf.ts` configures the bundled PDF.js worker and extracts page
  text for document translation.

## State and events

Settings are stored in browser/WebView `localStorage` under
`lumina-settings`. Saving dispatches a `settings-changed` window event.
Themes, translations, and workspaces listen for that event rather than
maintaining separate settings stores.

The active workspace is stored separately under `lumina-active-workspace`.
API keys are currently part of the settings object, so code must never log,
export, commit, or expose the stored object.

## AI request paths

In Tauri mode, `services/ai.ts` detects `window.__TAURI_INTERNALS__` and invokes
Rust commands:

- `ai_call`: non-streaming OpenAI-compatible or Anthropic request.
- `ai_call_stream`: streaming request that emits `ai-stream-chunk`.
- `speak`: Edge cloud TTS returning MP3 bytes.

In browser-only development, AI requests use the Vite proxies configured in
`vite.config.ts`. Streaming intentionally falls back to the non-streaming
request path. Speech uses the browser Web Speech API.

When changing a request shape, provider, error contract, or prompt, review both
the browser implementation in `src/services/ai.ts` and the Rust implementation
in `src-tauri/src/lib.rs`.

## Internationalization

`src/i18n/en.ts` defines the canonical key set. `TranslationKey` is derived
from the English dictionary, and every other dictionary is typed as a record
of those keys. The selected target language also controls the UI language.

Language support spans several registries:

- `src/services/settings.ts`: display names and BCP-47 tags.
- `src/i18n/index.ts`: dictionary imports and registry.
- `src-tauri/src/lib.rs`: TTS voice mapping.

## Native configuration

`src-tauri/tauri.conf.json` defines the Vite integration, window, CSP, and
bundle settings. `src-tauri/capabilities/default.json` grants window
permissions. Changes that introduce a new remote endpoint or native API may
need updates in both files.

The Rust entry point in `src-tauri/src/main.rs` must keep the Windows subsystem
attribute to avoid opening a console window in release builds.
