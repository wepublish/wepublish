import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { UserSubscriptionResolver } from './user-subscription.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('UserSubscriptionResolver called with an api key', () => {
  const resolver = new UserSubscriptionResolver(
    {} as any,
    {} as any,
    {} as any
  );

  it('has no subscriptions of its own', async () => {
    await expect(async () =>
      resolver.createUserSubscription({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.extendUserSubscription({} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.updateUserSubscription('sub-1', {} as any, apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.reactivateUserSubscription('sub-1', apiKey)
    ).rejects.toThrow(ForbiddenException);
    await expect(async () =>
      resolver.cancelUserSubscription('sub-1', apiKey)
    ).rejects.toThrow(ForbiddenException);
  });
});
