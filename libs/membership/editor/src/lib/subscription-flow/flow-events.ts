import { SubscriptionEvent } from '@wepublish/editor/api';

export const USER_ACTION_EVENTS = [
  SubscriptionEvent.Subscribe,
  SubscriptionEvent.ConfirmSubscription,
  SubscriptionEvent.RenewalSuccess,
  SubscriptionEvent.RenewalFailed,
  SubscriptionEvent.DeactivationByUser,
] as const;
export type UserActionEvents = (typeof USER_ACTION_EVENTS)[number];

export const NON_USER_ACTION_EVENTS = [
  SubscriptionEvent.InvoiceCreation,
  SubscriptionEvent.DeactivationUnpaid,
  SubscriptionEvent.Custom,
] as const;
export type NonUserActionEvents = (typeof NON_USER_ACTION_EVENTS)[number];

export function isNonUserEvent(
  event: SubscriptionEvent
): event is NonUserActionEvents {
  return NON_USER_ACTION_EVENTS.includes(event as NonUserActionEvents);
}
