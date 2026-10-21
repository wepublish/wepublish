// Entry point of `pnpm run e2e`: takes the targets and target flags, passes the
// rest to `playwright test`.
//
//   pnpm run e2e tsri                       # tsri website (local)
//   pnpm run e2e editor                     # editor only
//   pnpm run e2e tsri,editor --environment staging --grep @smoke
//   pnpm run e2e tsri,bajour                # one run per tenant, in turn
//
// Leading comma-separated words are targets: `editor` selects the editor
// project, any other word an `apps/<name>` tenant (E2E_APP) and its website
// project. Without them, both projects of E2E_APP run (see support/targets.ts).
// Anything else, from the first word that is not a target, is a flag or a
// Playwright file filter.
//
// --app, --environment and --review-slot set E2E_APP, E2E_ENV and E2E_REVIEW_SLOT;
// flags win over env vars already set. Not `--env`: Nx's run-commands owns
// that option.
import { spawnSync } from 'node:child_process';
import { e2eDatabaseUrl, websiteApps } from './support/targets';

const targetFlags: Record<string, string> = {
  '--app': 'E2E_APP',
  '--environment': 'E2E_ENV',
  '--review-slot': 'E2E_REVIEW_SLOT',
};

const apps = websiteApps();
const isTargets = (arg: string) =>
  !arg.startsWith('-') &&
  arg.split(',').every(word => word === 'editor' || apps.includes(word));

const env = { ...process.env };
const playwrightArgs: string[] = [];
const targets: string[] = [];
const args = process.argv.slice(2);

while (args.length && isTargets(args[0])) {
  targets.push(...args.shift()!.split(','));
}

if (args[0] && !args[0].startsWith('-')) {
  console.log(
    `[e2e] "${args[0]}" is not a tenant app (${apps.join(', ')}): passing it to Playwright as a file filter.`
  );
}

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

const tenants = [...new Set(targets.filter(target => target !== 'editor'))];
const projectArgs: string[] = [];

if (targets.length) {
  if (tenants.length) {
    projectArgs.push('--project', 'website');
  }

  if (targets.includes('editor')) {
    projectArgs.push('--project', 'editor');
  }
}

const run = (
  command: string,
  commandArgs: string[],
  runEnv: NodeJS.ProcessEnv,
  cwd?: string
): number =>
  spawnSync(command, commandArgs, { stdio: 'inherit', env: runEnv, cwd })
    .status ?? 1;

// Prisma finds its config (prisma.config.ts) only from the repo root.
const repoRoot = '..';

const playwright = (runEnv: NodeJS.ProcessEnv, extraArgs: string[]) => {
  const runArgs = [...extraArgs, ...playwrightArgs];

  // Tells playwright.config.ts which local dev servers it needs to start.
  runEnv.E2E_PROJECTS = runArgs
    .flatMap((arg, i) =>
      arg === '--project' ? [runArgs[i + 1]]
      : arg.startsWith('--project=') ? [arg.slice('--project='.length)]
      : []
    )
    .join(',');

  return run('pnpm', ['exec', 'playwright', 'test', ...runArgs], runEnv);
};

// Local runs start their own API on the e2e database (support/targets.ts,
// `localStack`): migrate it first, which creates it on the first run, and seed
// it whenever migrations were applied (the seed skips what already exists).
const prepareDatabase = () => {
  const databaseUrl = e2eDatabaseUrl(env);
  const dbEnv = {
    ...env,
    DATABASE_URL: databaseUrl,
    DIRECT_DATABASE_URL: databaseUrl,
  };

  console.log(`[e2e] migrating ${new URL(databaseUrl).pathname.slice(1)}`);
  const migrate = spawnSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: dbEnv,
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (migrate.status !== 0) {
    process.stderr.write(migrate.stdout + migrate.stderr);
    process.exit(migrate.status ?? 1);
  }

  if (migrate.stdout.includes('No pending migrations')) {
    return;
  }

  console.log('[e2e] seeding');
  // The seed boots a media server: keep it off dev's port 4100.
  const seeded = run(
    'pnpm',
    ['exec', 'prisma', 'db', 'seed'],
    { ...dbEnv, PORT: '4110', MEDIA_SERVER_URL: 'http://localhost:4110' },
    repoRoot
  );

  if (seeded !== 0) {
    process.exit(seeded);
  }
};

// The seeded SMTP provider sends to localhost:1025: start mailpit there (a
// no-op when it runs) and read mails through its API, so @mail runs locally
// without setup. A failure (port taken by another mailpit) is only a warning.
const startMailpit = () => {
  const started = spawnSync(
    'docker',
    ['compose', 'up', '--detach', '--wait', 'mailpit'],
    { cwd: repoRoot, encoding: 'utf8' }
  );

  if (started.status !== 0) {
    console.warn(
      `[e2e] could not start mailpit: ${(started.stderr || started.error?.message || '').trim()}`
    );
  }

  env.MAILPIT_URL ||= 'http://localhost:8025';
};

if ((env.E2E_ENV || 'local') === 'local' && !env.E2E_API_URL) {
  prepareDatabase();
  startMailpit();
}

// bddgen loads playwright.config.ts too: give it the first tenant, so it does
// not resolve (and log) the default one.
const generated = run(
  'pnpm',
  ['exec', 'bddgen'],
  { ...env, ...(tenants[0] && { E2E_APP: tenants[0] }) }
);

if (generated !== 0) {
  process.exit(generated);
}

if (tenants.length <= 1) {
  process.exit(
    playwright({ ...env, ...(tenants[0] && { E2E_APP: tenants[0] }) }, projectArgs)
  );
}

const failed = tenants.filter(
  tenant => playwright({ ...env, E2E_APP: tenant }, projectArgs) !== 0
);

if (failed.length) {
  console.error(`[e2e] failed: ${failed.join(', ')}`);
  process.exit(1);
}
