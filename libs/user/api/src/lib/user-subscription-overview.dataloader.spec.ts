import { getUserSubscriptionStatus } from './user-subscription-overview.dataloader';
import { UserSubscriptionStatus } from './user.model';

describe('getUserSubscriptionStatus', () => {
  const now = new Date('2026-09-25T12:00:00Z');
  const past = new Date('2026-01-01T00:00:00Z');
  const future = new Date('2027-01-01T00:00:00Z');

  it('is active when started and paid up', () => {
    expect(
      getUserSubscriptionStatus(
        { startsAt: past, paidUntil: future, deactivation: null },
        now
      )
    ).toBe(UserSubscriptionStatus.Active);
  });

  it('is expired when paidUntil passed without a deactivation', () => {
    expect(
      getUserSubscriptionStatus(
        { startsAt: past, paidUntil: past, deactivation: null },
        now
      )
    ).toBe(UserSubscriptionStatus.Expired);
  });

  it('is deactivated whenever a deactivation exists', () => {
    expect(
      getUserSubscriptionStatus(
        { startsAt: past, paidUntil: future, deactivation: { id: 'd' } },
        now
      )
    ).toBe(UserSubscriptionStatus.Deactivated);
  });

  it('is planned when it has not started yet', () => {
    expect(
      getUserSubscriptionStatus(
        { startsAt: future, paidUntil: null, deactivation: null },
        now
      )
    ).toBe(UserSubscriptionStatus.Planned);
  });

  it('is unpaid when started but never paid', () => {
    expect(
      getUserSubscriptionStatus(
        { startsAt: past, paidUntil: null, deactivation: null },
        now
      )
    ).toBe(UserSubscriptionStatus.Unpaid);
  });
});
