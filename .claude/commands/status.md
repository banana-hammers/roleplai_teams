Show a quick orientation of the current project state:

1. **Git status**: Current branch, uncommitted changes, ahead/behind remote
2. **Recent commits**: Last 5 commits with `git log --oneline -5`
3. **Quick health check**: Run `npm run lint` and `npx tsc --noEmit` and report pass/fail (don't show full output unless there are errors)

Format the output clearly so it's easy to scan at a glance.
