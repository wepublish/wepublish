import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps,
  WebhookResponse,
} from './payment-provider';
import { PaymentState } from '@prisma/client';

export class NeverChargePaymentProvider extends BasePaymentProvider {
  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse> {
    throw new Error('Not implemented');
  }

  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    return {
      intentID: `no_charge_${new Date().getTime()}`,
      intentSecret: '',
      intentData: '',
      paidAt: new Date(),
      state: PaymentState.paid,
    };
  }

  async checkIntentStatus({
    intentID,
    paymentID,
  }: CheckIntentProps): Promise<IntentState> {
    return {
      state: PaymentState.paid,
      paidAt: new Date(),
      paymentID,
      paymentData: '',
    };
  }
}
