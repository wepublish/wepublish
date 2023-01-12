import { BasePaymentProvider, CheckIntentProps, CreatePaymentIntentProps, Intent, IntentState, PaymentProviderProps, WebhookForPaymentIntentProps } from './paymentProvider';
export interface PayrexxPaymentProviderProps extends PaymentProviderProps {
    instanceName: string;
    instanceAPISecret: string;
    psp: number[];
    pm: string[];
    vatRate: number;
}
export declare class PayrexxPaymentProvider extends BasePaymentProvider {
    readonly instanceName: string;
    readonly instanceAPISecret: string;
    readonly psp: number[];
    readonly pm: string[];
    readonly vatRate: number;
    constructor(props: PayrexxPaymentProviderProps);
    webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]>;
    createIntent(props: CreatePaymentIntentProps): Promise<Intent>;
    checkIntentStatus({ intentID }: CheckIntentProps): Promise<IntentState>;
}
//# sourceMappingURL=payrexxPaymentProvider.d.ts.map