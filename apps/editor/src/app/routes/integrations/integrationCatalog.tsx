import {
  AiProviderType,
  AnalyticsProviderType,
  ChallengeProviderType,
  LetterProviderType,
  MailProviderSettingsDocument,
  MailProviderType,
  PaymentProviderSettingsDocument,
  PaymentProviderType,
  PdfRendererSettingsDocument,
  PdfRendererType,
  LetterProviderSettingsDocument,
  SettingsIntegrationsAiDocument,
  SettingsIntegrationsAnalyticsDocument,
  SettingsIntegrationsChallengeDocument,
  SyncProviderSettingsDocument,
  SyncProviderType,
  TrackingPixelProviderType,
  TrackingPixelSettingsDocument,
} from '@wepublish/editor/api';
import type { FeatureKey } from '@wepublish/features';
import {
  CanGetAISettings,
  CanGetAnalyticsProviderSettings,
  CanGetChallengeProviderSettings,
  CanGetLetterProviderSettings,
  CanGetMailchimpSyncSettings,
  CanGetMailProviderSettings,
  CanGetPaymentProviderSettings,
  CanGetPdfRendererSettings,
  CanGetTrackingPixelSettings,
  Permission,
} from '@wepublish/permissions';
import { DocumentNode } from 'graphql';
import { TFunction } from 'i18next';
import { ElementType } from 'react';
import {
  MdCreditCard,
  MdEmail,
  MdLocalFireDepartment,
  MdMarkunreadMailbox,
  MdPictureAsPdf,
  MdSecurity,
  MdSmartToy,
  MdSync,
  MdCopyright,
} from 'react-icons/md';

import bexioLogo from './assets/bexio.webp';
import cloudflareLogo from './assets/cloudflare.svg';
import googleLogo from './assets/google.svg';
import hcaptchaLogo from './assets/hcaptcha.webp';
import mailChimpLogo from './assets/mailchimp.webp';
import mailgunLogo from './assets/mailgun.svg';
import mollieLogo from './assets/mollie.webp';
import payrexxLogo from './assets/payrexx.webp';
import pingenLogo from './assets/pingen.svg';
import plausibleLogo from './assets/plausible.svg';
import proLitterisLogo from './assets/proLitteris.svg';
import slackLogo from './assets/slack.webp';
import stripeLogo from './assets/stripe.svg';
import umamiLogo from './assets/umami.svg';
import vercelLogo from './assets/vercel.svg';
import { IntegrationKey } from './integrationStatus';

export type IntegrationGroupKey =
  'email' | 'payments' | 'website' | 'reach' | 'print';

export type ProviderOption = {
  /** The provider type as the API knows it. */
  type: string;
  /** What the provider is called by its vendor, plus a hint where needed. */
  label: string;
  logo?: string;
  /** Only meant for testing; not offered to someone setting up for real. */
  testing?: boolean;
};

export type IntegrationDefinition = {
  key: IntegrationKey;
  path: string;
  group: IntegrationGroupKey;
  title: string;
  summary: string;
  icon: ElementType;
  permission: Permission;
  feature?: FeatureKey;
  query: DocumentNode;
  dataKey: string;
  providers: ProviderOption[];
  /** Other integrations an admin confuses this one with, and why. */
  related?: { key: IntegrationKey; text: string }[];
};

export type IntegrationGroup = {
  key: IntegrationGroupKey;
  title: string;
  description: string;
  /** Shown above the group's cards when they are easy to mix up. */
  note?: string;
};

export const mailProviderOptions = (t: TFunction): ProviderOption[] => [
  { type: MailProviderType.Mailgun, label: 'Mailgun', logo: mailgunLogo },
  {
    type: MailProviderType.Mailchimp,
    label: t('integrations.providers.mailchimpTransactional'),
    logo: mailChimpLogo,
  },
  { type: MailProviderType.Brevo, label: 'Brevo' },
  { type: MailProviderType.Smtp, label: t('integrations.providers.smtp') },
  {
    type: MailProviderType.Slack,
    label: t('integrations.providers.slack'),
    testing: true,
    logo: slackLogo,
  },
  {
    type: MailProviderType.Log,
    label: t('integrations.providers.log'),
    testing: true,
  },
];

