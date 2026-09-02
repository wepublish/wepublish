import { Currency } from '@wepublish/website/api';

// Different CLDR versions format numbers differently.
// Currently the browser CLDR and node v22 CLDR are different
const GROUP_SEPARATORS = /[\u2019\u02bc\u0027]/g;
const NON_BREAKING_SPACES = /[\u00a0\u202f\u2009]/g;

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

  let result = formatter
    .format(value)
    .replace(GROUP_SEPARATORS, "'")
    .replace(NON_BREAKING_SPACES, ' ');

  if (currency === Currency.Chf && result.endsWith('.00')) {
    result = result.replace('.00', '.-');
  }

  return result;
};

export const roundUpTo5Cents = (amount: number) =>
  +(Math.ceil(amount * 20) / 20);
