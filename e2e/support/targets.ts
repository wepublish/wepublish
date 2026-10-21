import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Which deployment the suite runs against. `E2E_APP` picks the tenant (an
 * `apps/<name>` Next.js app), `E2E_ENV` the environment; the URLs of its
 * website, editor and API follow from the same conventions the deploy
 * workflows use. Explicit URLs always win.
 *
 * Overrides are `E2E_`-prefixed (except the historical `BASE_URL`) because
 * `pnpm run e2e` goes through Nx, which loads the root `.env` — and that
 * `.env` already sets `API_URL` / `EDITOR_URL` for local development.
 */

export const environments = [
  'local',
  'review',
  'staging',
  'production',
] as const;
export type Environment = (typeof environments)[number];

export type Target = {
  app: string;
  environment: Environment;
  websiteUrl: string;
  /** Unset when the convention does not define one: then `@editor` scenarios fail with a hint. */
  editorUrl?: string;
  apiUrl?: string;
};

const appsDir = join(__dirname, '..', '..', 'apps');

const readJson = (path: string) =>
  existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined;

/** Next.js apps that are not tenant websites and are never E2E targets. */
const notTenants = ['wepublish-site'];

/** Tenant websites: every app served by `@nx/next:server`. */
export function websiteApps() {
  return readdirSync(appsDir).filter(
    app =>
      !notTenants.includes(app) &&
      readJson(join(appsDir, app, 'project.json'))?.targets?.serve
        ?.executor === '@nx/next:server'
  );
}

/**
 * The local stack E2E starts for itself: its own ports, database and cache, so
 * a run never reuses your dev servers or writes into your dev database (which
 * may also be migrated from another branch).
 */
export const localStack = {
  apiPort: 4010,
  editorPort: 3010,
  /** Added to the tenant's serve port: tsri 4204 → 5204. */
  websitePortOffset: 1000,
  database: 'wepublish_e2e',
  /** Dragonfly database number, apart from dev's 0. */
  redisDatabase: 1,
};

const defaultDatabaseUrl =
  'postgresql://postgres:postgres@localhost:5432/wepublish?schema=public';

/** `E2E_DATABASE_URL`, else `DATABASE_URL` (from `.env`) with the e2e database. */
export function e2eDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  if (env.E2E_DATABASE_URL) {
    return env.E2E_DATABASE_URL;
  }

  const url = new URL(env.DATABASE_URL || defaultDatabaseUrl);
  url.pathname = `/${localStack.database}`;

  return url.toString();
}

const trimSlash = (url?: string) => url?.replace(/\/+$/, '') || undefined;

export function resolveTarget(env: NodeJS.ProcessEnv = process.env): Target {
  const app = env.E2E_APP || 'website-example';
  const environment = (env.E2E_ENV || 'local') as Environment;

  if (!environments.includes(environment)) {
    throw new Error(
      `E2E_ENV must be one of ${environments.join(', ')}, got "${environment}".`
    );
  }

  const apps = websiteApps();

  if (!apps.includes(app)) {
    throw new Error(
      `E2E_APP "${app}" is not a website app. Known: ${apps.join(', ')}.`
    );
  }

  const defaults = conventionUrls(app, environment, env);

  return {
    app,
    environment,
    websiteUrl: trimSlash(env.BASE_URL) ?? defaults.websiteUrl,
    editorUrl: trimSlash(env.E2E_EDITOR_URL) ?? defaults.editorUrl,
    apiUrl: trimSlash(env.E2E_API_URL) ?? defaults.apiUrl,
  };
}

