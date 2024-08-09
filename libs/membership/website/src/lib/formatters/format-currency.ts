import {Currency} from '@wepublish/website/api'
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

export const formatCurrency = (value: number, currency: Currency, locale = 'ch-DE') => {
  if (currency === Currency.Chf) {
    return formatChf(value, locale)
  }

  const formatter = new Intl.NumberFormat(locale, {style: 'currency', currency})
  let result = formatter.format(value)

  if (locale === 'ch-DE') {
    result = fixCHNumberDelimiter(value, formatter)
  }

  return result
}
