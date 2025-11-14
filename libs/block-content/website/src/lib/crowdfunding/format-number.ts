export const formatNumber = (value: number, locale = 'de-CH') => {
  const formatter = new Intl.NumberFormat(locale);

  return formatter.format(value);
};
