import { isActiveSubscription } from '../subscription/is-subscription-active';

export type EligibilityList = {
  requiresSubscription: boolean;
  anyMemberPlan: boolean;
  memberPlanIds: string[];
};

export type EligibilitySubscription = {
  memberPlanID: string;
  confirmed: boolean;
  startsAt: Date;
  paidUntil: Date | null;
  gracePeriod: number;
};

export const isEligibleForNewsletterList = (
  list: EligibilityList,
  subscriptions: EligibilitySubscription[]
): boolean => {
  if (!list.requiresSubscription) {
    return true;
  }

  return subscriptions.some(
    subscription =>
      subscription.confirmed &&
      (list.anyMemberPlan ||
        list.memberPlanIds.includes(subscription.memberPlanID)) &&
      isActiveSubscription(subscription)
  );
};
