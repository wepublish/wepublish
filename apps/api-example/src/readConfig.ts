import fs from 'fs';
import YAML from 'yaml';
import { MappedReplacer } from 'mapped-replacer';
import StipeType from 'stripe';
import { TrackingPixelProvider } from '@wepublish/tracking-pixel/api';

type General = {
  apolloPlayground: boolean;
  apolloIntrospection: boolean;
  bcryptHashCostFactor: number;
  urlAdapter: 'default' | 'hauptstadt';
  sessionTTLDays: number;
};

type MailProvider = {
  id: string;
  type: string;
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

type novaMediaServer = {
  type: 'nova';
  quality: number;
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

type Turnstile = {
  type: 'turnstile';
  id: string;
  secret: string;
  siteKey: string;
};

type ProLitteris = {
  type: 'prolitteris';
};

type TrackingPixels = ProLitteris &
  Omit<TrackingPixelProvider, 'createPixelUri'>;

type V0 = {
  apiKey: string;
  systemPrompt: string;
};

type Config = {
  general: General;
  mailProvider: MailProvider;
  paymentProviders: PaymentProvider[];
  mediaServer: novaMediaServer;
  challenge: Turnstile;
  trackingPixelProviders: TrackingPixels[];
  v0?: V0;
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
