import { ForbiddenException } from '@nestjs/common';
import { AuthSessionType } from '@wepublish/authentication/api';

import { ExternalAppsResolver } from './external-apps.resolver';

vi.mock('@wepublish/session/api', () => ({
  JwtService: class JwtService {},
}));

const setup = () => {
  const jwtService = { generateJWT: vi.fn().mockResolvedValue('jwt') };
  const dataloader = {
    load: vi.fn().mockResolvedValue({ id: 'app-1', url: 'https://app.test' }),
  };

  return {
    jwtService,
    resolver: new ExternalAppsResolver(
      {} as never,
      dataloader as never,
      jwtService as never
    ),
  };
};

describe('createExternalAppToken', () => {
  it('signs the signed-in user into the external app', async () => {
    const { resolver, jwtService } = setup();

    await resolver.createExternalAppToken('app-1', {
      type: AuthSessionType.User,
      user: { id: 'user-1' },
    } as never);

    expect(jwtService.generateJWT).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', audience: 'https://app.test' })
    );
  });

  it('does not let an api key sign its creator into an external app', async () => {
    const { resolver, jwtService } = setup();

    await expect(
      resolver.createExternalAppToken('app-1', {
        type: AuthSessionType.ApiToken,
        id: 'key-1',
        name: 'Print Import',
        token: 'wep_secret',
        permissions: [],
        organizationId: null,
        user: { id: 'user-1' },
      } as never)
    ).rejects.toThrow(ForbiddenException);
    expect(jwtService.generateJWT).not.toHaveBeenCalled();
  });
});
