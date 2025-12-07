Deployment checklist for RoleplayAI Teams.

## Pre-Deployment Checklist

### 1. Code Quality
- [ ] TypeScript: `npx tsc --noEmit` (no errors)
- [ ] Linting: `npm run lint` (no errors)
- [ ] Build: `npm run build` (successful)
- [ ] All tests passing

### 2. Environment Variables
Ensure all required variables are set in Vercel:

#### Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### AI Providers (system fallback keys)
- [ ] `OPENAI_API_KEY`
- [ ] `ANTHROPIC_API_KEY`

#### Optional
- [ ] `NEXT_PUBLIC_APP_URL` (for redirects)

### 3. Database
- [ ] All migrations applied: `npx supabase db push`
- [ ] RLS policies tested and verified
- [ ] Generated types are up to date
- [ ] Indexes created for frequently queried columns

### 4. Security
- [ ] API routes have auth checks
- [ ] RLS enabled on all tables
- [ ] Sensitive data not logged
- [ ] CORS configured correctly
- [ ] Rate limiting considered

### 5. Performance
- [ ] Edge runtime used for streaming routes
- [ ] Database queries optimized (avoid N+1)
- [ ] Images optimized (use Next.js Image)
- [ ] Bundle size checked: `npm run build` (check output)

## Deployment Steps

### Deploy to Vercel

1. **First-time setup:**
```bash
npx vercel login
npx vercel link
```

2. **Set environment variables:**
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add OPENAI_API_KEY
npx vercel env add ANTHROPIC_API_KEY
```

3. **Deploy:**
```bash
npx vercel --prod
```

Or simply push to main branch if using Git integration.

### Database Migrations

1. **Push migrations to production:**
```bash
npx supabase link --project-ref [your-project-ref]
npx supabase db push
```

2. **Verify in Supabase Dashboard:**
- Check tables are created
- Verify RLS policies active
- Test queries in SQL editor

## Post-Deployment Verification

### 1. Smoke Tests
- [ ] Homepage loads
- [ ] Login/signup flows work
- [ ] Basic chat endpoint responds: `curl https://your-domain.com/api/chat`
- [ ] Role-based chat works for authenticated users
- [ ] Database queries execute successfully

### 2. Monitoring
- [ ] Check Vercel dashboard for errors
- [ ] Monitor Supabase logs for database errors
- [ ] Verify AI API usage in OpenAI/Anthropic dashboards

### 3. Performance
- [ ] Lighthouse score (target: 90+)
- [ ] API response times (<1s for non-streaming)
- [ ] First Contentful Paint (<1.5s)

## Rollback Procedure

If deployment has critical issues:

1. **Rollback via Vercel:**
   - Go to Vercel Dashboard
   - Select previous deployment
   - Click "Promote to Production"

2. **Rollback database:**
   - If migration caused issues, manually revert in SQL editor
   - Or restore from Supabase backup (Project Settings > Database > Backups)

## Common Deployment Issues

### Build Fails
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all dependencies installed
- Check for missing environment variables at build time

### Runtime Errors
- Verify environment variables in Vercel
- Check Supabase connection strings
- Verify API keys are valid

### Database Errors
- Check RLS policies allow access
- Verify user authentication flow
- Check foreign key constraints

### AI Streaming Issues
- Ensure Edge runtime is configured
- Verify API keys are valid
- Check CORS headers if calling from different domain

## Next Steps After Deployment

- [ ] Set up monitoring (Sentry, LogRocket, etc.)
- [ ] Configure custom domain
- [ ] Set up CI/CD pipeline
- [ ] Add error tracking
- [ ] Configure analytics
