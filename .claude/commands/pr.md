Create a pull request from current work. Follow these steps:

1. **Check branch**: If on `master`, ask for a branch name and create one with `git checkout -b <name>`.
2. **Run /check**: Run lint, typecheck, and build. Stop if any fail.
3. **Stage and commit**: Stage changed files, write a clear conventional commit message.
4. **Push**: `git push -u origin <branch-name>`
5. **Create PR**: Use `gh pr create` with:
   - A concise title (under 70 chars)
   - A body summarizing the changes and test plan
6. **Report**: Share the PR URL.
