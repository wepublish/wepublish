# Visual Regression Tool

Compares two commits of a we.publish medium by spinning both up side by side,
taking screenshots across several browsers/devices, and producing an HTML diff report.

## How it works

For a given medium, baseline commit, and current commit, the tool runs the following in parallel:

1. **Worktrees** — checks out both commits into sibling worktrees (`../wp-baseline`, `../wp-current`) and runs `npm install` in each.
2. **Databases** — downloads the latest medium dump from `files.wepublish.cloud` (cached via `ETag` / `Last-Modified`) and seeds two throwaway Postgres containers, one per commit. The containers are created from scratch on every run and torn down at the end, so each run starts from a clean, identical state.
3. **Screenshot image** — builds the medium-specific Docker image containing the playwright scripts, which are executed on headless browsers.

Once the worktrees and databases are ready, it runs Prisma migrations and starts the API + UI for each commit in parallel.
When both stacks are up, the screenshot container visits each configured page on both stacks and compares the screenshots with [honeydiff](https://github.com/vizzly-testing/honeydiff).
It always writes an HTML report to `<medium>/artifacts/`; the raw `baseline_*.png`, `current_*.png`, and `diff_*.png` files are only written for pages where a visual difference was detected.

## Setup

Requires Node.js and a running Docker daemon.

Copy `.env.example` to `.env` and fill in:

- `USERNAME` / `PASSWORD` — credentials for `files.wepublish.cloud` (used to fetch the medium's DB dump).
- `JWT_PUBLIC_KEY` / `JWT_PRIVATE_KEY` — keys the API needs at startup.

## Running

Invoke `test.js` with the medium and the two commits you want to compare:

- `MEDIUM` — the medium to test (must match a `<medium>-scripts/` folder, e.g. `hauptstadt`, `tsri`).
- `BASELINE_COMMIT_HASH` — the reference commit assumed to be correct.
- `CURRENT_COMMIT_HASH` — the commit under test.

Example:

```sh
MEDIUM="hauptstadt" \
  BASELINE_COMMIT_HASH="a8224dcb3ebf65eb91afc8bbe8d70318548b0553" \
  CURRENT_COMMIT_HASH="58ab932d839710406b5dc8b7978607f6eda91b1d" \
  node test.js
```

See `example-hauptstadt.sh` or `example-tsri.sh` for a ready-to-run invocation. The report ends up at `<medium>/artifacts/report.html`.

## Adding a new medium

A medium is defined by a `<medium>-scripts/` folder containing a `Dockerfile` and a screenshot script. The Docker image is built automatically and run with these environment variables:

- `ARTIFACTS_PATH` — host path where artifacts are written.
- `BASELINE_COMMIT` / `CURRENT_COMMIT` — the two commits being compared (used in the report).
- `BASELINE_PORT` / `CURRENT_PORT` — the two stacks are reachable at `localhost:<port>`.

Shared helpers for taking full-page screenshots (`take-screenshot.js`), comparing them (`compare-screenshot.js`), and rendering the HTML report (`report-results.js`) live in `shared-scripts/`. Use `hauptstadt-scripts/` or `tsri-scripts/` as templates.
The medium-specific script only needs to declare the list of pages to visit (see `hauptstadt-scripts`) and wire the shared helpers together.
More involved scripts are also possible.

## Tools used
- [Playwright](https://playwright.dev/) for browser automation and screenshots. Devices come from Playwright's [built-in descriptors](https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json) (defaults are Desktop Chrome/Firefox/Safari, Pixel 10, iPhone 16).
- [honeydiff](https://github.com/vizzly-testing/honeydiff) for image comparison — chosen for its speed and customizability; see the [benchmark](https://vizzly.dev/blog/honeydiff-vs-odiff-pixelmatch-benchmarks/).
