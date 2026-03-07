# UI Patterns

## Stack

- **React 19** with Next.js 16 App Router
- **Tailwind CSS 4** for styling
- **shadcn/ui** (Radix UI primitives) in `components/ui/`
- **RPG theme** — roles are styled like game characters

## Model Tier System

Models are categorized into tiers for the RPG-style UI:

| Tier | Color | Models |
|------|-------|--------|
| **Legendary** | Gold (amber-500) | claude-opus-4.6, claude-opus-4.5, gpt-5.2, o3 |
| **Epic** | Indigo (indigo-400) | claude-opus-4, gpt-5, gpt-4.1, o4-mini, gpt-4o |
| **Rare** | Teal (teal-500) | claude-sonnet-4.6, claude-sonnet-4.5, gpt-5-mini, gpt-4o-mini |
| **Common** | Gray | claude-haiku-4.5, gpt-5-nano, gpt-4.1-nano |

**Implementation**: `lib/utils/model-tiers.ts`
```typescript
import { getModelTier, getModelDisplayName } from '@/lib/utils/model-tiers'
const tierConfig = getModelTier(role.model_preference)
const modelLabel = getModelDisplayName(role.model_preference)
```

## Model Preference Format

Stored as `provider/model` (e.g., `anthropic/claude-sonnet-4-6`). Parsed with `split('/')`.

## Key Components

- **Role cards**: `components/roles/role-card.tsx` — all-in-one with tier badge, skills, traits
- **Chat UI**: `components/chat/chat-interface.tsx`
- **Settings**: `components/settings/` — tabbed settings panels

## Conventions

- Use `@/` path aliases for imports
- Client components need `'use client'` directive
- Use shadcn/ui components from `components/ui/` — don't install alternatives
- Follow existing Tailwind patterns in the codebase
