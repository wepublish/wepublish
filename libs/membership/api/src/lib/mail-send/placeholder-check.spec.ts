import { MailTemplateContext } from '@prisma/client';
import { findMissingPlaceholders } from './placeholder-check';

const template = (
  htmlContent: string,
  context: MailTemplateContext | null = MailTemplateContext.custom
) => ({
  subject: 'Hallo {{user_firstName}}',
  htmlContent,
  textContent: null,
  context,
});

describe('findMissingPlaceholders', () => {
  it('never flags user placeholders or the jwt (available in both modes)', () => {
    const tpl = template(
      '<p>{{user_email}} {{user_firstName}} {{user_name}} {{jwt}} {{currentDate_year}}</p>'
    );

    expect(findMissingPlaceholders(tpl, false)).toEqual([]);
    expect(findMissingPlaceholders(tpl, true)).toEqual([]);
  });

  it('flags a subscription placeholder without subscription data, not with it', () => {
    const tpl = template('<p>{{optional_subscription_memberPlan_name}}</p>');

    expect(findMissingPlaceholders(tpl, false)).toEqual([
      'optional_subscription_memberPlan_name',
    ]);
    expect(findMissingPlaceholders(tpl, true)).toEqual([]);
  });

  it('recognises derived date and computed money variants as available', () => {
    const tpl = template(
      '<p>{{user_lastLogin_date}} {{optional_subscription_monthlyAmount_display}}</p>'
    );

    // date variant needs no subscription; money variant needs subscription data
    expect(findMissingPlaceholders(tpl, false)).toEqual([
      'optional_subscription_monthlyAmount_display',
    ]);
    expect(findMissingPlaceholders(tpl, true)).toEqual([]);
  });

  it('checks the placeholders of the attachments as well', () => {
    const tpl = template('<p>{{user_firstName}}</p>');

    expect(
      findMissingPlaceholders(tpl, false, [
        'user_name',
        'optional_subscription_memberPlan_name',
      ])
    ).toEqual(['optional_subscription_memberPlan_name']);
  });

  it('flags a placeholder used in the template and an attachment once', () => {
    const tpl = template('<p>{{optional_does_not_exist}}</p>');

    expect(
      findMissingPlaceholders(tpl, false, ['optional_does_not_exist'])
    ).toEqual(['optional_does_not_exist']);
  });

  it('always flags a genuinely unknown placeholder', () => {
    const tpl = template('<p>{{optional_does_not_exist}}</p>');

    expect(findMissingPlaceholders(tpl, false)).toContain(
      'optional_does_not_exist'
    );
    expect(findMissingPlaceholders(tpl, true)).toContain(
      'optional_does_not_exist'
    );
  });

  it('matches placeholders case-insensitively (like the renderer)', () => {
    const tpl = template('<p>{{USER_EMAIL}}</p>');

    expect(findMissingPlaceholders(tpl, true)).toEqual([]);
  });

  it('assembles data for the template context (invoiceCreation)', () => {
    const tpl = template(
      '<p>{{optional_subscriptionToCreateInvoice_memberPlan_name}}</p>',
      MailTemplateContext.invoiceCreation
    );

    // invoiceCreation binds `subscriptionToCreateInvoice`, so it resolves with
    // subscription data but not without.
    expect(findMissingPlaceholders(tpl, false)).toEqual([
      'optional_subscriptionToCreateInvoice_memberPlan_name',
    ]);
    expect(findMissingPlaceholders(tpl, true)).toEqual([]);
  });

  it('treats a missing context as custom', () => {
    const tpl = template(
      '<p>{{optional_subscription_memberPlan_name}}</p>',
      null
    );

    // custom binds `subscription`, so with subscription data it resolves.
    expect(findMissingPlaceholders(tpl, true)).toEqual([]);
  });
});
