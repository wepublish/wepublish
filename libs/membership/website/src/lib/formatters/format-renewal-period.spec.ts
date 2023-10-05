import {PaymentPeriodicity} from '@wepublish/website/api'
import {formatRenewalPeriod} from './format-renewal-period'

describe('formatRenewalPeriod', () => {
  it.each([
    PaymentPeriodicity.Monthly,
    PaymentPeriodicity.Quarterly,
    PaymentPeriodicity.Biannual,
    PaymentPeriodicity.Yearly
  ])('should format renewal period for %s', periodicity => {
    expect(formatRenewalPeriod(periodicity)).toMatchSnapshot()
  })
})
