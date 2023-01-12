import { BasePaymentProvider, CheckIntentProps, CreatePaymentIntentProps, Intent, IntentState, PaymentProviderProps, WebhookForPaymentIntentProps } from './paymentProvider';
import Stripe from 'stripe';
export interface StripeCheckoutPaymentProviderProps extends PaymentProviderProps {
    secretKey: string;
    webhookEndpointSecret: string;
}
export declare class StripeCheckoutPaymentProvider extends BasePaymentProvider {
    readonly stripe: Stripe;
    readonly webhookEndpointSecret: string;
    constructor(props: StripeCheckoutPaymentProviderProps);
    getWebhookEvent(body: any, signature: string): Stripe.Event;
    webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>;
    createIntent(props: CreatePaymentIntentProps): Promise<Intent>;
    checkIntentStatus({ intentID }: CheckIntentProps): Promise<IntentState>;
}
//# sourceMappingURL=stripeCheckoutPaymentProvider.d.ts.map