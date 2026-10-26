import { CanGetAllApiTokens } from '@wepublish/permissions';

// Loaded alone, the api-token barrel pulls in the peering models before
// their field types exist and the GraphQL decorators throw; the resolver
// only needs the type as a reference here.
vi.mock('@wepublish/api-token/api', () => ({
  ApiToken: class ApiToken {},
}));

import { ExternalAppApiTokenResolver } from './external-app-api-token.resolver';

describe('ExternalAppApiTokenResolver', () => {
  it('asks for the linked api key with the permissions of the session', async () => {
    const linkedApiToken = vi.fn(async () => ({ id: 'key-1' }));
    const resolver = new ExternalAppApiTokenResolver({
      linkedApiToken,
    } as never);

    await expect(
      resolver.apiToken(
        { apiTokenId: 'key-1' } as never,
        {
          user: { id: 'admin-1' },
          roles: [{ id: 'admin', permissionIDs: [CanGetAllApiTokens.id] }],
        } as never
      )
    ).resolves.toEqual({ id: 'key-1' });

    expect(linkedApiToken).toHaveBeenCalledWith(
      { apiTokenId: 'key-1' },
      { userId: 'admin-1', permissions: [CanGetAllApiTokens.id] }
    );
  });

  it('asks without permissions for an anonymous request', async () => {
    const linkedApiToken = vi.fn(async () => null);
    const resolver = new ExternalAppApiTokenResolver({
      linkedApiToken,
    } as never);

    await resolver.apiToken({ apiTokenId: 'key-1' } as never, undefined);

    expect(linkedApiToken).toHaveBeenCalledWith(
      { apiTokenId: 'key-1' },
      { userId: undefined, permissions: [] }
    );
  });
});
