import { mkdtempSync, writeFileSync } from 'node:fs';
import { createServer, Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './server-app';

describe('editor server', () => {
  let server: Server;

  beforeAll(async () => {
    const browserDist = mkdtempSync(join(tmpdir(), 'editor-server-'));
    const indexPath = join(browserDist, 'index.html');

    writeFileSync(indexPath, '<html><head></head><body></body></html>');
    writeFileSync(join(browserDist, 'main.js'), 'console.log("bundle");');

    // Listen on the loopback address here: supertest would bind the app with
    // listen(0), and on macOS that can land on a port another process holds
    // on 127.0.0.1 (see gotchas.md).
    server = createServer(createApp(browserDist, indexPath));
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  });

  afterAll(() => new Promise<void>(resolve => server.close(() => resolve())));

  it('answers the health check', async () => {
    const response = await request(server).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('serves a built asset with an immutable cache header', async () => {
    const response = await request(server).get('/main.js');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable'
    );
  });

  it('falls back to the index for client side routes', async () => {
    const response = await request(server).get('/articles/some-id');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('falls back to the index for a missing asset', async () => {
    const response = await request(server).get('/does-not-exist.js');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
