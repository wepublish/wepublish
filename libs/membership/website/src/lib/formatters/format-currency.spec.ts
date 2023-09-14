/* eslint-disable no-irregular-whitespace */
import {formatChf} from './format-currency'

describe('formatChf', () => {
  it('should format a number without decimals in the swiss german locale', () => {
    expect(formatChf(50000, 'ch-DE')).toMatchInlineSnapshot(`"CHF 50'000.-"`)
  })

  it('should format a number with decimals in the swiss german locale', () => {
    expect(formatChf(50000.25, 'ch-DE')).toMatchInlineSnapshot(`"CHF 50'000.25"`)
  })

  it('should format a number in another locale', () => {
    expect(formatChf(50000, 'de-DE')).toMatchInlineSnapshot(`"50.000,00 CHF"`)
  })
})
