import { PaymentPeriodicity } from '@wepublish/editor/api';
import { ALL_PAYMENT_PERIODICITIES } from '@wepublish/ui/editor';

type PlanPeriodicities = {
  periodicityPricing?: { periodicity: PaymentPeriodicity }[] | null;
  defaultPaymentPeriodicity?: PaymentPeriodicity | null;
};

/**
 * The periodicities a member plan offers: the ones it has a price for,
 * shortest first. A plan without prices, or no plan yet, restricts nothing.
 */
export function offeredPeriodicities(
  memberPlan: PlanPeriodicities | null | undefined
): PaymentPeriodicity[] {
  const priced = new Set(
    memberPlan?.periodicityPricing?.map(price => price.periodicity)
  );

  if (!priced.size) {
    return ALL_PAYMENT_PERIODICITIES;
  }

  return ALL_PAYMENT_PERIODICITIES.filter(periodicity =>
    priced.has(periodicity)
  );
}

/**
 * What the periodicity picker lists: what the plan offers, plus the
 * periodicity the subscription has, so an existing one that is off its plan
 * still shows what it is.
 */
export function selectablePeriodicities(
  memberPlan: PlanPeriodicities | null | undefined,
  current: PaymentPeriodicity
): PaymentPeriodicity[] {
  const offered = offeredPeriodicities(memberPlan);

  return ALL_PAYMENT_PERIODICITIES.filter(
    periodicity => offered.includes(periodicity) || periodicity === current
  );
}

/**
 * The periodicity a subscription gets when a plan is chosen. A new
 * subscription takes the plan's default (its only one, or the shortest when
 * the plan names none); an existing one keeps its own while the plan offers it.
 */
export function periodicityForPlan(
  memberPlan: PlanPeriodicities,
  current: PaymentPeriodicity,
  { isNew }: { isNew: boolean }
): PaymentPeriodicity {
  if (!memberPlan.periodicityPricing?.length) {
    return current;
  }

  const offered = offeredPeriodicities(memberPlan);

  if (!isNew && offered.includes(current)) {
    return current;
  }

  const planDefault = memberPlan.defaultPaymentPeriodicity;

  return planDefault && offered.includes(planDefault) ?
      planDefault
    : offered[0];
}
