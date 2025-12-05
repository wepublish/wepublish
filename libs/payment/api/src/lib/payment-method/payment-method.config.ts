import { PaymentProvider } from '../payment-provider/payment-provider';

export const PAYMENT_METHOD_CONFIG = Symbol('PAYMENT_METHOD_CONFIG');
export type PaymentMethodConfig = {
  paymentProviders: PaymentProvider[];
};
