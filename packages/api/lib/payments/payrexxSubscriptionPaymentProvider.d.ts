import { BasePaymentProvider, CheckIntentProps, CreatePaymentIntentProps, Intent, IntentState, PaymentProviderProps, UpdatePaymentWithIntentStateProps, WebhookForPaymentIntentProps } from './paymentProvider';
import { PrismaClient } from '@prisma/client';
export interface PayrexxSubscripionsPaymentProviderProps extends PaymentProviderProps {
    instanceName: string;
    instanceAPISecret: string;
    webhookSecret: string;
    prisma: PrismaClient;
}
export declare class PayrexxSubscriptionPaymentProvider extends BasePaymentProvider {
    readonly instanceName: string;
    readonly instanceAPISecret: string;
    readonly webhookSecret: string;
    constructor(props: PayrexxSubscripionsPaymentProviderProps);
    activateHook(prisma: PrismaClient): void;
    updatePaymentWithIntentState({ intentState, paymentClient, paymentsByID, invoicesByID, subscriptionClient, userClient, invoiceClient, subscriptionPeriodClient, invoiceItemClient }: UpdatePaymentWithIntentStateProps): Promise<any>;
    updateRemoteSubscription(subscriptionId: number, amount: string): Promise<void>;
    cancelRemoteSubscription(subscriptionId: number): Promise<void>;
    webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>;
    createIntent(props: CreatePaymentIntentProps): Promise<Intent>;
    checkIntentStatus({ intentID }: CheckIntentProps): Promise<IntentState>;
}
//# sourceMappingURL=payrexxSubscriptionPaymentProvider.d.ts.map