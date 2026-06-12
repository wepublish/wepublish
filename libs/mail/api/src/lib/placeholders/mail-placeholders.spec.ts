import { SubscriptionEvent, UserEvent } from '@prisma/client';

import { getMailPlaceholderGroups } from './mail-placeholders';

describe('mail placeholders', () => {
  it('derives base user and jwt placeholders without sensitive user fields', () => {
    const accountCreation = getMailPlaceholderGroups().find(
      group => group.event === UserEvent.ACCOUNT_CREATION
    );

    expect(accountCreation?.placeholders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'user_email' }),
        expect.objectContaining({ key: 'user_firstName' }),
        expect.objectContaining({ key: 'jwt' }),
      ])
    );
    expect(accountCreation?.placeholders.map(({ key }) => key)).not.toEqual(
      expect.arrayContaining([
        'user_password',
        'user_roleIDs',
        'user_totpSecret',
        'user_totpEnabled',
        'user_totpExempt',
      ])
    );
  });

  it('includes optional subscription and invoice placeholders for subscription flow mails', () => {
    const renewalSuccess = getMailPlaceholderGroups().find(
      group => group.event === SubscriptionEvent.RENEWAL_SUCCESS
    );

    expect(renewalSuccess?.placeholders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'optional_subscription_id' }),
        expect.objectContaining({
          key: 'optional_subscription_memberPlan_name',
        }),
        expect.objectContaining({ key: 'optional_invoice_id' }),
        expect.objectContaining({ key: 'optional_items_0_name' }),
        expect.objectContaining({
          key: 'optional_subscriptionPeriods_0_amount',
        }),
      ])
    );
  });

  it('includes email-change placeholders for user flow mails', () => {
    const emailChange = getMailPlaceholderGroups().find(
      group => group.event === UserEvent.EMAIL_CHANGE
    );

    expect(emailChange?.placeholders).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'optional_newEmail' }),
      ])
    );
  });
});