export const paymentProviderOptions = (t: TFunction): ProviderOption[] => [
  {
    type: PaymentProviderType.Payrexx,
    label: t('integrations.providers.payrexx'),
    logo: payrexxLogo,
  },
  {
    type: PaymentProviderType.PayrexxSubscription,
    label: t('integrations.providers.payrexxSubscription'),
    logo: payrexxLogo,
  },
  {
    type: PaymentProviderType.Stripe,
    label: t('integrations.providers.stripe'),
    logo: stripeLogo,
  },
  {
    type: PaymentProviderType.StripeCheckout,
    label: t('integrations.providers.stripeCheckout'),
    logo: stripeLogo,
  },
  { type: PaymentProviderType.Mollie, label: 'Mollie', logo: mollieLogo },
  {
    type: PaymentProviderType.Bexio,
    label: t('integrations.providers.bexio'),
    logo: bexioLogo,
  },
  {
    type: PaymentProviderType.NoCharge,
    label: t('integrations.providers.noCharge'),
  },
  {
    type: PaymentProviderType.Simulated,
    label: t('integrations.providers.simulated'),
    testing: true,
  },
];

export const challengeProviderOptions = (): ProviderOption[] => [
  {
    type: ChallengeProviderType.Turnstile,
    label: 'Cloudflare Turnstile',
    logo: cloudflareLogo,
  },
  {
    type: ChallengeProviderType.Hcaptcha,
    label: 'hCaptcha',
    logo: hcaptchaLogo,
  },
];

/** The label of a provider type, falling back to the raw type. */
export const providerLabel = (
  options: ProviderOption[],
  type?: string | null
) => options.find(option => option.type === type)?.label ?? type ?? '';

export const providerLogo = (options: ProviderOption[], type?: string | null) =>
  options.find(option => option.type === type)?.logo;

export function integrationGroups(t: TFunction): IntegrationGroup[] {
  return [
    {
      key: 'email',
      title: t('integrations.groups.email.title'),
      description: t('integrations.groups.email.description'),
      note: t('integrations.groups.email.mailchimpNote'),
    },
    {
      key: 'payments',
      title: t('integrations.groups.payments.title'),
      description: t('integrations.groups.payments.description'),
    },
    {
      key: 'website',
      title: t('integrations.groups.website.title'),
      description: t('integrations.groups.website.description'),
    },
    {
      key: 'reach',
      title: t('integrations.groups.reach.title'),
      description: t('integrations.groups.reach.description'),
    },
    {
      key: 'print',
      title: t('integrations.groups.print.title'),
      description: t('integrations.groups.print.description'),
    },
  ];
}

