import { PrismaClient } from '@prisma/client';
import { Context } from '../../context';
import { SubscriptionFilter, SubscriptionSort } from '../../db/subscription';
export declare const getSubscriptionById: (id: string, authenticate: Context['authenticate'], subscription: PrismaClient['subscription']) => import(".prisma/client").Prisma.Prisma__SubscriptionClient<(import(".prisma/client").Subscription & {
    deactivation: import(".prisma/client").SubscriptionDeactivation | null;
    periods: import(".prisma/client").SubscriptionPeriod[];
    properties: import(".prisma/client").MetadataProperty[];
}) | null>;
export declare const getAdminSubscriptions: (filter: Partial<SubscriptionFilter>, sortedField: SubscriptionSort, order: 1 | -1, cursorId: string | null, skip: number, take: number, authenticate: Context['authenticate'], subscription: PrismaClient['subscription']) => Promise<import("../..").ConnectionResult<import(".prisma/client").Subscription>>;
export declare const getSubscriptionsAsCSV: (filter: SubscriptionFilter, authenticate: Context['authenticate'], subscription: PrismaClient['subscription']) => Promise<string>;
export declare const getNewSubscribersYear: (authenticate: Context['authenticate'], subscription: PrismaClient['subscription']) => Promise<{
    month: string;
    subscriberCount: number;
}[]>;
export declare const getActiveSubscriptionsHistory: (subscription: PrismaClient['subscription']) => Promise<void>;
//# sourceMappingURL=subscription.private-queries.d.ts.map