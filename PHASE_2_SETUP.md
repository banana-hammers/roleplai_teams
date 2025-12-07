# Phase 2: Database Setup Guide

This guide will walk you through setting up your Supabase project and deploying the database schema.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works fine for development)
- Supabase CLI installed (optional, but recommended)

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the details:
   - **Name:** roleplai-teams (or your preferred name)
   - **Database Password:** (generate a strong password and save it)
   - **Region:** Choose the region closest to you
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Navigate to **API** section
3. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (under "Project API keys")

## Step 3: Configure Environment Variables

1. In your project root, copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Add a default API key for testing
OPENAI_API_KEY=sk-your-key-here
```

⚠️ **Important:** Never commit `.env.local` to Git. It's already in `.gitignore`.

## Step 4: Run the Database Migration

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/20250101000000_initial_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify that all tables were created successfully

### Option B: Using Supabase CLI (Recommended for production)

1. Install the Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your local project to your Supabase project:
```bash
supabase link --project-ref your-project-ref
```

(Find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`)

4. Apply the migration:
```bash
supabase db push
```

## Step 5: Verify Database Setup

1. In your Supabase dashboard, go to **Table Editor**
2. You should see the following tables:
   - `profiles`
   - `identity_cores`
   - `context_packs`
   - `roles`
   - `role_context_packs`
   - `skills`
   - `tasks`
   - `task_approvals`
   - `user_api_keys`

3. Click on any table and verify that Row Level Security (RLS) is enabled (you should see a shield icon)

## Step 6: Enable Email Auth (Optional for MVP)

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the "Confirm signup" and "Magic Link" templates

## Step 7: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)
3. The page should load without errors

4. To test the Supabase connection, you can add a simple test:

Create `app/test/page.tsx`:
```tsx
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').limit(1)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Supabase Connection Test</h1>
      {error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : (
        <p className="text-green-500">✓ Connected successfully!</p>
      )}
    </div>
  )
}
```

Visit [http://localhost:3000/test](http://localhost:3000/test) to verify the connection.

## Step 8: Generate TypeScript Types (Optional but Recommended)

To get type-safe database queries:

1. Install the Supabase CLI (if not already installed)
2. Generate types:
```bash
supabase gen types typescript --project-id your-project-ref > types/database.types.ts
```

This will overwrite the placeholder types with actual database types.

## Troubleshooting

### "Invalid API key" error
- Double-check that you copied the **anon public** key (not the service role key)
- Make sure there are no extra spaces in your `.env.local` file

### Migration fails with "permission denied"
- Make sure you're running the migration as the project owner
- Check that your database password is correct

### Tables not visible in Table Editor
- Refresh the page
- Check the SQL Editor for error messages
- Verify the migration completed without errors

## Next Steps

Once your database is set up, you're ready for **Phase 3: Core Features**:
- Authentication flows (signup, login, logout)
- Identity Core creation form
- Role management UI
- Task execution engine

See the main [README.md](./README.md) for the full development roadmap.

## Database Schema Reference

For a detailed overview of the database schema, see the migration file:
- [supabase/migrations/20250101000000_initial_schema.sql](./supabase/migrations/20250101000000_initial_schema.sql)

For role template examples (to be implemented in the UI):
- [supabase/seed.sql](./supabase/seed.sql)
