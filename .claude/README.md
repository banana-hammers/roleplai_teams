# Claude Code Configuration

This directory contains Claude Code configuration for collaborative development.

- **`CLAUDE.md`** (project root) — Primary project instructions. The single source of truth.
- **`rules/`** — Topic-specific context files loaded automatically into Claude sessions.
- **`commands/`** — Custom slash commands (`/check`, `/pr`, `/status`, `/deploy`, `/schema`, `/migrate`, `/test-chat`).
- **`agents/`** — Custom agent configurations (e.g., `safe-builder`).
- **`settings.json`** — Shared permission allow/deny lists and hooks.
- **`settings.local.json`** — Per-machine permission overrides (not shared).

See `CLAUDE.md` for full project documentation.
