import { SubscriptionEvent } from '@prisma/client';

export const subscriptionFlowDaysAwayFromEndingNeedToBeNull: SubscriptionEvent[] =
  [
    SubscriptionEvent.SUBSCRIBE,
    SubscriptionEvent.CONFIRM_SUBSCRIPTION,
    SubscriptionEvent.DEACTIVATION_BY_USER,
    SubscriptionEvent.RENEWAL_FAILED,
    SubscriptionEvent.RENEWAL_SUCCESS,
  ];

export const subscriptionFlowNonUniqueEvents: SubscriptionEvent[] = [
  SubscriptionEvent.CUSTOM,
];

export const subscriptionFlowRequiredEvents: SubscriptionEvent[] = [
  SubscriptionEvent.INVOICE_CREATION,
  SubscriptionEvent.DEACTIVATION_UNPAID,
];
