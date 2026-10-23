import { afterEach, describe, expect, it } from 'vitest';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import {
  createStorageFetch,
  DEFAULT_MAX_CONNECTIONS,
  DEFAULT_RESPONSE_TIMEOUT,
} from './storage-fetch';

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

  const listen = async (handler: Parameters<typeof createServer>[1]) => {
    server = createServer(handler);
    await new Promise<void>(resolve => server?.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  };

  it('does not wait the undici default of 300 s for a stalled response', () => {
    expect(DEFAULT_RESPONSE_TIMEOUT).toBeLessThanOrEqual(30_000);
  });

  it('gives up on a response whose headers never arrive', async () => {
    const url = await listen(() => undefined);

    const storageFetch = createStorageFetch({ responseTimeout: 100 });

    await expect(storageFetch(url)).rejects.toThrow();
  });

  it('gives up on a response whose body stalls', async () => {
    const url = await listen((_req, res) => {
      res.writeHead(200, { 'content-length': '10' });
      res.write('12345');
    });

    const storageFetch = createStorageFetch({ responseTimeout: 100 });
    const res = await storageFetch(url);

    await expect(res.text()).rejects.toThrow();
  });

  it('reuses connections across HEAD requests', async () => {
    let sockets = 0;
    const url = await listen((_req, res) => {
      res.writeHead(200, { 'content-length': '0' });
      res.end();
    });
    server?.on('connection', () => sockets++);

    const storageFetch = createStorageFetch();
    for (let i = 0; i < 10; i++) {
      await storageFetch(url, { method: 'HEAD' });
    }

    expect(sockets).toBeLessThanOrEqual(2);
  });
});
