# CLAUDE.md

Lumina Translate — AI-powered desktop translation app. Tauri v2 + React + TypeScript + Vite + Tailwind.

## Build

```bash
npm run dev          # Vite dev server only (browser)
npm run tauri:dev    # Tauri dev (Vite + native window)
npm run tauri:build  # Production build
```

Verify with `npx tsc --noEmit`. No test suite. Rust backend in `src-tauri/`.

## Git

- Never commit directly to `master` — always use feature branches
- Branch naming: `feature/<desc>`, `fix/<desc>`
- When work is ready, present options to the user: merge to master, create PR, or keep iterating
- Use git worktrees for parallel feature development — keeps each feature isolated without stashing

## Testing

- Use Playwright MCP for E2E testing against the running dev server
- Playwright has its own localStorage session — set API keys via `page.evaluate()`
- Run tests sequentially — parallel Playwright agents conflict
