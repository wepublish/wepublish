const { readFileSync } = require('node:fs');
const { join } = require('node:path');

/**
 * The TanStack website reads its configuration out of the *running* process —
 * `getPublicEnv()` serialises it into `window.PUBLIC_ENV`, and
 * `createStartPageCache()` scopes every Dragonfly key with `APP_RELEASE_ID`.
 *
 * `ENV` does not cross a `FROM`, so declaring these in the build stage alone
 * ships an image where they are empty. That is how production ran with the
 * shared page cache switched off: `createStartPageCache` has no build id to
 * scope keys with, so it quietly falls back to a pod-local LRU and nothing
 * logs anything. The Next stages never cared, because Next inlined the values
 * at build time.
 */
const DOCKERFILE = readFileSync(join(__dirname, '..', 'Dockerfile'), 'utf8');

/** The variables the server reads at runtime, not at build time. */
const RUNTIME_ENV = ['APP_RELEASE_ID', 'SSR_FETCH_TIMEOUT_MS'];

const stage = name => {
  const stages = DOCKERFILE.split(/^FROM /m);
  const found = stages.find(s => s.startsWith(`\${RUNTIME_IMAGE} AS ${name}\n`));

  if (!found) {
    throw new Error(`no runtime stage named ${name} in the Dockerfile`);
  }

  return found;
};

describe('the website-tanstack runtime stage', () => {
  const body = stage('website-tanstack');

  it.each(RUNTIME_ENV)('passes %s through to the running process', name => {
    expect(body).toContain(`ARG ${name}`);
    expect(body).toContain(`ENV ${name}=\${${name}}`);
  });

  it('is the stage the image actually runs', () => {
    expect(body).toContain('CMD ["node", "/wepublish/map-secrets.js"');
  });
});

describe('the publish workflow', () => {
  const workflow = readFileSync(
    join(__dirname, '..', '.github', 'workflows', 'on-demand-publish-docker-image-website.yml'),
    'utf8'
  );

  it.each(RUNTIME_ENV)('supplies %s as a build arg', name => {
    expect(workflow).toMatch(new RegExp(`^\\s*${name}=`, 'm'));
  });
});
