import { ImpersonatingError } from '@wepublish/authentication/api';
import { TotpResolver } from './totp.resolver';

describe('TotpResolver while signed in as someone else', () => {
  const session = {
    type: 'user',
    impersonatedBy: 'jane@wepublish.ch',
    user: { id: 'user-2', email: 'reader@example.com' },
  } as never;
  const totpService = { setupTotp: vi.fn(), enableTotp: vi.fn() };
  const resolver = new TotpResolver(totpService as never);

  it('refuses to set up two-factor authentication', async () => {
    await expect(
      resolver.generateTotpSetup(undefined, session)
    ).rejects.toBeInstanceOf(ImpersonatingError);
    await expect(resolver.enableTotp('123456', session)).rejects.toBeInstanceOf(
      ImpersonatingError
    );
    expect(totpService.setupTotp).not.toHaveBeenCalled();
    expect(totpService.enableTotp).not.toHaveBeenCalled();
  });
});
