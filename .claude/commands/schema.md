Generate TypeScript types from the Supabase database schema.

Run this command when you've made changes to the database schema and need to update the TypeScript types.

## Steps:

1. Ensure Supabase CLI is installed
2. Make sure local Supabase is running (`npx supabase start`)
3. Run the type generation command:

```bash
npx supabase gen types typescript --local > types/database.types.ts
```

4. Verify the generated types look correct
5. Restart TypeScript server in VSCode (Cmd+Shift+P -> "TypeScript: Restart TS Server")

## Notes:
- The generated file will overwrite `types/database.types.ts`
- If using remote database instead of local, use `--project-id` flag
- Types are automatically used via `import type { Database } from '@/types/database.types'`
