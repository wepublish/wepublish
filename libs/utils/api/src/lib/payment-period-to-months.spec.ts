import {PaymentPeriodicity} from '@prisma/client'
import {mapPaymentPeriodToMonths} from '../../../src/lib/payment-period-to-months'

describe('formatPaymentPeriod', () => {
  it.each([
    PaymentPeriodicity.monthly,
    PaymentPeriodicity.quarterly,
    PaymentPeriodicity.biannual,
    PaymentPeriodicity.yearly
  ])('should format payment period for %s', periodicity => {
    expect(mapPaymentPeriodToMonths(periodicity)).toMatchSnapshot()
  })
})
