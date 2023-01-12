import { Context } from '../../context';
import { Prisma, PrismaClient } from '@prisma/client';
export declare const updatePublicSubscription: (id: string, input: Pick<Prisma.SubscriptionUncheckedUpdateInput, 'memberPlanID' | 'paymentPeriodicity' | 'monthlyAmount' | 'autoRenew' | 'paymentMethodID'> & {
    deactivation: Prisma.SubscriptionDeactivationUncheckedUpdateInput;
}, authenticateUser: Context['authenticateUser'], memberContext: Context['memberContext'], activeMemberPlansByID: Context['loaders']['activeMemberPlansByID'], activePaymentMethodsByID: Context['loaders']['activePaymentMethodsByID'], subscriptionClient: PrismaClient['subscription']) => Promise<import(".prisma/client").Subscription>;
//# sourceMappingURL=subscription.public-mutation.d.ts.map