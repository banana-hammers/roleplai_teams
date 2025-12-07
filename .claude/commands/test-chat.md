Quick guide to test chat functionality in the application.

## Testing Basic Chat

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to http://localhost:3000/chat

3. Test both OpenAI and Anthropic tabs

4. Verify streaming works correctly

## Testing Role-Based Chat

### Prerequisites:
1. Supabase local dev running (`npx supabase start`)
2. User authenticated
3. Identity core created for the user
4. At least one role created

### Manual Testing via API:

```bash
# Test basic chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}],
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022"
  }'

# Test role-based chat (requires auth)
curl -X POST http://localhost:3000/api/roles/[ROLE_ID]/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: [AUTH_COOKIE]" \
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Verifying Identity Injection

When testing role-based chat, check that the system prompt includes:
- ✅ Identity core (voice, priorities, boundaries, decision rules)
- ✅ Role instructions
- ✅ Identity facets
- ✅ Context packs (if linked)

## Common Issues

- **401 Unauthorized**: User not authenticated
- **No API key**: Check `.env.local` has OPENAI_API_KEY or ANTHROPIC_API_KEY
- **RLS errors**: Verify user owns the role being accessed
