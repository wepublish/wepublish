import {
  isSubscriptionActive,
  isSubscriptionDeactivated,
} from './subscription-state';

const subscription = (
  deactivation: { date: string } | null,
  isActive: boolean
) => ({ deactivation, isActive }) as Parameters<typeof isSubscriptionActive>[0];

describe('isSubscriptionActive', () => {
  it('should be true for a subscription without a deactivation', () => {
    expect(isSubscriptionActive(subscription(null, true))).toBeTruthy();
  });

  it('should be true for an unpaid subscription without a deactivation', () => {
    expect(isSubscriptionActive(subscription(null, false))).toBeTruthy();
  });

  it('should be true for a cancelled subscription that is still running', () => {
    expect(
      isSubscriptionActive(subscription({ date: '2032-01-01' }, true))
    ).toBeTruthy();
  });

  it('should be false for a cancelled subscription that has ended', () => {
    expect(
      isSubscriptionActive(subscription({ date: '2020-01-01' }, false))
    ).toBeFalsy();
  });
});

describe('isSubscriptionDeactivated', () => {
  it('should be false for a cancelled subscription that is still running', () => {
    expect(
      isSubscriptionDeactivated(subscription({ date: '2032-01-01' }, true))
    ).toBeFalsy();
  });

  it('should be true for a cancelled subscription that has ended', () => {
    expect(
      isSubscriptionDeactivated(subscription({ date: '2020-01-01' }, false))
    ).toBeTruthy();
  });

  it('should be false for an unpaid subscription without a deactivation', () => {
    expect(isSubscriptionDeactivated(subscription(null, false))).toBeFalsy();
  });
});
