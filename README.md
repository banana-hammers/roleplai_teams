# RoleplayAI Teams

**Level Up Together With Your RoleplAIrs** — AI agents with your personality that grow the more you use them. Created through conversation, not configuration.

## Overview

RoleplayAI Teams lets you create AI agents called **RoleplAIrs** that sound like you and get better over time. Instead of filling out forms, you just talk:

1. **Chat with Nova** — Our AI interviewer captures your voice in a 5-minute conversation
2. **Forge your RoleplAIr** — Tell Forge what you need and it builds your agent with starter Skills
3. **Start Talking** — Your RoleplAIr responds with your voice, your style, your way of thinking

Each RoleplAIr combines:

- **Identity Core**: Your personality (voice, values, boundaries) — created once, inherited by all your RoleplAIrs
- **RoleplAIrs**: Specialized versions of you for different tasks (sales, support, writing, coding)
- **Lore**: Knowledge they remember — your bio, brand guidelines, docs
- **Skills**: Abilities they can perform — draft emails, review code (with XP leveling coming soon)
- **Tools**: Integrations to take action — send emails, create PRs (coming soon)

## Features

✅ **Conversational Onboarding** - Nova interviews you to capture your voice; Forge builds your RoleplAIrs
✅ **Identity Core** - Your personality shared across all RoleplAIrs
✅ **RoleplAIrs** - Specialized AI agents for different tasks
✅ **Skills System** - Abilities your RoleplAIrs can perform
✅ **Lore (Context Packs)** - Reusable knowledge they remember
✅ **Multi-Provider AI** - OpenAI and Anthropic (Claude)
✅ **Streaming Chat** - Real-time responses with Vercel AI SDK v5
✅ **Supabase Backend** - Authentication, database, and RLS security
✅ **Modern UI** - Next.js 16, React 19, Tailwind CSS 4, shadcn/ui

## Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm
- Git
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for local development)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/banana-hammers/roleplai_teams.git
cd roleplai_teams
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```bash
# Supabase (get from https://supabase.com/dashboard)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (system fallback keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

4. **Start the development server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Using Local Supabase (Optional)

For local development with full database control:

```bash
# Start Supabase
npx supabase start

# Apply migrations
npx supabase db reset

# Generate types
npx supabase gen types typescript --local > types/database.types.ts
```

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for detailed setup instructions.

## Project Structure

```
roleplai_teams/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (Edge runtime)
│   │   ├── chat/         # Base chat endpoint
│   │   └── roles/        # Role-specific chat
│   ├── chat/             # Chat demo page
│   ├── login/            # Authentication
│   └── signup/
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── chat/             # Chat interface
├── lib/                  # Utilities
│   └── supabase/        # Supabase clients
├── proxy.ts              # Next.js proxy (auth middleware)
├── supabase/            # Database migrations
└── types/               # TypeScript types
```

## Documentation

- [📐 ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture and design decisions
- [💬 CHAT_IMPLEMENTATION.md](docs/CHAT_IMPLEMENTATION.md) - Chat system architecture
- [🛠️ DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide and workflows
- [🗄️ Database Schema](supabase/migrations/20250101000000_initial_schema.sql) - Complete schema
- [🤖 Claude Code Context](.claude/README.md) - AI assistant project context

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **UI**: [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com)
- **AI**: [Vercel AI SDK v5](https://sdk.vercel.ai), [@ai-sdk/react](https://www.npmjs.com/package/@ai-sdk/react)
- **Backend**: [Supabase](https://supabase.com) (Auth, Database, RLS)
- **Language**: [TypeScript 5](https://www.typescriptlang.org)

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Key Features in Development

1. **Chat Streaming** - Real-time token streaming with Vercel AI SDK v5
2. **Authentication** - Supabase Auth with proxy-based session management
3. **Database** - PostgreSQL with Row-Level Security
4. **Type Safety** - Auto-generated types from database schema

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

Environment variables needed:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional, for system fallback)
- `ANTHROPIC_API_KEY` (optional, for system fallback)

### Manual Deployment

```bash
npm run build
npm run start
```

## Database Schema

Core tables (with UI terminology mapping):
- `identity_cores` - Your personality (Identity Core)
- `roles` - AI agents (called **RoleplAIrs** in the UI)
- `context_packs` - Knowledge snippets (called **Lore** in the UI)
- `skills` - Abilities your RoleplAIrs can perform
- `tasks` - Task execution tracking
- `task_approvals` - Approval workflow for sensitive actions
- `user_api_keys` - BYO API keys (encryption TODO)

All tables use Row-Level Security (RLS) for multi-tenant isolation.

## Security

- ✅ Row-Level Security enabled on all tables
- ✅ Authentication required for all API routes
- ✅ Proxy (middleware) handles session management
- ✅ Edge Runtime provides request isolation
- ⚠️ API key encryption - TODO (schema ready)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## License

[MIT License](LICENSE)

## Support

- [Documentation](docs/DEVELOPMENT.md)
- [Issues](https://github.com/banana-hammers/roleplai_teams/issues)
- [Discussions](https://github.com/banana-hammers/roleplai_teams/discussions)

## Roadmap

**Completed:**
- [x] Nova (AI interviewer for Identity Core creation)
- [x] Forge (AI-guided RoleplAIr creation)
- [x] Skills system infrastructure
- [x] Task execution with approval workflow
- [x] Lore (context packs) management
- [x] Role-Skills many-to-many relationships (schema)

**In Progress:**
- [ ] XP & Leveling for Skills
- [ ] Chat history persistence (schema ready, API/UI TODO)
- [ ] Tool integrations (email, Slack, GitHub)
- [ ] API key encryption
- [ ] Team collaboration features
- [ ] Spend tracking and limits

---

Built with ❤️ using Next.js, Supabase, and Vercel AI SDK
