---
applyTo: "src-tauri/**/*.rs,src-tauri/**/*.json,src/services/ai.ts"
---

# Tauri and Rust instructions

- Keep native network and TTS work in `src-tauri/src/lib.rs`; keep
  `src-tauri/src/main.rs` as the minimal Windows entry point.
- Reuse the managed `reqwest::Client` instead of creating a client per call.
- Return explicit `Result` errors with actionable messages. Never include API
  keys, authorization headers, or full sensitive request payloads in errors or
  logs.
- Keep frontend `invoke` command names and payload fields synchronized with
  Rust command arguments and Serde renames.
- Register every new command in `tauri::generate_handler!`. Review
  `src-tauri/capabilities/default.json` and `src-tauri/tauri.conf.json` when
  adding native APIs, URLs, permissions, or window operations.
- Preserve streaming cleanup and event behavior between
  `ai_call_stream`/`ai-stream-chunk` and the frontend listener.
- Bound network operations with timeouts and bound untrusted response sizes
  when accumulating data.
- Validate Rust changes with
  `cargo check --manifest-path src-tauri\Cargo.toml`.
- The repository does not currently pass `cargo fmt --check` without
  reformatting existing files. Keep changed code consistent with nearby style
  and do not include repo-wide rustfmt churn in an unrelated change.
- For bridge, streaming, CSP, or TTS changes, also run `npx tsc --noEmit` and
  exercise the affected path with `npm run tauri:dev`.
