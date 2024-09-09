import {Currency} from '@wepublish/website/api'
import {fixCHNumberDelimiter} from './format-number'

const formatChf = (value: number, locale = 'ch-DE') => {
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
  let result: string

  if (currency === Currency.Chf) {
    result = formatChf(value, locale)
  } else {
    const formatter = new Intl.NumberFormat(locale, {style: 'currency', currency})
    result = formatter.format(value)
  }

  return (
    result
      // Replacing those as CI & locally behave different
      .replace(/EUR[\s]?/, '€')
      .replace('’', "'")
  )
}
