# Deploy overview dashboard

A static HTML page hosted on GitHub Pages showing which commit (+ branch + author + time) is currently deployed to production for every wepublish app.

## How it works

1. **Source of truth.** Production deploys are triggered by git tags of the form `deploy_<project>_<YYYYMMDDHHMM>`, which run [`.github/workflows/on-tag-deploy-production.yml`](../../.github/workflows/on-tag-deploy-production.yml). Each run carries the project (via the tag in `head_branch`), the commit, the actor, the timestamp and the run status — so the **Actions workflow-runs API** is the source of truth, not the (long-abandoned) GitHub Deployments API.

2. **Publishing.** [`.github/workflows/deploy-dashboard.yml`](../../.github/workflows/deploy-dashboard.yml) is triggered:
   - on every `deploy_*` tag push (so the dashboard refreshes the moment a deploy is tagged — also when the branch label is captured)
   - on a 30-minute cron fallback
   - manually via `workflow_dispatch`

   It runs [`build-deploy-dashboard.mjs`](./build-deploy-dashboard.mjs), which:
   - pages through the production workflow's runs and keeps the latest run per project
   - maps each run's status/conclusion to ✓ success / ✕ failure / … in-progress
   - resolves the source branch per deploy commit and persists it (see below)
   - writes `dist/index.html`
   - publishes `dist/` to GitHub Pages

### Branch persistence

The source branch is only resolvable while the deploy commit is still the **tip** of its branch (`branches-where-head`). Once work continues on that branch, the commit is buried and the branch would otherwise be lost on the next rebuild. To keep it, each page embeds a `tag → branch` map as a JSON island (`<script id="deploy-branch-store">`). On each build the previously-published page is read back, and a branch is only re-resolved for deploy tags not already in the store. Since a tag is immutable until the next deploy, the branch label "freezes" with the deployment and only changes when the app is deployed again.

## One-time setup per repo

1. **Enable Pages.** Settings → Pages → "Build and deployment" source = "GitHub Actions".
2. **Allow Pages workflow.** Settings → Actions → General → "Workflow permissions": ensure the workflow has `pages: write` (already set per-job in the workflow).

## Local preview

```bash
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=wepublish/wepublish \
  node deployment/dashboard/build-deploy-dashboard.mjs

open dist/index.html
```

## Customisation

- **Workflow / tag.** Override `WORKFLOW_FILE` (default `on-tag-deploy-production.yml`) or `TAG_PREFIX` (default `deploy_`) to point at a different deploy pipeline.
- **Branch store source.** `DASHBOARD_URL` overrides the published-page URL the branch store is read back from (defaults to the repo's GitHub Pages URL); handy for local testing.
- **Styling.** The HTML is generated inline in `build-deploy-dashboard.mjs`; tweak the `<style>` block or the `renderCard` template.
