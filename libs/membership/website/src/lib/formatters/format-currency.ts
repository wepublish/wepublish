import { Currency } from '@wepublish/website/api';

export const formatCurrency = (
  value: number,
  currency: Currency,
  locale = 'de-CH',
  includeCurrency = true
) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: includeCurrency ? 'currency' : 'decimal',
    currency,
  });
  let result = formatter.format(value);

  if (currency === Currency.Chf && result.endsWith('.00')) {
    result = result.replace('.00', '.-');
  }

  return result;
};

export const roundUpTo5Cents = (amount: number) =>
  +(Math.ceil(amount * 20) / 20);
