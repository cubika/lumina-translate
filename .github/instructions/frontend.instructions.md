---
applyTo: "src/**/*.ts,src/**/*.tsx,src/**/*.css,vite.config.ts,tailwind.config.js"
---

# Frontend instructions

- Use strict TypeScript and existing functional React component and hook
  patterns. Avoid `any`, non-null assertions, and type casts unless the runtime
  invariant is clear and cannot be represented more safely.
- Keep API/provider logic in `src/services`, reusable state synchronization in
  hooks, and workspace presentation in `src/components`.
- Use `loadSettings()` and `saveSettings()` rather than reading or writing the
  `lumina-settings` key from UI components.
- Preserve the `settings-changed` event contract for settings, themes, and UI
  language updates.
- `App.tsx` hides inactive workspaces instead of unmounting them so local
  workspace state survives navigation. Do not change this behavior
  accidentally.
- Use Tailwind classes and the semantic CSS variables defined in
  `src/index.css` and `src/services/themes.ts`; do not hardcode a parallel
  color system.
- Keep the browser fallback in `src/services/ai.ts` aligned with the Tauri
  command path. Vite proxies are development-only and must not be assumed to
  exist in the packaged app.
- Revoke object URLs, remove event listeners, and cancel asynchronous work
  where the existing lifecycle requires cleanup.
- Validate with `npx tsc --noEmit`. Also run `npm run build:vite` for changes
  involving imports, bundling, Vite, Tailwind, assets, or PDF.js.
