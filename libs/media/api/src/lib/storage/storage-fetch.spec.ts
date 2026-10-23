import { afterEach, describe, expect, it } from 'vitest';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import { createStorageFetch, DEFAULT_MAX_CONNECTIONS } from './storage-fetch';

describe('createStorageFetch', () => {
  let server: Server | undefined;

  afterEach(async () => {
    const running = server;
    server = undefined;
    if (running) {
      running.closeAllConnections();
      await new Promise(resolve => running.close(resolve));
    }
  });

  it('opens at most DEFAULT_MAX_CONNECTIONS sockets to one origin', async () => {
    let sockets = 0;
    server = createServer((_req, res) => {
      // Hold every response briefly so the requests overlap.
      setTimeout(() => res.end('ok'), 20);
    });
    server.on('connection', () => sockets++);
    await new Promise<void>(resolve => server?.listen(0, '127.0.0.1', resolve));
    const { port } = server.address() as AddressInfo;

    const storageFetch = createStorageFetch();
    const bodies = await Promise.all(
      Array.from({ length: DEFAULT_MAX_CONNECTIONS + 10 }, () =>
        storageFetch(`http://127.0.0.1:${port}/`).then(res => res.text())
      )
    );

    expect(bodies).toHaveLength(DEFAULT_MAX_CONNECTIONS + 10);
    expect(sockets).toBe(DEFAULT_MAX_CONNECTIONS);
  });
});
