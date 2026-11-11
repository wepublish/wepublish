import { useCallback, useSyncExternalStore } from 'react';
import {
  FullSubscriptionFragment,
  PaymentPeriodicity,
} from '@wepublish/website/api';
import {
  calculatePeriodAmount,
  getPeriodPriceRange,
  monthlyAmountFromPeriodAmount,
} from '../formatters/format-payment-period';

/**
 * The monthly amount a subscription has after switching to another
 * periodicity: the reader's own, raised to the minimum of the new periodicity
 * when the plan prices it higher. Mirrors PeriodicitySwitchService in the api.
 */
export function switchedMonthlyAmount(
  {
    memberPlan,
    monthlyAmount,
  }: Pick<FullSubscriptionFragment, 'memberPlan' | 'monthlyAmount'>,
  periodicity: PaymentPeriodicity
): number {
  const { amountMin } = getPeriodPriceRange(memberPlan, periodicity);

  return calculatePeriodAmount(monthlyAmount, periodicity) < amountMin ?
      monthlyAmountFromPeriodAmount(amountMin, periodicity)
    : monthlyAmount;
}

/** The query parameter a link (e.g. in a mail) asks to switch to yearly with. */
export const SWITCH_TO_PARAM = 'switchTo';

const isRequested = () =>
  new URL(window.location.href).searchParams.get(SWITCH_TO_PARAM) === 'yearly';

const subscribe = (onChange: () => void) => {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
};

/**
 * Whether the page was opened with `?switchTo=yearly`, e.g. from a mail to
 * readers who pay monthly. Never on the server, so hydration matches. `clear`
 * drops the parameter from the url once it is handled, so a reload does not
 * ask again. Works the same for Next.js and TanStack tenants as it does not
 * go through their routers.
 */
export function useSwitchToYearlyRequest() {
  const requested = useSyncExternalStore(subscribe, isRequested, () => false);

  const clear = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete(SWITCH_TO_PARAM);
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  return { requested, clear };
}
