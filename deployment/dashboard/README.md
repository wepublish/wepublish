# Deploy overview dashboard

A static HTML page showing which commit (+ branch + author + time) is currently deployed to production for every wepublish app. It is served as a sub-path of the repo's GitHub Pages site: **`<pages-url>/deploy/`** (e.g. `https://wepublish.github.io/wepublish/deploy/`).

## How it works

1. **Source of truth.** Production deploys are triggered by git tags of the form `deploy_<project>_<YYYYMMDDHHMM>`, which run [`.github/workflows/on-tag-deploy-production.yml`](../../.github/workflows/on-tag-deploy-production.yml). Each run carries the project (via the tag in `head_branch`), the commit, the actor, the timestamp and the run status — so the **Actions workflow-runs API** is the source of truth, not the (long-abandoned) GitHub Deployments API.

2. **Publishing.** [`.github/workflows/deploy-dashboard.yml`](../../.github/workflows/deploy-dashboard.yml) is triggered:
   - on every `deploy_*` tag push (so the dashboard refreshes the moment a deploy is tagged — also when the branch label is captured), and
   - manually via `workflow_dispatch`.

   It runs [`build-deploy-dashboard.mjs`](./build-deploy-dashboard.mjs), which:
   - pages through the production workflow's runs and keeps the latest run per project
   - maps each run's status/conclusion to ✓ success / ✕ failure / … in-progress
   - resolves the source branch per deploy commit and persists it (see below)
   - writes `docs/deploy/index.html`

   The workflow then commits `docs/deploy/` to the `development` branch (with `[skip ci]`). The repo's **legacy** GitHub Pages site serves the `/docs` folder, so the page appears at `<pages-url>/deploy/`. The existing documentation under `/docs` is untouched — `docs/deploy/index.html` is just another file in that folder, rewritten only on production deploys.

   > Because a tag push runs the workflow as it exists in the *tagged commit*, a deploy only self-triggers once its commit contains this workflow (immediately for deploys off `development`; for `master`/feature branches once they pick up the merge). Since the build always reads the latest run per project, a missed trigger is corrected by the next deploy that fires.

### Branch persistence

The source branch is only resolvable while the deploy commit is still the **tip** of its branch (`branches-where-head`). Once work continues on that branch, the commit is buried and the branch would otherwise be lost on the next rebuild. To keep it, each page embeds a `tag → branch` map as a JSON island (`<script id="deploy-branch-store">`). On each build the previously-committed `docs/deploy/index.html` is read back from disk, and a branch is only re-resolved for deploy tags not already in the store. Since a tag is immutable until the next deploy, the branch label "freezes" with the deployment and only changes when the app is deployed again.

## One-time setup per repo

No repo-settings changes are needed beyond the existing legacy Pages config (Settings → Pages → "Deploy from a branch" → `development` / `/docs`). The workflow needs `contents: write` (already set), and the `development` branch must allow the Actions bot to push (the current ruleset only blocks deletions and non-fast-forward pushes, which it satisfies).

## Local preview

```bash
GITHUB_TOKEN=$(gh auth token) GITHUB_REPOSITORY=wepublish/wepublish \
  OUT_DIR=/tmp/dash node deployment/dashboard/build-deploy-dashboard.mjs

open /tmp/dash/index.html
```

(Use a throwaway `OUT_DIR` locally so you don't write into the repo's `docs/`.)

## Customisation

- **Workflow / tag.** Override `WORKFLOW_FILE` (default `on-tag-deploy-production.yml`) or `TAG_PREFIX` (default `deploy_`) to point at a different deploy pipeline.
- **Output location.** `OUT_DIR` (default `docs/deploy`) sets where `index.html` is written; the previous file there is also the branch-store source read back on the next build.
- **Styling.** The HTML is generated inline in `build-deploy-dashboard.mjs`; tweak the `<style>` block or the `renderCard` template.
