import {
  formatTemplateLabel,
  MAIL_PLACEHOLDER_CONTEXTS,
  MAIL_TYPE_LABEL_KEYS,
} from './mail-placeholders';

const keysOf = (id: string) =>
  MAIL_PLACEHOLDER_CONTEXTS.find(
    context => context.id === id
  )?.placeholders.map(({ key }) => key);

const kindOf = (id: string, key: string) =>
  MAIL_PLACEHOLDER_CONTEXTS.find(
    context => context.id === id
  )?.placeholders.find(placeholder => placeholder.key === key)?.kind;

describe('mail placeholders', () => {
  it('offers the code, the offer and the paid invoice in a purchase mail', () => {
    expect(keysOf('giftCodePurchase')).toEqual(
      expect.arrayContaining([
        'optional_giftCode_code',
        'optional_giftCode_recipientName',
        'optional_giftCode_offer_name',
        'optional_giftCode_memberPlan_name',
        'optional_giftCode_issuedAt',
        'optional_giftCode_expiresAt',
        'optional_invoice_total',
      ])
    );
    expect(kindOf('giftCodePurchase', 'optional_giftCode_expiresAt')).toBe(
      'date'
    );
    expect(kindOf('giftCodePurchase', 'optional_invoice_total')).toBe('money');
  });

  it('offers the code and the subscription it paid in a redemption mail', () => {
    expect(keysOf('giftCodeRedemption')).toEqual(
      expect.arrayContaining([
        'optional_giftCode_code',
        'optional_giftCode_redeemedAt',
        'optional_subscription_memberPlan_name',
        'optional_subscription_paidUntil',
      ])
    );
    expect(kindOf('giftCodeRedemption', 'optional_giftCode_redeemedAt')).toBe(
      'date'
    );
  });

  // The redemption of a code only exists in a redemption mail.
  it('keeps the redemption date out of the purchase mail', () => {
    expect(keysOf('giftCodePurchase')).not.toContain(
      'optional_giftCode_redeemedAt'
    );
  });

  it('has a short label for every mail type', () => {
    for (const { id } of MAIL_PLACEHOLDER_CONTEXTS) {
      expect(MAIL_TYPE_LABEL_KEYS[id]).toBe(`mailTemplates.mailTypes.${id}`);
    }
  });

  it('names a gift code template with its mail type', () => {
    expect(
      formatTemplateLabel('Gutschein gekauft', 'giftCodePurchase', key => key)
    ).toBe('Gutschein gekauft (mailTemplates.mailTypes.giftCodePurchase)');
  });
});
