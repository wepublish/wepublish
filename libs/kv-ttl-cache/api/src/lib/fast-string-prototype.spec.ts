import { execFileSync } from 'child_process';
import { join } from 'path';

const HELPER = join(__dirname, 'fast-string-prototype.ts');

const inFreshNode = (script: string) =>
  JSON.parse(
    execFileSync(process.execPath, ['--allow-natives-syntax', '-e', script], {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 20000,
    })
  );

describe('restoreFastStringPrototype', () => {
  it('makes string methods fast again after the Redis client subclassed String', () => {
    expect(
      inFreshNode(`
        require('@keyv/redis');
        const slowed = !%HasFastProperties(String.prototype);
        require(${JSON.stringify(HELPER)}).restoreFastStringPrototype();
        console.log(JSON.stringify({ slowed, fast: %HasFastProperties(String.prototype) }));
      `)
    ).toEqual({ slowed: true, fast: true });
  });

  it('keeps them fast while the client creates its String subclass instances', () => {
    expect(
      inFreshNode(`
        const { VerbatimString } = require('@redis/client/dist/lib/RESP/verbatim-string');
        require(${JSON.stringify(HELPER)}).restoreFastStringPrototype();
        for (let i = 0; i < 1000; i++) new VerbatimString('txt', 'value ' + i).toUpperCase();
        console.log(JSON.stringify({ fast: %HasFastProperties(String.prototype) }));
      `)
    ).toEqual({ fast: true });
  });

  it('runs when the Dragonfly store module loads', async () => {
    vi.resetModules();
    const restore = vi.fn();
    vi.doMock('./fast-string-prototype', () => ({
      restoreFastStringPrototype: restore,
    }));

    await import('./kv-ttl-cache-atomic-store');

    expect(restore).toHaveBeenCalledTimes(1);
    vi.doUnmock('./fast-string-prototype');
  });
});
