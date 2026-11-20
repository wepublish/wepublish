import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { PublicSubscriptionResolver } from './subscription.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('PublicSubscriptionResolver called with an api key', () => {
  it('does not treat the subscription of the key‘s creator as its own', async () => {
    const memberPlanDataloader = {
      load: vi.fn().mockResolvedValue({ externalReward: 'reward' }),
    };
    const resolver = new PublicSubscriptionResolver(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      memberPlanDataloader as any,
      {} as any,
      {} as any,
      {} as any
    );
    vi.spyOn(resolver, 'isActive').mockResolvedValue(true);

    await expect(
      resolver.externalReward(
        { userID: 'creator-1', memberPlanID: 'plan-1' } as any,
        apiKey
      )
    ).resolves.toBeNull();
  });
});