function conventionUrls(
  app: string,
  environment: Environment,
  env: NodeJS.ProcessEnv
): Omit<Target, 'app' | 'environment'> {
  const deployment = readJson(join(appsDir, app, 'deployment.config.json'));
  const customDomain = (stage: string): string | undefined =>
    deployment?.website?.[stage]?.custom_domain;

  switch (environment) {
    case 'local': {
      // The tenant's serve port from its project.json (4200 if none), shifted.
      const port =
        (readJson(join(appsDir, app, 'project.json'))?.targets?.serve?.options
          ?.port ?? 4200) + localStack.websitePortOffset;

      return {
        websiteUrl: `http://localhost:${port}`,
        editorUrl: `http://localhost:${localStack.editorPort}`,
        apiUrl: `http://localhost:${localStack.apiPort}`,
      };
    }

    // Label `review_<slot>_<app>` deploys one app into a numbered slot
    // (on-pr-label-deploy-review.yml).
    case 'review': {
      const slot = env.E2E_REVIEW_SLOT;

      if (!slot) {
        throw new Error(
          'E2E_ENV=review needs E2E_REVIEW_SLOT (the N of the review_<N>_<app> label).'
        );
      }

      return {
        websiteUrl: `https://review${slot}.wepublish.works`,
        editorUrl: `https://editor-review${slot}.wepublish.works`,
        apiUrl: `https://api-review${slot}.wepublish.works`,
      };
    }

    // on-master-publish-master-artifacts.yml / on-demand-publish-docker-image-website.yml
    case 'staging':
      return {
        websiteUrl: customDomain('staging') ?? `https://${app}.wepublish.works`,
        editorUrl: `https://editor-${app}.wepublish.works`,
        apiUrl: `https://api-${app}.wepublish.works`,
      };

    // on-tag-deploy-production.yml. No editor convention in the workflows:
    // pass E2E_EDITOR_URL.
    case 'production':
      return {
        websiteUrl:
          customDomain('production') ?? `https://${app}.wepublish.cloud`,
        apiUrl: `https://api-${app}.wepublish.cloud`,
      };
  }
}

type WebServer = {
  name: string;
  command: string;
  url: string;
  timeout: number;
  env: Record<string, string>;
};

const portOf = (url: string) => new URL(url).port;

/**
 * Local dev servers the run needs, for Playwright's `webServer`: reused when
 * already up, otherwise started and stopped after the run. Only for
 * `E2E_ENV=local`, only for the selected projects (`E2E_PROJECTS`, set by
 * run.ts from `--project`), and never for a URL that was overridden — that
 * server is yours to run. They form the `localStack`: website and editor talk
 * to its API, the API to its database. Docker services (database, mailpit, …)
 * are not started; see the local-stack recipe in e2e/README.md.
 */
export function localDevServers(
  target: Target,
  env: NodeJS.ProcessEnv = process.env
): WebServer[] {
  if (target.environment !== 'local') {
    return [];
  }

  const projects = env.E2E_PROJECTS?.split(',').filter(Boolean);
  const selected = (project: string) =>
    !projects?.length || projects.includes(project);
  const servers: WebServer[] = [];
  const apiEnv = { API_URL: target.apiUrl ?? '', API_URL_INTERNAL: '' };

  if (selected('website') && !env.BASE_URL) {
    servers.push({
      name: target.app,
      command: `pnpm nx serve ${target.app} --port=${portOf(target.websiteUrl)}`,
      url: target.websiteUrl,
      timeout: 180_000,
      env: apiEnv,
    });
  }

  if (selected('editor') && !env.E2E_EDITOR_URL && target.editorUrl) {
    servers.push({
      name: 'editor',
      command: `pnpm nx serve editor --port=${portOf(target.editorUrl)}`,
      url: `${target.editorUrl}/login`,
      timeout: 180_000,
      env: apiEnv,
    });
  }

  // Both apps talk to the API.
  if (servers.length && !env.E2E_API_URL && target.apiUrl) {
    const databaseUrl = e2eDatabaseUrl(env);
    const redisUrl = env.REDIS_URL ? new URL(env.REDIS_URL) : undefined;

    if (redisUrl) {
      redisUrl.pathname = `/${localStack.redisDatabase}`;
    }

    servers.unshift({
      name: 'api-example',
      command: 'pnpm nx serve api-example --inspect=false',
      url: `${target.apiUrl}/health/readinessProbe`,
      timeout: 300_000,
      env: {
        PORT: portOf(target.apiUrl),
        DATABASE_URL: databaseUrl,
        DIRECT_DATABASE_URL: databaseUrl,
        HOST_URL: target.apiUrl,
        WEBSITE_URL: target.websiteUrl,
        ...(target.editorUrl && { EDITOR_URL: target.editorUrl }),
        ...(redisUrl && { REDIS_URL: redisUrl.toString() }),
      },
    });
  }

  return servers;
}

export const describeTarget = (target: Target) =>
  `${target.app} (${target.environment}) · website ${target.websiteUrl} · ` +
  `editor ${target.editorUrl ?? '—'} · api ${target.apiUrl ?? '—'}`;
