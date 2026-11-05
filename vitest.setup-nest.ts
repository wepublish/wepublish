import 'reflect-metadata';
import type { Server } from 'node:net';
import supertest from 'supertest';

// Anything reading a stored provider credential constructs SecretCrypto,
// which refuses to boot without a master key.
process.env['APP_SECRET_KEY'] ??= 'test-app-secret-key-0123456789';

// nx loads .env into every task; tests must not share the dev Dragonfly.
delete process.env['REDIS_URL'];
delete process.env['REDIS_KEY_PREFIX'];

// supertest starts a server that is not listening yet with `listen(0)`, which
// binds the IPv6 wildcard. On macOS that bind can land on a port another
// process already holds on 127.0.0.1 (VS Code's extension host keeps dozens),
// the request then reaches that process and never gets an answer, and a random
// test hits the 15 s timeout. A bind to 127.0.0.1 cannot collide, but a listen
// with a host is asynchronous, so the spec has to do it before the first
// request. See gotchas.md.
const { Test } = supertest as unknown as {
  Test: { prototype: Pick<supertest.Test, 'serverAddress'> };
};
const serverAddress = Test.prototype.serverAddress;

Test.prototype.serverAddress = function (
  this: Pick<supertest.Test, 'serverAddress'>,
  app: Server,
  path: string
) {
  if (!app.address()) {
    throw new Error(
      'supertest would start this server itself with listen(0), which can ' +
        'collide with another process on macOS. Start it on the loopback ' +
        "address first: `await app.listen(0, '127.0.0.1')` instead of " +
        '`app.init()` (see .claude/docs/gotchas.md).'
    );
  }

  return serverAddress.call(this, app, path);
};
