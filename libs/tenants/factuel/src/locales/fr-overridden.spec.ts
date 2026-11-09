import i18next from 'i18next';
import ICU from 'i18next-icu';

import frOverridden from './frOverridden.json';

const createT = async () => {
  const instance = i18next.createInstance();
  await instance.use(ICU).init({
    lng: 'fr',
    resources: { fr: { translation: frOverridden } },
  });

  return instance.t;
};

describe('Courant fr overrides: subscribe.support', () => {
  const base = {
    siteTitle: 'Courant',
    monthlyAmount: 2000,
    paymentPeriodL: '1 an',
  };

  it('uses the membership wording for subscriptions', async () => {
    const t = await createT();

    expect(
      t('subscribe.support.subscribeForPeriod', {
        ...base,
        productType: 'Subscription',
        formattedAmount: 'CHF 240.00',
        renewalPeriodL: 'par an',
      })
    ).toBe('J’adhère à Courant pour CHF 240.00 par an');

    expect(
      t('subscribe.support.pay', {
        ...base,
        productType: 'Subscription',
        formattedAmount: 'CHF 240.00',
      })
    ).toBe('J’adhère à Courant pour CHF 240.00');
  });

  it('uses the donation wording for donations', async () => {
    const t = await createT();

    expect(
      t('subscribe.support.pay', {
        ...base,
        productType: 'Donation',
        formattedAmount: 'CHF 10.00',
      })
    ).toBe('Je fais un don de CHF 10.00');

    expect(
      t('subscribe.support.subscribeForPeriod', {
        ...base,
        productType: 'Donation',
        formattedAmount: 'CHF 10.00',
        renewalPeriodL: 'par mois',
      })
    ).toBe('Je fais un don de CHF 10.00 par mois');
  });
});
