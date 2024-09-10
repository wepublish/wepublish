export const fixCHNumberDelimiter = (value: number, formatter: Intl.NumberFormat) => {
  const result = formatter.formatToParts(value)

  // it's returned wrongly by the browser
  return result.map(val => (val.value === ',' && val.type === 'group' ? "'" : val.value)).join('')
}
