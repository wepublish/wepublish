import {
  MailTemplateContext,
  SubscriptionEvent,
  UserEvent,
} from '@wepublish/editor/api';

import { purposeOfEvent } from './event-purpose';

describe('purposeOfEvent', () => {
  it.each([
    [SubscriptionEvent.Subscribe, MailTemplateContext.Subscription],
    [SubscriptionEvent.ConfirmSubscription, MailTemplateContext.Subscription],
    [SubscriptionEvent.DeactivationByUser, MailTemplateContext.Subscription],
    [SubscriptionEvent.DeactivationUnpaid, MailTemplateContext.Subscription],
    [SubscriptionEvent.RenewalSuccess, MailTemplateContext.Renewal],
    [SubscriptionEvent.RenewalFailed, MailTemplateContext.Renewal],
    [SubscriptionEvent.InvoiceCreation, MailTemplateContext.InvoiceCreation],
    [SubscriptionEvent.Custom, MailTemplateContext.Custom],
    [UserEvent.AccountCreation, MailTemplateContext.Account],
    [UserEvent.LoginLink, MailTemplateContext.Account],
    [UserEvent.PasswordReset, MailTemplateContext.Account],
    [UserEvent.EmailChange, MailTemplateContext.EmailChange],
  ])('writes %s with a template for %s', (event, purpose) => {
    expect(purposeOfEvent(event)).toBe(purpose);
  });

  it('knows no purpose for the test mail, which any template can be', () => {
    expect(purposeOfEvent(UserEvent.TestMail)).toBeUndefined();
  });
});
