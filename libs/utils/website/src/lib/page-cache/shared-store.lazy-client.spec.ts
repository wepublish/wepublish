// @vitest-environment node
import { execFileSync } from 'child_process';
import { join } from 'path';

const STORE = join(__dirname, 'shared-store.js');

const inFreshNode = (env: Record<string, string>) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        '-e',
        `
          const { createSharedStore } = require(${JSON.stringify(STORE)});
          const store = createSharedStore({
            env: ${JSON.stringify(env)},
            buildId: 'build',
            logger: { error() {} },
          });
          Promise.resolve(store?.getVersion()).then(() => {
            const redisLoaded = Object.keys(require.cache).some(file =>
              file.endsWith('verbatim-string.js')
            );
            console.log(JSON.stringify({ redisLoaded }));
          });
        `,
      ],
      { encoding: 'utf8', timeout: 20000 }
    )
  );

describe('shared page store', () => {
  it('does not load the Redis client without REDIS_URL', () => {
    expect(inFreshNode({})).toEqual({ redisLoaded: false });
  });
});
