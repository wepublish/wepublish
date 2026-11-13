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
  it('refuses while signed in as someone else', async () => {
    const service = { createToken: vi.fn() };
    const { ImpersonatingError } =
      await import('@wepublish/authentication/api');

    await expect(
      new ApiTokenResolver(service as never, {} as never).createApiToken(
        { name: 'Import' } as never,
        {
          type: 'user',
          impersonatedBy: 'jane@wepublish.ch',
          user: { id: 'user-2' },
          roles: [],
        } as never
      )
    ).rejects.toBeInstanceOf(ImpersonatingError);
    expect(service.createToken).not.toHaveBeenCalled();
  });
});
