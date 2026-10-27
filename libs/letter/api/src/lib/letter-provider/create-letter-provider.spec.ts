import { LetterProviderType } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { loadLetterProvider } from './create-letter-provider';
import { PingenLetterProvider } from './pingen-letter-provider';

let testing: NamespacedCacheTesting;

beforeEach(async () => {
  testing = await createNamespacedCacheTesting();
});

afterEach(() => testing.close());

describe('loadLetterProvider', () => {
  it('builds the provider of the configured type', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'pingen', type: LetterProviderType.pingen });

    const provider = await loadLetterProvider({
      prisma: { settingLetterProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(provider).toBeInstanceOf(PingenLetterProvider);
    expect(provider?.id).toBe('pingen');
  });

  it('reports no provider when none is configured', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);

    const provider = await loadLetterProvider({
      prisma: { settingLetterProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(provider).toBeNull();
  });
});
