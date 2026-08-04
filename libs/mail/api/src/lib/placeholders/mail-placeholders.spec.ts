import { SubscriptionEvent, UserEvent } from '@prisma/client';
import {
  getAllMailPlaceholders,
  getMailPlaceholderGroups,
} from './mail-placeholders';

describe('mail placeholders', () => {
  const groups = getMailPlaceholderGroups();

  const keysFor = (event: string): string[] =>
    groups.find(group => group.event === event)?.placeholders.map(p => p.key) ??
    [];

  it('includes a group for every user and subscription event', () => {
    const events = groups.map(group => group.event);
    for (const event of Object.values(UserEvent)) {
      expect(events).toContain(event);
    }
    for (const event of Object.values(SubscriptionEvent)) {
      expect(events).toContain(event);
    }
  });

  it('always exposes the default user_* and jwt placeholders', () => {
    const keys = keysFor(UserEvent.ACCOUNT_CREATION);
    expect(keys).toContain('user_email');
    expect(keys).toContain('user_firstName');
    expect(keys).toContain('jwt');
  });

  it('generates flattened optional_* placeholders for subscription renewals', () => {
    const keys = keysFor(SubscriptionEvent.RENEWAL_SUCCESS);
    expect(keys).toContain('optional_subscription_memberPlan_name');
    expect(keys).toContain('optional_subscription_paymentMethod_name');
    expect(keys).toContain('optional_invoice_id');
    expect(keys).toContain('optional_items_0_amount');
    expect(keys).toContain('optional_subscriptionPeriods_0_endsAt');
  });

  it('exposes the optional_newEmail placeholder for email change', () => {
    expect(keysFor(UserEvent.EMAIL_CHANGE)).toContain('optional_newEmail');
  });

  it('provides an example value for every placeholder', () => {
    for (const placeholder of getAllMailPlaceholders()) {
      expect(typeof placeholder.example).toBe('string');
    }
  });
});
