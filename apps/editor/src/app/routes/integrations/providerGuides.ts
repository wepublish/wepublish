import {
  AiProviderType,
  AnalyticsProviderType,
  ChallengeProviderType,
  LetterProviderType,
  MailProviderType,
  PaymentProviderType,
  PdfRendererType,
  SyncProviderType,
  TrackingPixelProviderType,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';

import { IntegrationKey, ProviderSetting } from './integrationStatus';

export type GuideStep = {
  text: string;
  /** Where at the provider this step is done. */
  href?: string;
  /** The address the provider has to send its reports to. */
  webhookUrl?: string;
};

const webhookPrefixes: Partial<Record<IntegrationKey, string>> = {
  payment: 'payment-webhooks',
  mail: 'mail-webhooks',
  letter: 'letter-webhooks',
};

/** The API address a provider posts its reports to; mirrors the API's webhook controllers. */
export function webhookUrl(
  key: IntegrationKey,
  id: string,
  apiURL: string
): string | undefined {
  const prefix = webhookPrefixes[key];

  if (!prefix) {
    return undefined;
  }

  return `${apiURL.replace(/\/+$/, '')}/${prefix}/${encodeURIComponent(id)}`;
}

/** For providers that cannot sign their requests: the secret goes into the URL. */
const withKey = (url?: string) => url && `${url}?key=…`;

export function providerGuide(
  key: IntegrationKey,
  setting: ProviderSetting,
  t: TFunction,
  apiURL: string
): GuideStep[] | undefined {
  const hook = webhookUrl(key, setting.id, apiURL);

  switch (`${key}:${setting.type ?? ''}`) {
    case `mail:${MailProviderType.Mailgun}`:
      return [
        {
          text: t('integrations.guides.mailgun.domain'),
          href: 'https://app.mailgun.com/mg/sending/domains',
        },
        {
          text: t('integrations.guides.mailgun.apiKey'),
          href: 'https://app.mailgun.com/settings/api_security',
        },
        { text: t('integrations.guides.mailgun.signingKey') },
        {
          text: t('integrations.guides.mailgun.webhook'),
          webhookUrl: hook,
        },
      ];
    case `mail:${MailProviderType.Mailchimp}`:
      return [
        {
          text: t('integrations.guides.mandrill.account'),
          href: 'https://mandrillapp.com',
        },
        { text: t('integrations.guides.mandrill.domain') },
        { text: t('integrations.guides.mandrill.apiKey') },
        {
          text: t('integrations.guides.mandrill.webhook'),
          webhookUrl: hook,
        },
      ];
    case `mail:${MailProviderType.Brevo}`:
      return [
        { text: t('integrations.guides.brevo.sender') },
        {
          text: t('integrations.guides.brevo.apiKey'),
          href: 'https://app.brevo.com/settings/keys/api',
        },
        {
          text: t('integrations.guides.brevo.webhook'),
          webhookUrl: withKey(hook),
        },
      ];
    case `mail:${MailProviderType.Smtp}`:
      return [
        { text: t('integrations.guides.smtp.server') },
        { text: t('integrations.guides.smtp.port') },
        { text: t('integrations.guides.smtp.sender') },
      ];
    case `mail:${MailProviderType.Slack}`:
      return [
        {
          text: t('integrations.guides.slack.webhook'),
          href: 'https://api.slack.com/messaging/webhooks',
        },
        { text: t('integrations.guides.testingOnly') },
      ];
    case `mail:${MailProviderType.Log}`:
      return [{ text: t('integrations.guides.log.info') }];

    case `payment:${PaymentProviderType.Stripe}`:
    case `payment:${PaymentProviderType.StripeCheckout}`:
      return [
        {
          text: t('integrations.guides.stripe.apiKey'),
          href: 'https://dashboard.stripe.com/apikeys',
        },
        {
          text:
            setting.type === PaymentProviderType.StripeCheckout ?
              t('integrations.guides.stripe.webhookCheckout')
            : t('integrations.guides.stripe.webhook'),
          href: 'https://dashboard.stripe.com/webhooks',
          webhookUrl: hook,
        },
        { text: t('integrations.guides.stripe.signingSecret') },
        { text: t('integrations.guides.stripe.methods') },
      ];
    case `payment:${PaymentProviderType.Payrexx}`:
    case `payment:${PaymentProviderType.PayrexxSubscription}`:
      return [
        { text: t('integrations.guides.payrexx.instance') },
        { text: t('integrations.guides.payrexx.apiKey') },
        {
          text: t('integrations.guides.payrexx.webhook'),
          webhookUrl: withKey(hook),
        },
        { text: t('integrations.guides.payrexx.methods') },
      ];
    case `payment:${PaymentProviderType.Mollie}`:
      return [
        {
          text: t('integrations.guides.mollie.apiKey'),
          href: 'https://my.mollie.com/dashboard/developers/api-keys',
        },
        { text: t('integrations.guides.mollie.apiUrl', { apiURL }) },
        { text: t('integrations.guides.mollie.secret') },
        { text: t('integrations.guides.mollie.methods') },
      ];
    case `payment:${PaymentProviderType.Bexio}`:
      return [
        {
          text: t('integrations.guides.bexio.token'),
          href: 'https://developer.bexio.com',
        },
        { text: t('integrations.guides.bexio.ids') },
        { text: t('integrations.guides.bexio.texts') },
      ];
    case `payment:${PaymentProviderType.NoCharge}`:
      return [{ text: t('integrations.guides.noCharge.info') }];
    case `payment:${PaymentProviderType.Simulated}`:
      return [{ text: t('integrations.guides.testingOnly') }];

    case `challenge:${ChallengeProviderType.Turnstile}`:
      return [
        {
          text: t('integrations.guides.turnstile.widget'),
          href: 'https://dash.cloudflare.com/?to=/:account/turnstile',
        },
        { text: t('integrations.guides.turnstile.keys') },
      ];
    case `challenge:${ChallengeProviderType.Hcaptcha}`:
      return [
        {
          text: t('integrations.guides.hcaptcha.site'),
          href: 'https://dashboard.hcaptcha.com/sites',
        },
        {
          text: t('integrations.guides.hcaptcha.secret'),
          href: 'https://dashboard.hcaptcha.com/settings',
        },
      ];

    case `ai:${AiProviderType.V0}`:
      return [
        { text: t('integrations.guides.v0.apiKey'), href: 'https://v0.app' },
        { text: t('integrations.guides.v0.prompt') },
      ];

    case `analytics:${AnalyticsProviderType.Google}`:
      return [
        {
          text: t('integrations.guides.google.api'),
          href: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
        {
          text: t('integrations.guides.google.serviceAccount'),
          href: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
        {
          text: t('integrations.guides.google.access'),
          href: 'https://analytics.google.com',
        },
        { text: t('integrations.guides.google.property') },
      ];
    case `analytics:${AnalyticsProviderType.Plausible}`:
      return [
        {
          text: t('integrations.guides.plausible.apiKey'),
          href: 'https://plausible.io/settings/api-keys',
        },
        { text: t('integrations.guides.plausible.site') },
      ];
    case `analytics:${AnalyticsProviderType.Umami}`:
      return [
        { text: t('integrations.guides.umami.apiKey') },
        { text: t('integrations.guides.umami.website') },
      ];

    case `tracking-pixel:${TrackingPixelProviderType.Prolitteris}`:
      return [
        { text: t('integrations.guides.prolitteris.member') },
        { text: t('integrations.guides.prolitteris.mode') },
      ];

    case `letter:${LetterProviderType.Pingen}`:
      return [
        {
          text: t('integrations.guides.pingen.client'),
          href: 'https://app.pingen.com',
        },
        { text: t('integrations.guides.pingen.organisation') },
        {
          text: t('integrations.guides.pingen.webhook'),
          webhookUrl: hook,
        },
        { text: t('integrations.guides.pingen.staging') },
      ];

    case `pdf-renderer:${PdfRendererType.Cloudflare}`:
      return [
        {
          text: t('integrations.guides.cloudflarePdf.account'),
          href: 'https://dash.cloudflare.com',
        },
        {
          text: t('integrations.guides.cloudflarePdf.token'),
          href: 'https://dash.cloudflare.com/profile/api-tokens',
        },
      ];
    case `pdf-renderer:${PdfRendererType.Gotenberg}`:
      return [{ text: t('integrations.guides.gotenberg.url') }];

    case `mailchimp-sync:${SyncProviderType.Mailchimp}`:
      return [
        {
          text: t('integrations.guides.mailchimpSync.apiKey'),
          href: 'https://admin.mailchimp.com/account/api/',
        },
        { text: t('integrations.guides.mailchimpSync.save') },
        { text: t('integrations.guides.mailchimpSync.audience') },
      ];

    default:
      return undefined;
  }
}
