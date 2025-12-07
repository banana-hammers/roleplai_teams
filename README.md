# RoleplayAI Teams

A Next.js application for managing AI-powered role-based agents with identity cores, context packs, and team collaboration features.

## Overview

RoleplayAI Teams enables users to create personalized AI agents (roles) that maintain consistent identity across interactions. Each role combines:

- **Identity Core**: Your personal voice, priorities, boundaries, and decision-making rules
- **Role Definition**: Specific instructions, tools, and approval policies for different contexts
- **Context Packs**: Bio, brand guidelines, rules, and custom context that can be shared across roles
- **BYO API Keys**: Bring your own OpenAI or Anthropic API keys with spend limits

## Features

✅ **Multi-Provider AI Support** - OpenAI and Anthropic (Claude)
✅ **Identity-Driven Conversations** - Consistent personality across all roles
✅ **Role-Based Access** - Different agents for different tasks
✅ **Context Management** - Reusable context packs for teams
✅ **Streaming Chat** - Real-time responses with Vercel AI SDK v5
✅ **Supabase Backend** - Authentication, database, and RLS security
✅ **Modern UI** - Built with Next.js 16, React 19, Tailwind CSS 4, and shadcn/ui

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

Core tables:
- `identity_cores` - User identity definitions
- `roles` - AI agent configurations
- `context_packs` - Reusable context snippets
- `user_api_keys` - Encrypted BYO API keys
- `tasks` - Task tracking (planned)

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

- [ ] API key encryption
- [ ] Chat history persistence
- [ ] Tool/function calling with approval workflow
- [ ] Team collaboration features
- [ ] Spend tracking and limits
- [ ] Advanced role management UI
- [ ] Task creation from chats

---

Built with ❤️ using Next.js, Supabase, and Vercel AI SDK
