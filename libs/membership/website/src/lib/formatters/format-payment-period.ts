import { PaymentPeriodicity } from '@wepublish/website/api';
import { cond } from 'ramda';

export const formatFirstPaymentPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'Erster Monat'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'Ersten 4 Monate'],
  [period => period === PaymentPeriodicity.Biannual, () => 'Ersten 6 Monate'],
  [period => period === PaymentPeriodicity.Biennial, () => 'Ersten 2 Jahre'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'Erstes Jahr'],
]);

export const formatPaymentPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => '1 Monat'],
  [period => period === PaymentPeriodicity.Quarterly, () => '3 Monate'],
  [period => period === PaymentPeriodicity.Biannual, () => '6 Monate'],
  [period => period === PaymentPeriodicity.Biennial, () => '2 Jahre'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => '1 Jahr'],
]);

export const formatPaymentTimeline = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'monatlich'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'vierteljährlich'],
  [period => period === PaymentPeriodicity.Biannual, () => 'halbjährlich'],
  [period => period === PaymentPeriodicity.Biennial, () => 'zweijährlich'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'jährlich'],
]);

export const getPaymentPeriodicyMonths = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 1],
  [period => period === PaymentPeriodicity.Quarterly, () => 3],
  [period => period === PaymentPeriodicity.Biannual, () => 6],
  [period => period === PaymentPeriodicity.Biennial, () => 24],
  [period => period === PaymentPeriodicity.Lifetime, () => 1200],
  [(period: PaymentPeriodicity) => true, () => 12],
]);
