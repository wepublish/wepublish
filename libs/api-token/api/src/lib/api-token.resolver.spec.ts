import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

vi.mock('@wepublish/user/api', () => ({
  User: class User {},
  UserDataloaderService: class UserDataloaderService {},
}));

const { ApiTokenResolver } = await import('./api-token.resolver');

const dataloader = (user: unknown) => ({ load: vi.fn(async () => user) });

const resolver = (loader: unknown) =>
  new ApiTokenResolver({} as never, loader as never);

describe('createdBy', () => {
  it('loads the user a key was created by', async () => {
    const user = { id: 'u1', name: 'Ada Lovelace' };
    const loader = dataloader(user);

    await expect(
      resolver(loader).createdBy({ createdById: 'u1' } as never)
    ).resolves.toBe(user);

    expect(loader.load).toHaveBeenCalledWith('u1');
  });

  it('is nothing for a key whose creator was deleted', async () => {
    const loader = dataloader(null);

    expect(
      resolver(loader).createdBy({ createdById: null } as never)
    ).toBeNull();

    expect(loader.load).not.toHaveBeenCalled();
  });
});

describe('createApiToken', () => {
  it('hands the service the organisations its creator belongs to', async () => {
    const createToken = vi.fn(async () => ({}));
    const session = {
      type: 'user',
      user: { id: 'u1' },
      roles: [{ permissionIDs: ['CAN_UPDATE_ORGANIZATION'] }],
      organizationIds: ['org-a'],
    };

    await new ApiTokenResolver(
      { createToken } as never,
      dataloader(null) as never
    ).createApiToken(
      {
        name: 'Dampfzentrale import',
        scopes: ['CAN_UPDATE_ORGANIZATION'],
        expiresAt: new Date(),
        organizationId: 'org-a',
      },
      session as never
    );

    expect(createToken).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-a' }),
      {
        userId: 'u1',
        permissions: ['CAN_UPDATE_ORGANIZATION'],
        organizationIds: ['org-a'],
      }
    );
  });
});

describe('acting as the creator of a key', () => {
  const keySession = (...permissions: string[]) => ({
    type: 'apiToken',
    id: 'tok-1',
    name: 'Print Import',
    token: 'wep_secret',
    permissions,
    organizationId: null,
    user: { id: 'u1', roleIDs: ['admin'] },
  });

  it('lists the creator keys, judged by the key scopes', async () => {
    const getApiTokens = vi.fn(async () => ({}));

    await new ApiTokenResolver(
      { getApiTokens } as never,
      dataloader(null) as never
    ).apiTokens({} as never, keySession('CAN_GET_API_TOKENS') as never);

    expect(getApiTokens).toHaveBeenCalledWith(
      {},
      { userId: 'u1', canSeeAll: false }
    );
  });

  it('revokes keys judged by the key scopes, not the creator roles', async () => {
    const revokeToken = vi.fn(async () => ({}));

    await new ApiTokenResolver(
      { revokeToken } as never,
      dataloader(null) as never
    ).revokeApiToken(
      'tok-2',
      keySession('CAN_REVOKE_API_TOKEN', 'CAN_REVOKE_ALL_API_TOKENS') as never
    );

    expect(revokeToken).toHaveBeenCalledWith('tok-2', {
      userId: 'u1',
      canRevokeAll: true,
    });
  });

  it('does not let a key mint another key', async () => {
    const createToken = vi.fn(async () => ({}));

    await expect(
      new ApiTokenResolver(
        { createToken } as never,
        dataloader(null) as never
      ).createApiToken(
        {
          name: 'Escape hatch',
          scopes: ['CAN_GET_EVENT'],
          expiresAt: new Date(),
        },
        keySession('CAN_CREATE_API_TOKEN', 'CAN_GET_EVENT') as never
      )
    ).rejects.toThrow(ForbiddenException);

    expect(createToken).not.toHaveBeenCalled();
  });

  it('refuses a key whose creator was deleted', async () => {
    await expect(
      new ApiTokenResolver(
        { getApiTokens: vi.fn() } as never,
        dataloader(null) as never
      ).apiTokens(
        {} as never,
        { ...keySession('CAN_GET_API_TOKENS'), user: null } as never
      )
    ).rejects.toThrow(UnauthorizedException);
  });
});
