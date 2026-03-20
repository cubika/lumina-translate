# CLAUDE.md

Lumina Translate — AI-powered desktop translation app. Electron + React + TypeScript + Vite + Tailwind.

## Build

```bash
npm run dev          # Dev server + Electron
npm run build        # Full build (tsc + Vite + electron-builder)
```

Verify with `npx tsc --noEmit`. No test suite.

## Git

- Never commit directly to `master` — always use feature branches
- Branch naming: `feature/<desc>`, `fix/<desc>`
- When work is ready, present options to the user: merge to master, create PR, or keep iterating
- Use git worktrees for parallel feature development — keeps each feature isolated without stashing

## Testing

- Use Playwright MCP for E2E testing against the running dev server
- Playwright has its own localStorage session — set API keys via `page.evaluate()`
- Run tests sequentially — parallel Playwright agents conflict
