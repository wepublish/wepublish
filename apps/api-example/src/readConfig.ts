import fs from 'fs';
import YAML from 'yaml';
import { MappedReplacer } from 'mapped-replacer';
import StipeType from 'stripe';
import {
  ProLitterisCountPixelProps,
  TrackingPixelProvider,
} from '@wepublish/tracking-pixel/api';
import { GoogleAnalyticsConfig } from '@wepublish/google-analytics/api';

type General = {
  apolloPlayground: boolean;
  apolloIntrospection: boolean;
  bcryptHashCostFactor: number;
  urlAdapter: 'default' | 'hauptstadt';
  sessionTTLDays: number;
};

type MailProvider = {
  id: string;
  fromAddress: string;
  replyToAddress: string;
  webhookURL: string;
  apiKey: string;
  baseDomain: string;
  webhookEndpointSecret: string;
  mailDomain: string;
  baseURL: string;
};

type Payrexx = {
  type: 'payrexx';
  id: string;
  name: string;
  instanceName: string;
  instanceAPISecret: string;
  offSessionPayments: boolean;
  webhookApiKey: string;
  psp: number[];
  pm: string[];
  vatRate: number;
};

type PayrexxSubscription = {
  type: 'payrexx-subscription';
  id: string;
  name: string;
  instanceName: string;
  instanceAPISecret: string;
  webhookEndpointSecret: string;
};

type Stripe = {
  type: 'stripe';
  id: string;
  name: string;
  offSessionPayments: boolean;
  secretKey: string;
  webhookEndpointSecret: string;
  methods: StipeType.Checkout.SessionCreateParams.PaymentMethodType[];
};

type StripeCheckout = {
  type: 'stripe-checkout';
  id: string;
  name: string;
  offSessionPayments: boolean;
  secretKey: string;
  webhookEndpointSecret: string;
  methods: StipeType.Checkout.SessionCreateParams.PaymentMethodType[];
};

type Bexio = {
  type: 'bexio';
  id: string;
  name: string;
  apiKey: string;
  userId: number;
  countryId: number;
  invoiceTemplateNewMembership: string;
  invoiceTemplateRenewalMembership: string;
  unitId: number;
  taxId: number;
  accountId: number;
  invoiceTitleNewMembership: string;
  invoiceTitleRenewalMembership: string;
  invoiceMailSubjectNewMembership: string;
  invoiceMailBodyNewMembership: string;
  invoiceMailSubjectRenewalMembership: string;
  invoiceMailBodyRenewalMembership: string;
  markInvoiceAsOpen: boolean;
};

type noCharge = {
  type: 'no-charge';
  id: string;
  name: string;
  offSessionPayments: boolean;
};

type karmaMediaServer = {
  type: 'karma';
};

type novaMediaServer = {
  type: 'nova';
};

type Mollie = {
  type: 'mollie';
  id: string;
  name: string;
  offSessionPayments: boolean;
  apiKey: string;
  webhookEndpointSecret: string;
  apiBaseUrl: string;
  methods?: string[];
};

type PaymentProvider =
  | Payrexx
  | PayrexxSubscription
  | Stripe
  | StripeCheckout
  | Bexio
  | noCharge
  | Mollie;

type AlgebraicCaptcha = {
  type: 'algebraic';
  secret: string;
  validTime: number;
  width: number;
  height: number;
  background: string;
  noise: number;
  minValue: number;
  maxValue: number;
  operandAmount: number;
  operandTypes: string[];
  mode: string;
  targetSymbol: string;
};

type Turnstile = {
  type: 'turnstile';
  secret: string;
  siteKey: string;
};

type ProLitteris = ProLitterisCountPixelProps & {
  type: 'prolitteris';
};

type TrackingPixels = ProLitteris &
  Omit<TrackingPixelProvider, 'createPixelUri'>;

type Config = {
  general: General;
  mailProvider: MailProvider;
  paymentProviders: PaymentProvider[];
  mediaServer: karmaMediaServer | novaMediaServer;
  challenge: AlgebraicCaptcha | Turnstile;
  trackingPixelProviders: TrackingPixels[];
  ga?: GoogleAnalyticsConfig;
};

function extractReplacer(input: string): string[] {
  const regex = /\${\s*(.*?)\s*}/g;
  let matches;
  const results: string[] = [];

  while ((matches = regex.exec(input)) !== null) {
    if (matches.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    results.push(matches[1]);
  }

  return results;
}

export async function readConfig(path: string): Promise<Config> {
  const stringReplaceMap = new MappedReplacer();
  const file = fs.readFileSync(path, 'utf8');
  const replacers = extractReplacer(file);

  for (const replacer of replacers) {
    const insertValue = process.env[replacer];

    if (typeof insertValue === 'undefined') {
      throw new Error(
        `In config yaml used envoirment variable <${replacer}> not definded! `
      );
    }

    stringReplaceMap.addRule(`$\{${replacer}}`, `${insertValue}`);
  }

  return YAML.parse(
    stringReplaceMap.rulesCount() ? stringReplaceMap.replace(file) : file
  );
}
