Database migration workflow for Supabase.

## Creating a New Migration

1. Create a new migration file:
```bash
npx supabase migration new [migration_name]
```
Example: `npx supabase migration new add_user_preferences`

2. Edit the generated SQL file in `supabase/migrations/`

3. Apply the migration locally:
```bash
npx supabase db reset  # Resets and applies all migrations
```

Or to apply only new migrations:
```bash
npx supabase migration up
```

## Testing Migrations

1. Reset local database:
```bash
npx supabase db reset
```

2. Verify schema changes in Supabase Studio:
http://localhost:54323

3. Generate new TypeScript types:
```bash
npx supabase gen types typescript --local > types/database.types.ts
```

## Deploying Migrations

### To Remote Supabase Project:

1. Link your project (first time only):
```bash
npx supabase link --project-ref [your-project-ref]
```

2. Push migrations:
```bash
npx supabase db push
```

3. Generate types from remote:
```bash
npx supabase gen types typescript --project-id [project-id] > types/database.types.ts
```

## Common Migration Patterns

### Adding a Column:
```sql
ALTER TABLE table_name
ADD COLUMN column_name column_type;
```

### Creating an Index:
```sql
CREATE INDEX idx_name ON table_name(column_name);
```

### Adding RLS Policy:
```sql
CREATE POLICY "policy_name"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

### Creating a New Table:
```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

## Rollback

If a migration fails, you can rollback:
```bash
npx supabase db reset  # Back to last known good state
```

## Best Practices

- ✅ Test migrations locally first
- ✅ Always include RLS policies for new tables
- ✅ Use transactions for complex migrations
- ✅ Include descriptive migration names
- ✅ Add comments in SQL for complex logic
- ⚠️ Be careful with data-destructive operations
