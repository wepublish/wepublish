import {PaymentPeriodicity} from '@prisma/client'

export function mapPaymentPeriodToMonths(periodicity: PaymentPeriodicity) {
  switch (periodicity) {
    case PaymentPeriodicity.yearly:
      return 12
    case PaymentPeriodicity.biannual:
      return 6
    case PaymentPeriodicity.quarterly:
      return 3
    case PaymentPeriodicity.monthly:
      return 1
    default:
      throw new Error(`Enum for PaymentPeriodicity ${periodicity} not defined!`)
  }
}
