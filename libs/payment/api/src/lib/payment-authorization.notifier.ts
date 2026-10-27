import { Injectable } from '@nestjs/common';
import { AuthorizationState } from './payment-provider/payment-provider';

export interface PaymentAuthorizationListener {
  onAuthorization(
    paymentProviderID: string,
    state: AuthorizationState
  ): Promise<void>;
}

/**
 * Hands the authorization states a payment provider reports through its
 * webhook to whoever tracks them (the payment method changes of
 * subscriptions), without the payment lib depending on them.
 */
@Injectable()
export class PaymentAuthorizationNotifier {
  private listeners: PaymentAuthorizationListener[] = [];

  public register(listener: PaymentAuthorizationListener) {
    this.listeners.push(listener);
  }

  /** Failures are let through so the webhook fails and the provider retries. */
  public async notify(
    paymentProviderID: string,
    state: AuthorizationState
  ): Promise<void> {
    for (const listener of this.listeners) {
      await listener.onAuthorization(paymentProviderID, state);
    }
  }
}
