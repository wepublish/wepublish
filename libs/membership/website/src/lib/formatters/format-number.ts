export const fixCHNumberDelimiter = (value: number, formatter: Intl.NumberFormat) => {
  const result = formatter.formatToParts(value)

  // it's returned wrongly by the browser
  return result.map(val => (val.value === ',' && val.type === 'group' ? "'" : val.value)).join('')
}

export const formatNumber = (value: number, locale = 'ch-DE') => {
  const formatter = new Intl.NumberFormat(locale, {maximumSignificantDigits: 3})

  if (locale === 'ch-DE') {
    return fixCHNumberDelimiter(value, formatter)
  }

  return formatter.format(value)
}
