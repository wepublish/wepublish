// Entry point of `pnpm run e2e`: takes the target flags, passes the rest to
// `playwright test`.
//
//   pnpm run e2e -- --app tsri --environment staging --project editor --grep @smoke
//
// --app, --environment and --review-slot set E2E_APP, E2E_ENV and E2E_REVIEW_SLOT
// (see support/targets.ts); flags win over env vars already set. Not `--env`:
// Nx's run-commands owns that option.
import { spawnSync } from 'node:child_process';

const targetFlags = {
  '--app': 'E2E_APP',
  '--environment': 'E2E_ENV',
  '--review-slot': 'E2E_REVIEW_SLOT',
};

const env = { ...process.env };
const playwrightArgs = [];
const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  const [flag, inlineValue] = args[i].split(/=(.*)/s);
  const variable = targetFlags[flag];

  if (!variable) {
    playwrightArgs.push(args[i]);
    continue;
  }

  const value = inlineValue ?? args[++i];

  if (!value || value.startsWith('--')) {
    console.error(`${flag} needs a value, e.g. ${flag}=tsri`);
    process.exit(1);
  }

  env[variable] = value;
}

const run = (command, commandArgs) => {
  const { status } = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    env,
  });

  if (status !== 0) {
    process.exit(status ?? 1);
  }
};

// Tells playwright.config.ts which local dev servers it needs to start.
env.E2E_PROJECTS = playwrightArgs
  .flatMap((arg, i) =>
    arg === '--project' ? [playwrightArgs[i + 1]]
    : arg.startsWith('--project=') ? [arg.slice('--project='.length)]
    : []
  )
  .join(',');

run('pnpm', ['exec', 'bddgen']);
run('pnpm', ['exec', 'playwright', 'test', ...playwrightArgs]);
