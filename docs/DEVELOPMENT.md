# Development

## Prerequisites

- Node.js 18 or newer
- npm
- Rust toolchain compatible with Rust 1.77.2 or newer
- Windows WebView2 runtime for desktop development

Install JavaScript dependencies with:

```powershell
npm ci
```

Do not place real API keys in source files, documentation, fixtures, command
history, screenshots, or commits.

## Development modes

Use browser mode for fast frontend work:

```powershell
npm run dev
```

Browser mode runs at `http://localhost:5173`. AI calls use Vite development
proxies, streaming falls back to a non-streaming response, and speech uses the
Web Speech API.

Use Tauri mode for native behavior:

```powershell
npm run tauri:dev
```

Tauri mode is required to validate streaming events, Rust HTTP behavior, Edge
cloud TTS, native window operations, capabilities, and CSP changes.

## Validation

Run the smallest relevant checks:

```powershell
# Frontend type safety
npx tsc --noEmit

# Frontend production bundle
npm run build:vite

# Rust compile check
cargo check --manifest-path src-tauri\Cargo.toml

# Full desktop build
npm run tauri:build
```

There is no automated test suite or GitHub Actions workflow. For UI behavior,
run a focused Playwright or manual scenario against the active development
runtime. Run Playwright scenarios sequentially because they share browser
state.

`npm run build:vite` currently succeeds with a known warning about chunks over
500 kB, including the bundled PDF worker. Treat the warning as baseline unless
a task changes bundle composition.

The current Rust source does not pass a repo-wide `cargo fmt --check` without
reformatting existing files. Keep changed Rust code consistent with nearby
style, inspect the diff for accidental formatting churn, and do not combine an
unrelated task with a whole-backend rustfmt change.

For browser automation, Playwright has its own `localStorage`. Configure only
the required test values with `page.evaluate()` by merging them into the
existing `lumina-settings` object. Never paste a real key into tracked files or
test output.

`npm run clean` uses `rm -rf` and may fail on Windows. Avoid cleanup unless it
is necessary, and remove only the specific generated directory involved.

## Change-specific instructions

Use the path-specific instructions as the maintained source of truth:

- Frontend: `.github/instructions/frontend.instructions.md`
- Internationalization: `.github/instructions/i18n.instructions.md`
- Tauri and Rust: `.github/instructions/tauri.instructions.md`

For version bumps, keep versions synchronized in `package.json`,
`package-lock.json`, `src-tauri/Cargo.toml`, and
`src-tauri/tauri.conf.json`.

Follow the Git workflow in `.github/copilot-instructions.md`.
