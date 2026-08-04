const GROUP_SEPARATORS = /[\u2019\u0027]/g;
const NON_BREAKING_SPACES = /[\u00a0\u202f\u2009]/g;

export const formatNumber = (value: number, locale = 'de-CH') => {
  const formatter = new Intl.NumberFormat(locale);

  return formatter
    .format(value)
    .replace(GROUP_SEPARATORS, "'")
    .replace(NON_BREAKING_SPACES, ' ');
};
