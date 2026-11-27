import { Prisma, Subscription } from '@prisma/client';

type LegacyState = Pick<Subscription, 'importedAt' | 'legacyEndedAt'>;

/**
 * A legacy subscription was imported from another system and has not had a
 * payment registered here yet. The first paid invoice ends the state; that it
 * was imported stays on record.
 */
export const isLegacySubscription = ({
  importedAt,
  legacyEndedAt,
}: LegacyState): boolean => !!importedAt && !legacyEndedAt;

/** The same rule as a query: legacy subscriptions, or all the others. */
export const legacySubscriptionWhere = (
  legacy: boolean
): Prisma.SubscriptionWhereInput =>
  legacy ?
    { importedAt: { not: null }, legacyEndedAt: null }
  : { OR: [{ importedAt: null }, { legacyEndedAt: { not: null } }] };

/** A flow that does not tell legacy subscriptions apart is for both. */
export const LEGACY_AND_OTHERS: readonly boolean[] = [true, false];

export const isForLegacyAndOthers = (legacy: readonly boolean[]): boolean =>
  LEGACY_AND_OTHERS.every(value => legacy.includes(value));

/** The subscriptions a flow's legacy setting lets in; nothing to add for both. */
export const flowLegacyWhere = (
  legacy: readonly boolean[]
): Prisma.SubscriptionWhereInput[] =>
  isForLegacyAndOthers(legacy) ? [] : legacy.map(legacySubscriptionWhere);
