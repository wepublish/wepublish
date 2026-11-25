import { ForbiddenException } from '@nestjs/common';
import {
  AuthSessionType,
  SESSION_RESTRICTED,
} from '@wepublish/authentication/api';
import { UserSubscriptionResolver } from './user-subscription.resolver';

const restricted = {
  type: AuthSessionType.User,
  restricted: true,
  user: { id: 'user-1' },
} as never;

describe('UserSubscriptionResolver called with a restricted session', () => {
  const createSubscriptionWithConfirmation = vi.fn();
  const load = vi.fn().mockResolvedValue({ id: 'user-2' });
  const resolver = new UserSubscriptionResolver(
    { createSubscriptionWithConfirmation } as any,
    { load } as any,
    {} as any
  );

  beforeEach(() => createSubscriptionWithConfirmation.mockClear());

  it('does not subscribe the reader the session stands for', async () => {
    await expect(async () =>
      resolver.createUserSubscriptionWithConfirmation({} as any, restricted)
    ).rejects.toThrow(new ForbiddenException(SESSION_RESTRICTED));

    expect(createSubscriptionWithConfirmation).not.toHaveBeenCalled();
  });

  // Naming the user is what a guest does too; the session adds nothing.
  it('still subscribes a user named in the request', async () => {
    await resolver.createUserSubscriptionWithConfirmation(
      { userId: 'user-2' } as any,
      restricted
    );

    expect(createSubscriptionWithConfirmation).toHaveBeenCalledWith(
      'user-2',
      {}
    );
  });
});
