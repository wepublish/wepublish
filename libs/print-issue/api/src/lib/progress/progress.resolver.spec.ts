import type { FeaturesService } from '@wepublish/features/api';
import { CanGetPrintIssues } from '@wepublish/permissions';
import {
  SubscriptionPrintIssueProgressResolver,
  UserPrintIssueProgressResolver,
} from './progress.resolver';
import type {
  SubscriptionPrintIssueProgressDataloader,
  UserPrintIssueProgressDataloader,
} from './progress.dataloader';

const view = {
  subscriptionId: 's1',
  periodId: 'p1',
  received: 7,
  entitled: 12,
  owed: 5,
  relevant: true,
  issues: [],
};

const staff = (permissionIDs: string[]) =>
  ({
    type: 'user',
    user: { id: 'staff' },
    roles: [{ permissionIDs }],
  }) as never;

const make = (enabled = true) => {
  const features = { isEnabled: vi.fn(async () => enabled) };
  const users = {
    load: vi.fn(async () => [
      view,
      { ...view, subscriptionId: 's2', owed: 2, relevant: false },
    ]),
  };
  const subscriptions = { load: vi.fn(async () => view) };

  return {
    users,
    subscriptions,
    user: new UserPrintIssueProgressResolver(
      features as unknown as FeaturesService,
      users as unknown as UserPrintIssueProgressDataloader
    ),
    subscription: new SubscriptionPrintIssueProgressResolver(
      features as unknown as FeaturesService,
      subscriptions as unknown as SubscriptionPrintIssueProgressDataloader
    ),
  };
};

describe('print issue progress fields', () => {
  const allowed = staff([CanGetPrintIssues.id]);

  it('answers staff allowed to see print issues', async () => {
    const { user, subscription } = make();

    expect(
      await user.printIssueProgress({ id: 'u1' } as never, allowed)
    ).toHaveLength(2);
    // only what is still to send counts
    expect(await user.printIssuesOwed({ id: 'u1' } as never, allowed)).toBe(5);
    expect(
      await subscription.printIssueProgress({ id: 's1' } as never, allowed)
    ).toBe(view);
  });

  it('answers nothing without the permission or the print export, and loads nothing', async () => {
    for (const { make: built, session } of [
      { make: make(true), session: staff([]) },
      { make: make(false), session: allowed },
    ]) {
      expect(
        await built.user.printIssueProgress({ id: 'u1' } as never, session)
      ).toBeNull();
      expect(
        await built.user.printIssuesOwed({ id: 'u1' } as never, session)
      ).toBeNull();
      expect(
        await built.subscription.printIssueProgress(
          { id: 's1' } as never,
          session
        )
      ).toBeNull();
      expect(built.users.load).not.toHaveBeenCalled();
      expect(built.subscriptions.load).not.toHaveBeenCalled();
    }
  });

  it('says a user without printed issues owes nothing to count', async () => {
    const { user, users } = make();
    users.load.mockResolvedValue([]);

    expect(
      await user.printIssuesOwed({ id: 'u1' } as never, allowed)
    ).toBeNull();
  });
});
