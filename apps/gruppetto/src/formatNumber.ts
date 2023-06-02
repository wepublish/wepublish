export const formatNumber = (value: number) => {
  const formatter = new Intl.NumberFormat('ch-DE', {maximumSignificantDigits: 3})
  const result = formatter.formatToParts(value)

  // it's returned wrongly by the browser
  return result.map(val => (val.value === ',' ? "'" : val.value)).join('')
}
