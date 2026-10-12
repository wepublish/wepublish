import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './server-app';

describe('editor server', () => {
  let browserDist: string;
  let indexPath: string;

  beforeAll(() => {
    browserDist = mkdtempSync(join(tmpdir(), 'editor-server-'));
    indexPath = join(browserDist, 'index.html');

    writeFileSync(indexPath, '<html><head></head><body></body></html>');
    writeFileSync(join(browserDist, 'main.js'), 'console.log("bundle");');
  });

  it('answers the health check', async () => {
    const response = await request(createApp(browserDist, indexPath)).get(
      '/health'
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('serves a built asset with an immutable cache header', async () => {
    const response = await request(createApp(browserDist, indexPath)).get(
      '/main.js'
    );

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe(
      'public, max-age=31536000, immutable'
    );
  });

  it('falls back to the index for client side routes', async () => {
    const response = await request(createApp(browserDist, indexPath)).get(
      '/articles/some-id'
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('falls back to the index for a missing asset', async () => {
    const response = await request(createApp(browserDist, indexPath)).get(
      '/does-not-exist.js'
    );

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });
});
