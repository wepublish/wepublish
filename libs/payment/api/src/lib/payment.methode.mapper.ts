import { StripePaymentMethod, PayrexxPSP, PayrexxPM } from '@prisma/client';
import { PaymentMethod } from '@mollie/api-client';
import Stripe from 'stripe';

const StripePaymentMethod_ID = {
  ACSS_DEBIT: 'acss_debit',
  AFTERPAY_CLEARPAY: 'afterpay_clearpay',
  ALIPAY: 'alipay',
  AU_BECS_DEBIT: 'au_becs_debit',
  BACS_DEBIT: 'bacs_debit',
  BANCONTACT: 'bancontact',
  BOLETO: 'boleto',
  CARD: 'card',
  EPS: 'eps',
  FPX: 'fpx',
  GIROPAY: 'giropay',
  GRABPAY: 'grabpay',
  IDEAL: 'ideal',
  KLARNA: 'klarna',
  KONBINI: 'konbini',
  OXXO: 'oxxo',
  P24: 'p24',
  PAYNOW: 'paynow',
  SEPA_DEBIT: 'sepa_debit',
  SOFORT: 'sofort',
  US_BANK_ACCOUNT: 'us_bank_account',
  WECHAT_PAY: 'wechat_pay',
} as const;

export const PayrexxPSP_ID = {
  PAYREXX_PAY: 44,
  PAYREXX_PAY_PLUS: 36,
  POSTFINANCE_ECOMMERCE: 2,
  PAYPAL: 3,
  STRIPE: 5,
  OGONE_BASIC: 6,
  GIROPAY: 7,
  OGONE_ALIAS_GATEWAY: 8,
  CONCARDIS_PAY_ENGINE: 9,
  CONCARDIS_BASIC: 10,
  COINBASE: 11,
  POSTFINANCE_ALIAS_GATEWAY: 12,
  BRAINTREE: 13,
  KLARNA: 14,
  INVOICE: 15,
  TWINT: 17,
  SAFERPAY: 18,
  DATATRANS: 20,
  CCAVENUE: 21,
  VIVEUM: 22,
  REKA: 23,
  SWISSBILLING: 24,
  PAYONE: 25,
  PAYREXX_PAYMENTS_BY_STRIPE: 26,
  VORKASSE: 27,
  CONCARDIS_PAYENGINE: 29,
  WIRPAY: 30,
  MOLLIE: 31,
  SKRILL: 32,
  VRPAY: 33,
  WORLDPAY: 34,
  PAYSAFECASH: 35,
  UTRUST: 37,
  POINTS_PAY: 38,
  AMAZON_PAY: 39,
  CLEARHAUS_ACQUIRING: 40,
  POSTFINANCE_CHECKOUT: 41,
  BARZAHLEN_VIACASH: 45,
  POWERPAY: 55,
  CEMBRAPAY: 56,
} as const;

export const PayrexxPaymentMethod_ID = {
  ALIPAY: 'alipay',
  AMAZON_PAY: 'amazon-pay',
  AMERICAN_EXPRESS: 'american-express',
  APPLE_PAY: 'apple-pay',
  BANCONTACT: 'bancontact',
  BANK_TRANSFER: 'bank-transfer',
  CARTES_BANCAIRES: 'cartes-bancaires',
  CRYPTO: 'crypto',
  DINERS_CLUB: 'diners-club',
  DISCOVER: 'discover',
  EPS: 'eps',
  GIROPAY: 'giropay',
  GOOGLE_PAY: 'google-pay',
  IDEAL: 'ideal',
  INVOICE: 'invoice',
  JCB: 'jcb',
  MAESTRO: 'maestro',
  MASTERCARD: 'mastercard',
  PAY_BY_BANK: 'pay-by-bank',
  PAYPAL: 'paypal',
  POST_FINANCE_PAY: 'post-finance-pay',
  POWERPAY: 'powerpay',
  PREPAYMENT: 'prepayment',
  SAMSUNG_PAY: 'samsung-pay',
  SEPA_DIRECT_DEBIT: 'sepa-direct-debit',
  KLARNA: 'klarna',
  TWINT: 'twint',
  UNIONPAY: 'unionpay',
  VERD_CASH: 'verd-cash',
  VISA: 'visa',
  V_PAY: 'v-pay',
  WECHAT_PAY: 'wechat-pay',
  SWISSCOM_PAY: 'swisscom-pay',
} as const;

export const Mollie_PaymentMethod_ID = {
  ALMA: 'alma',
  APPLEPAY: 'applepay',
  BACS: 'bacs',
  BANCOMATPAY: 'bancomatpay',
  BANCONTACT: 'bancontact',
  BANKTRANSFER: 'banktransfer',
  BELFIUS: 'belfius',
  BILLIE: 'billie',
  BLIK: 'blik',
  CREDITCARD: 'creditcard',
  DIRECTDEBIT: 'directdebit',
  EPS: 'eps',
  GIFTCARD: 'giftcard',
  IDEAL: 'ideal',
  IN3: 'in3',
  KBC: 'kbc',
  KLARNA: 'klarna',
  KLARNAPAYLATER: 'klarnapaylater',
  KLARNAPAYNOW: 'klarnapaynow',
  KLARNASLICEIT: 'klarnasliceit',
  MYBANK: 'mybank',
  PAYPAL: 'paypal',
  PAYSAFECARD: 'paysafecard',
  PRZELEWY24: 'przelewy24',
  RIVERTY: 'riverty',
  SATISPAY: 'satispay',
  TRUSTLY: 'trustly',
  TWINT: 'twint',
  VOUCHER: 'voucher',
} as const;

// Paxrexx PM

export function mapPayrexxPaymentMethods(methods: PayrexxPM[]): string[] {
  return methods.map(method => PayrexxPaymentMethod_ID[method]);
}

// Payrexx PSP

export function mapPayrexxPSPs(psps: PayrexxPSP[]): number[] {
  return psps.map(psp => PayrexxPSP_ID[psp]);
}

// Stripe

export function mapStripePaymentMethodTypes(
  methods: StripePaymentMethod[]
): string[] {
  return methods.map(method => StripePaymentMethod_ID[method]);
}

export function mapStripePaymentMethodTypesTyped(
  methods: StripePaymentMethod[]
): Stripe.Checkout.SessionCreateParams.PaymentMethodType[] {
  return methods.map(method => StripePaymentMethod_ID[method]);
}

// Mollie

export function mapMolliePaymentMethods(
  methods: (keyof typeof Mollie_PaymentMethod_ID)[]
): PaymentMethod[] {
  return methods.map(
    method => Mollie_PaymentMethod_ID[method]
  ) as PaymentMethod[];
}
