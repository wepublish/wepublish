import { PaymentPeriodicity } from '@wepublish/website/api';
import { cond } from 'ramda';

export const formatRenewalPeriod = cond([
  [period => period === PaymentPeriodicity.Monthly, () => 'Monatlich'],
  [period => period === PaymentPeriodicity.Quarterly, () => 'Vierteljährlich'],
  [period => period === PaymentPeriodicity.Biannual, () => 'Halbjährlich'],
  [period => period === PaymentPeriodicity.Biennial, () => 'Zweijährlich'],
  [period => period === PaymentPeriodicity.Lifetime, () => 'Lebenslang'],
  [(period: PaymentPeriodicity) => true, () => 'Jährlich'],
]);
