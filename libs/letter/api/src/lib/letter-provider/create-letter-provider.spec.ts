import { LetterProviderType } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { loadLetterProvider } from './create-letter-provider';
import { PingenLetterProvider } from './pingen-letter-provider';

describe('loadLetterProvider', () => {
  it('builds the provider of the configured type', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'pingen', type: LetterProviderType.pingen });

    const provider = await loadLetterProvider({
      prisma: { settingLetterProvider: { findFirst } } as never,
      kv: createKvMock(),
    });

    expect(provider).toBeInstanceOf(PingenLetterProvider);
    expect(provider?.id).toBe('pingen');
  });

  it('reports no provider when none is configured', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);

    const provider = await loadLetterProvider({
      prisma: { settingLetterProvider: { findFirst } } as never,
      kv: createKvMock(),
    });

    expect(provider).toBeNull();
  });
});
