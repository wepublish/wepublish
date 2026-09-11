# Commit Rules

- Never commit yourself or add yourself as an author. Always let the user commit themselves
- When asked to resolve merge conflicts, never `git add` those files yourself. This rule does not apply when asked to rebase a branch on top of another.

## Stacked PRs

- If a commit/pull request gets too big, ask the user to split the current commit into multiple branches using GitHub stacked PRs: https://docs.github.com/en/pull-requests/how-tos/stacked-pull-requests
- Ideally pull requests are split by feature if multiple features are present. Those features could then be further split into seperate pull requests by api/editor/website.
- Give the user an outline of how and what you split the commit before doing so.
