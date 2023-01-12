import { Prisma, PrismaClient, Subscription } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { SubscriptionFilter, SubscriptionSort } from '../../db/subscription';
import { SortOrder } from '../queries/sort';
export declare const createSubscriptionOrder: (field: SubscriptionSort, sortOrder: SortOrder) => Prisma.SubscriptionFindManyArgs['orderBy'];
export declare const createSubscriptionFilter: (filter: Partial<SubscriptionFilter>) => Prisma.SubscriptionWhereInput;
export declare const getSubscriptions: (filter: Partial<SubscriptionFilter>, sortedField: SubscriptionSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, subscription: PrismaClient['subscription']) => Promise<ConnectionResult<Subscription>>;
//# sourceMappingURL=subscription.queries.d.ts.map