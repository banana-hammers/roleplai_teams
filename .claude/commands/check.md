Run quality checks before committing. Run all four in sequence — stop and report if any fail:

1. **Lint**: `npm run lint`
2. **Type check**: `npx tsc --noEmit`
3. **Test**: `npm test`
4. **Build**: `npm run build`

Report results clearly:
- If all pass: "All checks passed — safe to commit."
- If any fail: Show the error output and suggest fixes.
