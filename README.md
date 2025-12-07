# Roleplai Teams

**Level up by extending your identity into purpose-built Roles that can take action safely.**

## Overview

Roleplai Teams helps people **level up** by extending their identity into purpose-built **Roles** (agents) that can take action safely using **scoped context + skills**, with optional **bring-your-own model API keys**.

## Tech Stack (Ship-Fast - Option 1)

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Supabase (Postgres + Auth + Row-level Security)
- **AI/LLM:** Vercel AI SDK (multi-provider support)
- **UI:** shadcn/ui + Tailwind CSS
- **Deployment:** Vercel

## Project Structure

```
roleplai_teams/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── identity/          # Identity & Context Pack components
│   ├── roles/             # Role management components
│   ├── skills/            # Skill library components
│   ├── tasks/             # Task execution components
│   └── settings/          # Settings & API key components
├── lib/
│   ├── supabase/          # Supabase client & server
│   ├── ai/                # AI/LLM helpers
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (for Phase 2)
- API keys for AI providers (optional for development)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd roleplai_teams
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials (after Phase 2 setup).

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Phases

### ✅ Phase 1: Foundation (Complete)
- [x] Next.js 14 project setup
- [x] Supabase integration files
- [x] shadcn/ui components
- [x] TypeScript types
- [x] Basic landing page

### 🚧 Phase 2: Database Schema (Next)
- [ ] Create Supabase project
- [ ] Define database tables
- [ ] Set up Row-Level Security policies
- [ ] Create migrations

### 📋 Phase 3: Core Features (Upcoming)
- [ ] Authentication (Supabase Auth)
- [ ] Identity Core management
- [ ] Role creation & management
- [ ] Task execution engine
- [ ] Skills system

### 📋 Phase 4: Advanced Features (Future)
- [ ] BYO model keys
- [ ] Advanced tool integrations
- [ ] Role templates
- [ ] Collaboration features

## Core Concepts

### Identity Core
Your personal voice, priorities, boundaries, and decision-making style. Define once, use across all roles.

### Roles (Agents)
Purpose-built agent aliases that select parts of your identity + add role-specific instructions. Examples:
- Comms Copilot (drafts emails in your voice)
- Meeting Assistant (creates action items)
- Research Agent (produces briefs with sources)

### Skills
Reusable, versioned workflows that can be run with new inputs. Save successful task patterns for future use.

### Context Packs
Attachable context chunks (bio, brand voice, calendar rules) that roles can access when granted permission.

## Safety & Privacy

- **Scoped Context:** Roles only see explicitly attached identity facets and context packs
- **Approvals:** Sensitive actions require user approval before execution
- **Audit Traces:** Every task logs what context was used and what tools were called
- **Row-Level Security:** Database policies ensure users can only access their own data

## Contributing

This is currently an MVP in active development. Contributions welcome after initial release.

## License

TBD
