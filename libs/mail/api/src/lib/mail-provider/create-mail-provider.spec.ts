import { MailProviderType } from '@prisma/client';
import { createKvMock } from '@wepublish/kv-ttl-cache/api';
import { loadMailProvider } from './create-mail-provider';
import { SmtpMailProvider } from './smtp-mail-provider';

describe('loadMailProvider', () => {
  it('only considers providers that were not retired', async () => {
    const findFirst = jest
      .fn()
      .mockResolvedValue({ id: 'smtp', type: MailProviderType.SMTP });

    const provider = await loadMailProvider({
      prisma: { settingMailProvider: { findFirst } } as never,
      kv: createKvMock(),
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deletedAt: null } })
    );
    expect(provider).toBeInstanceOf(SmtpMailProvider);
    expect(provider?.id).toBe('smtp');
  });

  it('reports no provider when every one was retired', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);

    const provider = await loadMailProvider({
      prisma: { settingMailProvider: { findFirst } } as never,
      kv: createKvMock(),
    });

    expect(provider).toBeNull();
  });
});
