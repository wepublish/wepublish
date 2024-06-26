import {fixCHNumberDelimiter} from './format-number'

export const formatChf = (value: number, locale = 'ch-DE') => {
  const formatter = new Intl.NumberFormat(locale, {style: 'currency', currency: 'CHF'})
  let result = formatter.format(value)

  if (locale === 'ch-DE') {
    result = fixCHNumberDelimiter(value, formatter)
  }

  if (result.endsWith('.00')) {
    return result.replace('.00', '.-')
  }

  return result
}
