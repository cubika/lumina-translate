# AGENTS.md

Lumina Translate uses GitHub Copilot as its primary coding agent while keeping
the repository usable by Claude, Codex, Gemini, and other agents.

## Instruction order

1. Treat `.github/copilot-instructions.md` as the canonical repository-wide
   instruction file.
2. Apply every `.github/instructions/*.instructions.md` file whose `applyTo`
   pattern matches a file you edit.
3. Use `docs/ARCHITECTURE.md` for runtime and code-layout context.
4. Use `docs/DEVELOPMENT.md` for setup, validation, and manual testing.

Do not invent a different workflow in this file. If instructions need to
change, update the canonical Copilot instructions first, then keep this entry
point and `CLAUDE.md` aligned.

## Agent compatibility

Agents that do not automatically load GitHub Copilot instruction files must
read them explicitly before editing. The project-specific rules apply
regardless of which agent performs the work.
