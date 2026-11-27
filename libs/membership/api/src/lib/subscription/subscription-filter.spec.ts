import { legacySubscriptionWhere } from './legacy-subscription';
import { createSubscriptionFilter } from './subscription.service';

describe('createSubscriptionFilter', () => {
  it('keeps only legacy subscriptions when asked for them', () => {
    expect(createSubscriptionFilter({ legacy: true }).AND).toContainEqual(
      legacySubscriptionWhere(true)
    );
  });

  it('keeps everything but legacy subscriptions when asked for the rest', () => {
    expect(createSubscriptionFilter({ legacy: false }).AND).toContainEqual(
      legacySubscriptionWhere(false)
    );
  });

  it('does not narrow by legacy when the filter leaves it open', () => {
    const conditions = createSubscriptionFilter({}).AND;

    expect(conditions).not.toContainEqual(legacySubscriptionWhere(true));
    expect(conditions).not.toContainEqual(legacySubscriptionWhere(false));
  });
});
