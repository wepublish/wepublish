/* eslint-disable no-irregular-whitespace */
import {Currency} from '@wepublish/website/api'
import {formatCurrency} from './format-currency'

describe('formatCurrency', () => {
  it('should format CHF without decimals in the swiss german locale', () => {
    expect(formatCurrency(50000, Currency.Chf, 'de-CH')).toMatchInlineSnapshot(`"CHF 50’000.-"`)
  })

  it('should format CHF with decimals in the swiss german locale', () => {
    expect(formatCurrency(50000.25, Currency.Chf, 'de-CH')).toMatchInlineSnapshot(`"CHF 50’000.25"`)
  })

  it('should format CHF in another locale', () => {
    expect(formatCurrency(50000, Currency.Chf, 'de-DE')).toMatchInlineSnapshot(`"50.000,00 CHF"`)
  })

  it('should format a number without decimals in the swiss german locale but as euros', () => {
    expect(formatCurrency(50000, Currency.Eur, 'de-CH')).toMatchInlineSnapshot(`"EUR 50’000.00"`)
  })

  it('should format a number without decimals in the german locale as euros', () => {
    expect(formatCurrency(50000, Currency.Eur, 'de-DE')).toMatchInlineSnapshot(`"50.000,00 €"`)
  })
})
