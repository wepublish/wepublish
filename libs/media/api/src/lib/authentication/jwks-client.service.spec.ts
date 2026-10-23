import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { exportJWK, generateKeyPair } from 'jose';
import { JwksClientService } from './jwks-client.service';

const DAY = 24 * 60 * 60 * 1000;

describe('JwksClientService', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const jwks = async () => {
    const { publicKey } = await generateKeyPair('EdDSA');

    return { keys: [await exportJWK(publicKey)] };
  };

  it('keeps serving the expired key while the refresh is still running', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const body = await jwks();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(body)))
      .mockReturnValue(new Promise(() => undefined));
    vi.stubGlobal('fetch', fetch);
    const client = new JwksClientService({ apiUrl: 'http://api' });
    const key = await client.getPublicKey();

    vi.setSystemTime(Date.now() + DAY + 1);

    expect(await client.getPublicKey()).toBe(key);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up on a JWKS endpoint that never answers', async () => {
    const fetch = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(init.signal?.reason)
          )
        )
    );
    vi.stubGlobal('fetch', fetch);
    const client = new JwksClientService({
      apiUrl: 'http://api',
      fetchTimeout: 50,
    });

    await expect(client.getPublicKey()).rejects.toThrow();
  });
});
