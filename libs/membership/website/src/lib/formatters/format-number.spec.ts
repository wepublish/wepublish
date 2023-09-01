import {formatNumber} from './format-number'

describe('formatNumber', () => {
  it('should format a number in the swiss german locale', () => {
    expect(formatNumber(50000, 'ch-DE')).toMatchInlineSnapshot(`"50'000"`)
  })

  it('should format a number in another locale', () => {
    expect(formatNumber(50000, 'de-DE')).toMatchInlineSnapshot(`"50.000"`)
  })
})
