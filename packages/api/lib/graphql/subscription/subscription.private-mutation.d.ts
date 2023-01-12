import { Context } from '../../context';
import { Prisma, PrismaClient } from '@prisma/client';
export declare const deleteSubscriptionById: (id: string, authenticate: Context['authenticate'], subscription: PrismaClient['subscription']) => Prisma.Prisma__SubscriptionClient<import(".prisma/client").Subscription & {
    deactivation: import(".prisma/client").SubscriptionDeactivation | null;
    periods: import(".prisma/client").SubscriptionPeriod[];
    properties: import(".prisma/client").MetadataProperty[];
}>;
declare type CreateSubscriptionInput = Prisma.SubscriptionCreateInput & {
    properties: Prisma.MetadataPropertyCreateManySubscriptionInput[];
};
export declare const createSubscription: ({ properties, ...input }: CreateSubscriptionInput, authenticate: Context['authenticate'], memberContext: Context['memberContext'], subscriptionClient: PrismaClient['subscription']) => Promise<import(".prisma/client").Subscription & {
    deactivation: import(".prisma/client").SubscriptionDeactivation | null;
    periods: import(".prisma/client").SubscriptionPeriod[];
    properties: import(".prisma/client").MetadataProperty[];
}>;
declare type UpdateSubscriptionInput = Prisma.SubscriptionUncheckedUpdateInput & {
    properties: Prisma.MetadataPropertyCreateManySubscriptionInput[];
    deactivation: Prisma.SubscriptionDeactivationCreateWithoutSubscriptionInput | null;
};
export declare const updateAdminSubscription: (id: string, { properties, deactivation, ...input }: UpdateSubscriptionInput, authenticate: Context['authenticate'], memberContext: Context['memberContext'], subscriptionClient: PrismaClient['subscription'], userClient: PrismaClient['user']) => Promise<import(".prisma/client").Subscription>;
export {};
//# sourceMappingURL=subscription.private-mutation.d.ts.map