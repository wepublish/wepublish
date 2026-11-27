import { CanGetUsers } from '@wepublish/permissions';
import { PERMISSIONS_METADATA_KEY } from '@wepublish/permissions/api';
import { UserResolver } from './user.resolver';

describe('UserResolver.userEmailSegments', () => {
  it('needs the same permission as the user list', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_METADATA_KEY,
        UserResolver.prototype.userEmailSegments
      )
    ).toEqual([CanGetUsers]);
  });

  it('returns what the service offers', async () => {
    const service = { getEmailSegments: vi.fn(async () => ['dead']) };
    const resolver = new UserResolver(
      service as never,
      {} as never,
      {} as never
    );

    expect(await resolver.userEmailSegments()).toEqual(['dead']);
  });
});
