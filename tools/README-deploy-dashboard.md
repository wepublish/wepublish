# Deploy overview dashboard

A static HTML page hosted on GitHub Pages showing which commit (+ branch + author + time) is currently deployed to production for every wepublish app.

## How it works

1. **Recording.** When the production deploy workflow finishes for a project (`deploy_*` tag), the `record-deployment` job in [`.github/workflows/on-tag-deploy-production.yml`](../.github/workflows/on-tag-deploy-production.yml) calls the GitHub Deployments API to register the deploy under an environment named `production-<project>` (e.g. `production-reflekt`). The status is set to `success` if both backend and website jobs succeeded, otherwise `failure`.

2. **Publishing.** [`.github/workflows/deploy-dashboard.yml`](../.github/workflows/deploy-dashboard.yml) is triggered:
   - on every `deployment_status` event (so the dashboard refreshes seconds after a successful deploy)
   - on a 30-minute cron fallback
   - manually via `workflow_dispatch`

   It runs [`tools/build-deploy-dashboard.mjs`](./build-deploy-dashboard.mjs), which:
   - lists all environments whose name starts with `production-`
   - fetches the latest deployment per environment plus its status and commit details
   - writes `dist/index.html`
   - publishes `dist/` to GitHub Pages

## One-time setup per repo

1. **Enable Pages.** Settings → Pages → "Build and deployment" source = "GitHub Actions".
2. **Allow Pages workflow.** Settings → Actions → General → "Workflow permissions": ensure the workflow has read/write or at least allow `pages: write` via per-job permissions (already set in the workflow).
3. **First deploy populates the dashboard.** No environments need to be pre-created — calling `createDeployment` with a new environment name auto-creates the environment.

## Local preview

```bash
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=wepublish/wepublish \
  node tools/build-deploy-dashboard.mjs

open dist/index.html
```

## Customisation

- **Environment prefix.** Override with `ENV_PREFIX=staging-` to render a staging board against the same code.
- **Styling.** The HTML is generated inline in `build-deploy-dashboard.mjs`; tweak the `<style>` block or the `renderCard` template.
- **Trigger pickiness.** The `deployment_status` trigger fires for *any* deployment in the repo (including GitHub Pages' own deploys); the build is idempotent and cheap so this is fine, but if it becomes noisy, gate the job on `if: github.event.deployment_status.environment != 'github-pages'`.
