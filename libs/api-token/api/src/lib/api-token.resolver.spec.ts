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
