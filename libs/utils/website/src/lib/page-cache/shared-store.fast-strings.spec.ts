// @vitest-environment node
import { execFileSync } from 'child_process';
import { join } from 'path';

const STORE = join(__dirname, 'shared-store.js');

const inFreshNode = (env: Record<string, string>) =>
  JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--allow-natives-syntax',
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
            console.log(JSON.stringify({
              redisLoaded,
              fastStrings: %HasFastProperties(String.prototype),
            }));
          });
        `,
      ],
      { encoding: 'utf8', timeout: 20000 }
    )
  );

describe('shared page store and String.prototype', () => {
  it('keeps string methods fast after loading the Redis client, which subclasses String', () => {
    expect(
      inFreshNode({
        REDIS_URL: 'redis://127.0.0.1:1',
        REDIS_KEY_PREFIX: 'test',
      })
    ).toEqual({ redisLoaded: true, fastStrings: true });
  });

  it('does not load the Redis client without REDIS_URL', () => {
    expect(inFreshNode({})).toEqual({
      redisLoaded: false,
      fastStrings: true,
    });
  });
});
