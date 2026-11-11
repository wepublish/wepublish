import { MailProviderType } from '@prisma/client';
import {
  createNamespacedCacheTesting,
  type NamespacedCacheTesting,
} from '@wepublish/kv-ttl-cache/api/testing';
import { loadMailProvider } from './create-mail-provider';
import { SmtpMailProvider } from './smtp-mail-provider';

describe('loadMailProvider', () => {
  let testing: NamespacedCacheTesting;

  beforeEach(async () => {
    testing = await createNamespacedCacheTesting();
  });

  afterEach(() => testing.close());

  it('only considers providers that were not retired', async () => {
    const findFirst = vi
      .fn()
      .mockResolvedValue({ id: 'smtp', type: MailProviderType.SMTP });

    const provider = await loadMailProvider({
      prisma: { settingMailProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(provider).toBeInstanceOf(SmtpMailProvider);
    expect(provider?.id).toBe('smtp');
  });

  it('reports no provider when every one was retired', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);

    const provider = await loadMailProvider({
      prisma: { settingMailProvider: { findFirst } } as never,
      kv: testing.cache,
    });

    expect(provider).toBeNull();
  });
});
