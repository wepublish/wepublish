import {fixCHNumberDelimiter} from './format-number'

describe('fixCHNumberDelimiter', () => {
  const formatter = new Intl.NumberFormat('ch-DE', {maximumSignificantDigits: 3})

  it('should format a number in the swiss german locale', () => {
    expect(fixCHNumberDelimiter(50000, formatter)).toMatchInlineSnapshot(`"50’000"`)
  })
})
