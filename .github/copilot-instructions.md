# Lumina Translate repository instructions

GitHub Copilot is the primary coding agent for this repository. These are the
canonical repository-wide instructions; `AGENTS.md` and `CLAUDE.md` provide
entry points for other agents.

## Project and runtime

Lumina Translate is a Windows desktop translation application built with
Tauri v2, React 18, TypeScript, Vite 6, Tailwind CSS 3, and a Rust backend.
The frontend supports translation, proofreading, dictionary lookup, document
translation, settings, themes, and 24 UI languages.

The application has two development runtimes:

- `npm run dev`: browser-only Vite mode. AI calls use Vite proxies, streaming
  falls back to a non-streaming request, and speech uses the Web Speech API.
- `npm run tauri:dev`: the real desktop runtime. AI and TTS calls cross the
  Tauri bridge into `src-tauri/src/lib.rs`.

Preserve both paths unless a task explicitly targets only one runtime.

## Setup and commands

- Install Node.js 18+, npm, Rust, and the Windows WebView2 runtime.
- Install JavaScript dependencies with `npm ci`.
- Run browser development with `npm run dev`.
- Run desktop development with `npm run tauri:dev`.
- Type-check the frontend with `npx tsc --noEmit`.
- Build the frontend with `npm run build:vite`.
- Check Rust with `cargo check --manifest-path src-tauri\Cargo.toml`.
- Build the desktop application with `npm run tauri:build`.

There is no automated test suite or CI workflow. Use the smallest relevant
validation set, then perform focused manual or Playwright testing for behavior
changes. Run Playwright scenarios sequentially because they share browser
state. See `docs/DEVELOPMENT.md` for current command caveats and manual testing
guidance.

## Repository map

- `src/App.tsx`: workspace navigation, persistence, keyboard shortcuts, theme
  synchronization, and online/offline state.
- `src/components/`: workspace and shared UI components.
- `src/services/ai.ts`: provider models, prompts, browser/Tauri routing,
  streaming listeners, response parsing, downloads, and speech.
- `src/services/settings.ts`: `AppSettings`, defaults, language list, and
  `localStorage` persistence under `lumina-settings`.
- `src/services/themes.ts`: theme metadata and CSS-variable application.
- `src/services/pdf.ts`: PDF.js worker setup and page text extraction.
- `src/i18n/`: English key source plus 23 matching translation dictionaries.
- `src-tauri/src/lib.rs`: Tauri commands, OpenAI/Anthropic HTTP calls,
  streaming event emission, and Edge cloud TTS.
- `src-tauri/tauri.conf.json`: window, build, bundle, and CSP configuration.
- `src-tauri/capabilities/default.json`: desktop permissions.

Read `docs/ARCHITECTURE.md` before changing runtime boundaries or data flow.

## Change rules

- Make surgical changes and preserve existing behavior outside the request.
- Apply every matching `.github/instructions/*.instructions.md` file. Those
  files are the source of truth for frontend, i18n, and Tauri-specific rules.
- Never commit API keys, credentials, `.env` files, generated `dist` output,
  `release` artifacts, or `src-tauri/target`.
- Treat settings data as sensitive. Do not log or expose values from
  `lumina-settings`.
- Keep browser and Tauri implementations behaviorally aligned, including
  request shapes, errors, and provider handling.
- Keep errors explicit and actionable. Do not silently return success-shaped
  fallbacks for failed API, parsing, file, or bridge operations.
- Do not edit generated files or unrelated ignored planning files.

## Git workflow

- Never commit directly to `master`.
- Use `feature/<description>` or `fix/<description>` branches.
- Use worktrees for parallel feature development instead of stashing.
- Do not rewrite history or discard unrelated working-tree changes.
- When work is ready, present merge, pull request, or further iteration as the
  next choices.

## Validation by change type

- Frontend TypeScript/UI: `npx tsc --noEmit`; add `npm run build:vite` for
  bundling, dependency, PDF worker, or Vite changes.
- Rust/Tauri: keep edited Rust code consistent with nearby style, inspect the
  diff for accidental reformatting, and run the Rust check command above.
- Cross-runtime AI/TTS: validate both frontend and Rust, then exercise the
  affected flow in `npm run tauri:dev`.
- UI behavior: run the narrow scenario in browser mode when possible; use
  Tauri mode for bridge, streaming, native-window, CSP, or TTS behavior.
- Documentation only: verify links, paths, and commands against the repository.

Trust these instructions and search further only when the task needs details
not covered here or the repository has changed.
