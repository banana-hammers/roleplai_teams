# Contributing to RoleplayAI Teams

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.local` from another team member (see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for required variables)
3. Start local Supabase:
   ```bash
   npx supabase start
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

For full setup details, see [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Branch Naming

Use prefixed branch names:

- `feature/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation changes

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add skill execution logging
fix: handle missing identity core gracefully
docs: update API key setup instructions
refactor: simplify system prompt builder
```

## Pull Request Workflow

1. Create a branch from `master`
2. Make your changes
3. Ensure CI passes locally:
   ```bash
   npm run lint
   npx tsc --noEmit
   ```
4. Push and open a PR — the template will guide you
5. CI runs automatically (lint + typecheck)
6. Merge when CI is green

We're a trust-based team — no required reviewers. Use your judgment on when to request a review.

## Environment Variables

You'll need API keys for full functionality. At minimum:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from `npx supabase start`
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — for AI chat
- `ENCRYPTION_MASTER_KEY` — for BYO API key encryption

See the [Environment Variables section in CLAUDE.md](CLAUDE.md#environment-variables) for the full list.