export function integrationCatalog(t: TFunction): IntegrationDefinition[] {
  return [
    {
      key: 'mail',
      path: '/integrations/mail',
      group: 'email',
      title: t('integrations.mailProvider'),
      summary: t('integrations.mailProviderInfo'),
      icon: MdEmail,
      permission: CanGetMailProviderSettings,
      query: MailProviderSettingsDocument,
      dataKey: 'mailProviderSettings',
      providers: mailProviderOptions(t),
      related: [
        {
          key: 'mailchimp-sync',
          text: t('integrations.related.mailToMailchimpSync'),
        },
      ],
    },
    {
      key: 'mailchimp-sync',
      path: '/integrations/mailchimp-sync',
      group: 'email',
      title: t('integrations.mailchimpSync'),
      summary: t('integrations.mailchimpSyncInfo'),
      icon: MdSync,
      permission: CanGetMailchimpSyncSettings,
      query: SyncProviderSettingsDocument,
      dataKey: 'syncProviderSettings',
      providers: [
        {
          type: SyncProviderType.Mailchimp,
          label: t('integrations.providers.mailchimpMarketing'),
          logo: mailChimpLogo,
        },
      ],
      related: [
        {
          key: 'mail',
          text: t('integrations.related.mailchimpSyncToMail'),
        },
      ],
    },
    {
      key: 'payment',
      path: '/integrations/payment',
      group: 'payments',
      title: t('integrations.paymentProvider'),
      summary: t('integrations.paymentProviderInfo'),
      icon: MdCreditCard,
      permission: CanGetPaymentProviderSettings,
      query: PaymentProviderSettingsDocument,
      dataKey: 'paymentProviderSettings',
      providers: paymentProviderOptions(t).filter(
        provider =>
          provider.type !== PaymentProviderType.Simulated &&
          provider.type !== PaymentProviderType.NoCharge
      ),
    },
    {
      key: 'challenge',
      path: '/integrations/challenge',
      group: 'website',
      title: t('integrations.challengeProvider'),
      summary: t('integrations.challengeProviderInfo'),
      icon: MdSecurity,
      permission: CanGetChallengeProviderSettings,
      query: SettingsIntegrationsChallengeDocument,
      dataKey: 'challengeProviderSettings',
      providers: challengeProviderOptions(),
    },
    {
      key: 'ai',
      path: '/integrations/ai',
      group: 'website',
      title: t('integrations.ai'),
      summary: t('integrations.aiInfo'),
      icon: MdSmartToy,
      permission: CanGetAISettings,
      query: SettingsIntegrationsAiDocument,
      dataKey: 'aiSettings',
      providers: [
        { type: AiProviderType.V0, label: 'v0 by Vercel', logo: vercelLogo },
      ],
    },
    {
      key: 'analytics',
      path: '/integrations/analytics',
      group: 'reach',
      title: t('integrations.analytics'),
      summary: t('integrations.analyticsInfo'),
      icon: MdLocalFireDepartment,
      permission: CanGetAnalyticsProviderSettings,
      query: SettingsIntegrationsAnalyticsDocument,
      dataKey: 'analyticsProviderSettings',
      providers: [
        {
          type: AnalyticsProviderType.Google,
          label: 'Google Analytics',
          logo: googleLogo,
        },
        {
          type: AnalyticsProviderType.Plausible,
          label: 'Plausible',
          logo: plausibleLogo,
        },
        { type: AnalyticsProviderType.Umami, label: 'Umami', logo: umamiLogo },
      ],
    },
    {
      key: 'tracking-pixel',
      path: '/integrations/tracking-pixel',
      group: 'reach',
      title: t('integrations.trackingPixel'),
      summary: t('integrations.trackingPixelInfo'),
      icon: MdCopyright,
      permission: CanGetTrackingPixelSettings,
      query: TrackingPixelSettingsDocument,
      dataKey: 'trackingPixelSettings',
      providers: [
        {
          type: TrackingPixelProviderType.Prolitteris,
          label: 'ProLitteris',
          logo: proLitterisLogo,
        },
      ],
    },
    {
      key: 'letter',
      path: '/integrations/letter',
      group: 'print',
      title: t('integrations.letterProvider'),
      summary: t('integrations.letterProviderInfo'),
      icon: MdMarkunreadMailbox,
      permission: CanGetLetterProviderSettings,
      feature: 'paper-letters',
      query: LetterProviderSettingsDocument,
      dataKey: 'letterProviderSettings',
      providers: [
        { type: LetterProviderType.Pingen, label: 'Pingen', logo: pingenLogo },
      ],
      related: [
        {
          key: 'pdf-renderer',
          text: t('integrations.related.letterToPdfRenderer'),
        },
      ],
    },
    {
      key: 'pdf-renderer',
      path: '/integrations/pdf-renderer',
      group: 'print',
      title: t('integrations.pdfRenderer'),
      summary: t('integrations.pdfRendererInfo'),
      icon: MdPictureAsPdf,
      permission: CanGetPdfRendererSettings,
      feature: 'paper-letters',
      query: PdfRendererSettingsDocument,
      dataKey: 'pdfRendererSettings',
      providers: [
        {
          type: PdfRendererType.Cloudflare,
          label: 'Cloudflare Browser Rendering',
          logo: cloudflareLogo,
        },
        { type: PdfRendererType.Gotenberg, label: 'Gotenberg' },
      ],
    },
  ];
}

export const integrationByPath = (
  catalog: IntegrationDefinition[],
  type: string | undefined
) => catalog.find(integration => integration.key === type);

/** The provider types an integration offers, for its type pickers. */
export const providersOf = (key: IntegrationKey, t: TFunction) =>
  key === 'payment' ?
    paymentProviderOptions(t)
  : (integrationCatalog(t).find(integration => integration.key === key)
      ?.providers ?? []);

export const typeOptionsOf = (providers: ProviderOption[]) =>
  providers.map(({ type, label }) => ({ label, value: type }));
