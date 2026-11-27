import {
  assembleMailData,
  contextUsesSubscription,
  SAMPLE_INVOICE,
  SAMPLE_SUBSCRIPTION,
  SAMPLE_USER,
} from './mail-template-data';

describe('assembleMailData', () => {
  // A manual send of a gift code template has no gift code to hand in. It
  // must render the gift code placeholders empty, never with sample values.
  it.each(['giftCodePurchase', 'giftCodeRedemption'] as const)(
    'never invents a gift code (%s)',
    contextId => {
      const { optional } = assembleMailData(
        contextId,
        {
          user: SAMPLE_USER,
          subscription: SAMPLE_SUBSCRIPTION,
          invoice: SAMPLE_INVOICE,
        },
        ''
      );

      expect(optional['giftCode']).toBeUndefined();
    }
  );

  it('hands the gift code and the invoice to a purchase mail', () => {
    const giftCode = { code: 'ABCD-EFGH-JKMN' };
    const { optional } = assembleMailData(
      'giftCodePurchase',
      { user: SAMPLE_USER, invoice: SAMPLE_INVOICE, giftCode },
      ''
    );

    expect(optional).toEqual({ giftCode, invoice: SAMPLE_INVOICE });
  });

  it('hands the gift code, the subscription and the invoice to a redemption mail', () => {
    const giftCode = { code: 'ABCD-EFGH-JKMN' };
    const { optional } = assembleMailData(
      'giftCodeRedemption',
      {
        user: SAMPLE_USER,
        subscription: SAMPLE_SUBSCRIPTION,
        invoice: SAMPLE_INVOICE,
        giftCode,
      },
      ''
    );

    expect(optional).toEqual({
      giftCode,
      subscription: SAMPLE_SUBSCRIPTION,
      invoice: SAMPLE_INVOICE,
    });
  });
});

describe('contextUsesSubscription', () => {
  it('lets a redemption mail preview with a real subscription', () => {
    expect(contextUsesSubscription('giftCodeRedemption')).toBe(true);
  });

  it('has no subscription in a purchase mail', () => {
    expect(contextUsesSubscription('giftCodePurchase')).toBe(false);
  });
});
