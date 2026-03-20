# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Lumina Translate — an AI-powered desktop translation app with a "Liquid Glass" aesthetic. Electron + React + TypeScript + Vite + Tailwind.

## Design Reference

All designs live in `design/`. Each workspace folder contains `screen.png` (mockup) and `code.html` (Tailwind reference). The design system spec is in `design/liquid_lumina/DESIGN.md`.

**When implementing or modifying a workspace, always read the corresponding `screen.png` and `code.html` first.**

| Workspace | Design folder |
|-----------|--------------|
| Translate (home) | `lumina_home_workspace/` |
| Proofread | `lumina_enhanced_proofread_wide_layout/` |
| Dictionary | `lumina_dictionary_workspace/` |
| Documents hub | `lumina_documents_workspace/` |
| Document translation | `lumina_document_translation_workspace/` |
| Settings | `lumina_settings_workspace/` |

## Build

```bash
npm run dev              # Vite dev server with Electron hot-reload
npm run build            # Full build: tsc → Vite → electron-builder
npm run build:vite       # Vite build only (skip packaging)
npm run package          # Windows NSIS installer → release/
```

No test suite. Verify with `npm run build` (includes TypeScript type checking).

## Git Workflow

- **Never commit directly to `master`.** Always work on a feature branch.
- Branch naming: `feature/<short-description>`, `fix/<short-description>`
- Commit early and often on the feature branch.
- When work is ready, present options to the user: merge to master, create PR, or keep iterating.
