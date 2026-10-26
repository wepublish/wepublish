import { anyPass } from 'ramda';
import { addDays } from 'date-fns';

export type SubscriptionData = {
  startsAt: Date;
  gracePeriod: number;
  paidUntil?: Date | null;
};

const isWithinGracePeriod = <T extends SubscriptionData>({
  gracePeriod,
  startsAt,
  paidUntil,
}: T): boolean => {
  if (!gracePeriod) {
    return false;
  }

  const today = new Date();
  const startDate = new Date(paidUntil || startsAt);
  const gracePeriodEnd = addDays(startDate, gracePeriod);

  return gracePeriodEnd >= today;
};

const isPaidSubscription = <T extends SubscriptionData>({
  startsAt,
  paidUntil,
}: T): boolean => {
  const today = new Date();

  return !!(
    paidUntil &&
    today > new Date(startsAt) &&
    new Date(paidUntil) > today
  );
};

export const isActiveSubscription = anyPass([
  isPaidSubscription,
  isWithinGracePeriod,
]);
