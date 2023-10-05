import {PaymentPeriodicity} from '@wepublish/website/api'
import {cond} from 'ramda'

export const formatPaymentPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => '1 Monat'],
  [period => period === PaymentPeriodicity.Quarterly, () => '3 Monate'],
  [period => period === PaymentPeriodicity.Biannual, () => '6 Monate'],
  [(period: PaymentPeriodicity) => true, () => '1 Jahr']
])

export const formatPaymentTimeline = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'monatlich'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'vierteljährlich'],
  [period => period === PaymentPeriodicity.Biannual, () => 'halbjährlich'],
  [(period: PaymentPeriodicity) => true, () => 'jährlich']
])

export const getPaymentPeriodicyMonths = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 1],
  [period => period === PaymentPeriodicity.Quarterly, () => 3],
  [period => period === PaymentPeriodicity.Biannual, () => 6],
  [(period: PaymentPeriodicity) => true, () => 12]
])
