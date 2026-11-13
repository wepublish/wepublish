import { ImpersonatingError } from '@wepublish/authentication/api';
import { ExternalAppsResolver } from './external-apps.resolver';

describe('createExternalAppToken', () => {
  it('refuses while signed in as someone else', async () => {
    const jwtService = { generateJWT: vi.fn() };
    const resolver = new ExternalAppsResolver(
      {} as never,
      {
        load: vi.fn(async () => ({ id: 'app-1', url: 'https://app.example' })),
      } as never,
      jwtService as never
    );

    await expect(
      resolver.createExternalAppToken('app-1', {
        type: 'user',
        impersonatedBy: 'jane@wepublish.ch',
        user: { id: 'user-2' },
      } as never)
    ).rejects.toBeInstanceOf(ImpersonatingError);
    expect(jwtService.generateJWT).not.toHaveBeenCalled();
  });
});
