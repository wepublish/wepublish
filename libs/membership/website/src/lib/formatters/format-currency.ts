import {Currency} from '@wepublish/website/api'

export const formatCurrency = (value: number, currency: Currency, locale = 'de-CH') => {
  const formatter = new Intl.NumberFormat(locale, {style: 'currency', currency})
  let result = formatter.format(value)

  if (currency === Currency.Chf && result.endsWith('.00')) {
    result = result.replace('.00', '.-')
  }

  return result
}
