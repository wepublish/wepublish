import { FullSubscriptionFragment } from '@wepublish/website/api';

type SubscriptionState = Pick<
  FullSubscriptionFragment,
  'deactivation' | 'isActive'
>;

export const isSubscriptionActive = ({
  deactivation,
  isActive,
}: SubscriptionState) => !deactivation || isActive;

export const isSubscriptionDeactivated = (subscription: SubscriptionState) =>
  !isSubscriptionActive(subscription);
