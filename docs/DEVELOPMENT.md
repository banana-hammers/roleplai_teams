# Development Guide - RoleplayAI Teams

## Quick Start

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm or pnpm
- Git
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development)

### Initial Setup

1. **Clone and install dependencies:**
```bash
git clone [your-repo-url]
cd roleplai_teams
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file in the root directory with your credentials:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Providers (system fallback keys)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

3. **Start Supabase locally (optional but recommended):**
```bash
npx supabase start
```

This will output local URLs and keys. Update your `.env.local` with the local Supabase URL and anon key.

4. **Apply database migrations:**
```bash
npx supabase db reset
```

5. **Generate TypeScript types from database:**
```bash
npx supabase gen types typescript --local > types/database.types.ts
```

6. **Start the dev server:**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
roleplai_teams/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (Edge runtime)
│   │   ├── chat/            # Basic chat endpoint
│   │   └── roles/           # Role-based chat
│   ├── chat/                # Chat demo page
│   ├── login/               # Authentication pages
│   └── signup/
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── chat/                # Chat-specific components
├── lib/                     # Utilities and helpers
│   ├── supabase/           # Supabase client configurations
│   └── utils.ts            # Shared utilities
├── proxy.ts                # Next.js proxy (replaces middleware.ts)
├── types/                   # TypeScript type definitions
├── supabase/               # Database migrations
├── .vscode/                # VSCode configuration
└── .claude/                # Claude AI context
```

## Development Workflow

### Working with the Database

#### Creating a Migration
```bash
npx supabase migration new your_migration_name
```

Edit the generated SQL file in `supabase/migrations/`, then apply:
```bash
npx supabase db reset  # Applies all migrations from scratch
```

#### Generating Types
After any schema changes:
```bash
npx supabase gen types typescript --local > types/database.types.ts
```

Or use the VSCode task: `Cmd+Shift+P` → "Run Task" → "Supabase: Generate Types"

#### Viewing Data
Supabase Studio runs at http://localhost:54323 when local dev is running.

### Working with AI Chat

#### Testing Basic Chat
1. Navigate to http://localhost:3000/chat
2. Select OpenAI or Anthropic tab
3. Send messages to test streaming

#### Testing Role-Based Chat
1. Create a user via signup
2. Insert an identity core for the user
3. Create a role linked to the identity core
4. Use the role-specific endpoint: `/api/roles/{roleId}/chat`

#### Adding New AI Providers
1. Install SDK: `npm install @ai-sdk/provider-name`
2. Import in API route: `import { provider } from '@ai-sdk/provider-name'`
3. Add to provider switch in chat routes
4. Update environment variables

### Code Quality

#### Linting
```bash
npm run lint
```

Auto-fix issues:
```bash
npx eslint . --fix
```

#### Type Checking
```bash
npx tsc --noEmit
```

Or use VSCode task: `Cmd+Shift+P` → "Run Task" → "TypeScript: Watch"

#### Building
```bash
npm run build
```

This validates the entire project compiles correctly.

### VSCode Integration

#### Recommended Extensions
Install all recommended extensions via the popup when opening the project, or manually from `.vscode/extensions.json`.

Key extensions:
- **ESLint**: Auto-fix on save
- **Tailwind CSS IntelliSense**: Class autocompletion
- **Prettier**: Code formatting
- **Claude Code**: AI assistance

#### Tasks
Access via `Cmd+Shift+P` → "Run Task":
- `Next.js: Dev Server` - Start development server
- `Supabase: Start Local` - Start local Supabase
- `Supabase: Generate Types` - Update database types
- `TypeScript: Watch` - Watch for type errors

#### Debugging
Use `F5` or Debug panel:
- **Next.js: Debug Server** - Debug server-side code
- **Next.js: Debug Client** - Debug in browser
- **Next.js: Full Stack Debug** - Both at once

#### Code Snippets
Type these prefixes and press `Tab`:
- `nsc` - Next.js Server Component
- `ncc` - Next.js Client Component
- `napi` - Next.js API Route
- `napiedge` - API Route with Edge Runtime
- `supaclient` - Supabase client import
- `supaquery` - Supabase query with error handling
- `usechat` - Vercel AI SDK v5 useChat hook
- `aichat` - AI Chat API route with streaming

### Environment-Specific Configuration

#### Local Development
Uses local Supabase instance:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from supabase start output]
```

#### Remote Development/Staging
Uses hosted Supabase project:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Supabase dashboard]
```

## Common Tasks

### Adding a New UI Component
1. Add via shadcn CLI:
```bash
npx shadcn@latest add [component-name]
```

2. Import and use:
```tsx
import { Button } from '@/components/ui/button'
```

### Creating a New Page
1. Create file in `app/` directory:
```bash
# app/dashboard/page.tsx
```

2. Export default component:
```tsx
export default function DashboardPage() {
  return <div>Dashboard</div>
}
```

### Adding an API Route
1. Create route file:
```bash
# app/api/your-route/route.ts
```

2. Use template:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'  // For streaming/low latency

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your logic here

  return NextResponse.json({ success: true })
}
```

### Updating Database Schema
1. Create migration: `npx supabase migration new add_feature`
2. Edit SQL file in `supabase/migrations/`
3. Apply: `npx supabase db reset`
4. Generate types: `npx supabase gen types typescript --local > types/database.types.ts`
5. Update TypeScript interfaces in `types/` if needed

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Supabase Not Starting
```bash
# Reset Supabase
npx supabase stop
docker system prune -a  # Warning: removes all Docker images
npx supabase start
```

### Build Errors
1. Check TypeScript: `npx tsc --noEmit`
2. Clear cache: `rm -rf .next node_modules/.cache`
3. Reinstall: `rm -rf node_modules package-lock.json && npm install`

### Database Connection Issues
- Verify Supabase is running: `npx supabase status`
- Check environment variables are correct
- Verify migrations applied: `npx supabase db reset`

## Testing

### Manual Testing
1. Start dev server: `npm run dev`
2. Navigate to pages and test functionality
3. Check browser console for errors
4. Verify database changes in Supabase Studio

### API Testing
Use `curl` or Postman:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"provider":"anthropic"}'
```

## Performance Tips

- Use Edge Runtime for streaming APIs
- Implement database indexes for frequently queried columns
- Use `React.memo()` for expensive components
- Lazy load heavy components with `next/dynamic`
- Optimize images with `next/image`
- Use Server Components where possible (default in App Router)

## Security Best Practices

- ✅ All tables have Row-Level Security (RLS) enabled
- ✅ API routes verify user authentication
- ✅ Environment variables never committed
- ✅ Edge Runtime provides isolation
- ✅ API key encryption implemented (AES-256-GCM with PBKDF2 key derivation)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Project Context for Claude](.claude/README.md)

## Getting Help

- Check `.claude/commands/` for common workflows
- Review `CHAT_IMPLEMENTATION.md` for chat system details
- Consult database schema in `supabase/migrations/`
- Ask in project Slack/Discord
- File issues on GitHub

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "feat: your feature"`
3. Push: `git push origin feature/your-feature`
4. Open a Pull Request

### Commit Message Format
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks
