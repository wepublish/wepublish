import { ChipProps } from '@mui/material';

export type SubscriptionState =
  'active' | 'planned' | 'unpaid' | 'expired' | 'deactivated';

export type SubscriptionStateInput = {
  startsAt: string | Date;
  paidUntil?: string | Date | null;
  deactivation?: { date: string | Date } | null;
  createdAt?: string | Date;
};

/** How the editor and the websites show each state as an MUI chip. */
export const SUBSCRIPTION_STATE_CHIP: Record<
  SubscriptionState,
  { color: ChipProps['color']; variant: ChipProps['variant'] }
> = {
  deactivated: { color: 'error', variant: 'filled' },
  planned: { color: 'info', variant: 'filled' },
  active: { color: 'success', variant: 'filled' },
  expired: { color: 'warning', variant: 'filled' },
  unpaid: { color: 'warning', variant: 'outlined' },
};

/**
 * A subscription's state from its dates alone. A deactivation wins even when
 * its date is still ahead; show that date next to the state.
 */
export function getSubscriptionState(
  subscription: SubscriptionStateInput,
  now = new Date()
): SubscriptionState {
  if (subscription.deactivation) {
    return 'deactivated';
  }

  if (new Date(subscription.startsAt) > now) {
    return 'planned';
  }

  if (!subscription.paidUntil) {
    return 'unpaid';
  }

  if (new Date(subscription.paidUntil) < now) {
    return 'expired';
  }

  return 'active';
}

const time = (date?: string | Date | null) =>
  date ? new Date(date).getTime() : 0;

/**
 * Active subscriptions first, then the furthest paidUntil, then the newest
 * (createdAt, or startsAt where a client does not load createdAt).
 */
export function compareSubscriptions(
  a: SubscriptionStateInput,
  b: SubscriptionStateInput,
  now = new Date()
): number {
  const isActive = (subscription: SubscriptionStateInput) =>
    getSubscriptionState(subscription, now) === 'active';

  return (
    Number(isActive(b)) - Number(isActive(a)) ||
    time(b.paidUntil) - time(a.paidUntil) ||
    time(b.createdAt ?? b.startsAt) - time(a.createdAt ?? a.startsAt)
  );
}
