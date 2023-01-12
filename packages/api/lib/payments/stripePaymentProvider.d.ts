import { BasePaymentProvider, CheckIntentProps, CreatePaymentIntentProps, Intent, IntentState, PaymentProviderProps, WebhookForPaymentIntentProps } from './paymentProvider';
import Stripe from 'stripe';
export interface StripePaymentProviderProps extends PaymentProviderProps {
    secretKey: string;
    webhookEndpointSecret: string;
}
interface CreateStripeCustomerProps {
    intent: Stripe.PaymentIntent;
}
export declare class StripePaymentProvider extends BasePaymentProvider {
    readonly stripe: Stripe;
    readonly webhookEndpointSecret: string;
    constructor(props: StripePaymentProviderProps);
    createStripeCustomer({ intent }: CreateStripeCustomerProps): Promise<string>;
    getWebhookEvent(body: any, signature: string): Stripe.Event;
    webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>;
    createIntent({ customerID, invoice, saveCustomer, paymentID }: CreatePaymentIntentProps): Promise<Intent>;
    checkIntentStatus({ intentID }: CheckIntentProps): Promise<IntentState>;
}
export {};
//# sourceMappingURL=stripePaymentProvider.d.ts.map