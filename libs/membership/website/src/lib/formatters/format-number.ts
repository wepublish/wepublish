export const formatNumber = (
  value: number,
  format: string,
  locale = 'de-CH'
) => {
  const [intPart = '', fracPart = ''] = format.split('.');
  const useGrouping = intPart.includes(',');

  const minimumIntegerDigits = Math.max(1, (intPart.match(/0/g) || []).length);
  const minimumFractionDigits = (fracPart.match(/0/g) || []).length;
  const maximumFractionDigits = Math.max(
    minimumFractionDigits,
    (fracPart.match(/[0#]/g) || []).length
  );

  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumIntegerDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    useGrouping,
  }).format(value);
};
