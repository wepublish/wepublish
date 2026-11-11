import {
  MailProviderType,
  PaymentProviderType,
  PdfRendererType,
} from '@wepublish/editor/api';

export type IntegrationKey =
  | 'mail'
  | 'mailchimp-sync'
  | 'payment'
  | 'challenge'
  | 'ai'
  | 'analytics'
  | 'tracking-pixel'
  | 'letter'
  | 'pdf-renderer';

export type ProviderSetting = {
  id: string;
  name?: string | null;
  type?: string | null;
  [field: string]: unknown;
};

export type IntegrationStatus =
  | { state: 'notSetUp' }
  | { state: 'ready'; providers: string[] }
  | { state: 'paused'; providers: string[] }
  | { state: 'incomplete'; providers: string[]; incomplete: string[] };

const filled = (value: unknown) =>
  typeof value === 'number' || (typeof value === 'string' && value !== '');

const providersWithoutCredentials: string[] = [
  PaymentProviderType.NoCharge,
  PaymentProviderType.Simulated,
];

const isMailProviderComplete = (setting: ProviderSetting) => {
  switch (setting.type) {
    case MailProviderType.Log:
      return true;
    case MailProviderType.Slack:
      return filled(setting['slack_webhookURL']);
    case MailProviderType.Smtp:
      return filled(setting['fromAddress']) && filled(setting['smtp_host']);
    case MailProviderType.Mailgun:
      return (
        !!setting['isApiKeySet'] &&
        filled(setting['fromAddress']) &&
        filled(setting['mailgun_mailDomain'])
      );
    default:
      return !!setting['isApiKeySet'] && filled(setting['fromAddress']);
  }
};

const isPaymentProviderComplete = (setting: ProviderSetting) => {
  if (setting.type && providersWithoutCredentials.includes(setting.type)) {
    return true;
  }

  if (
    setting.type === PaymentProviderType.Payrexx ||
    setting.type === PaymentProviderType.PayrexxSubscription
  ) {
    return !!setting['isApiKeySet'] && filled(setting['payrexx_instancename']);
  }

  return !!setting['isApiKeySet'];
};

/**
 * Whether a provider has what it needs to work at all. It checks only what
 * the editor can see — a stored key may still be wrong — so it tells an admin
 * where to look, not that everything works.
 */
export function isProviderComplete(
  key: IntegrationKey,
  setting: ProviderSetting
): boolean {
  switch (key) {
    case 'mail':
      return isMailProviderComplete(setting);
    case 'payment':
      return isPaymentProviderComplete(setting);
    case 'mailchimp-sync':
      return (
        !!setting['mailchimp_isApiKeySet'] &&
        filled(setting['mailchimp_listId'])
      );
    case 'challenge':
      return !!setting['isSecretSet'];
    case 'ai':
      return !!setting['isApiKeySet'];
    case 'analytics':
      return !!setting['isCredentialsSet'];
    case 'tracking-pixel':
      return filled(setting['prolitteris_memberNr']);
    case 'letter':
      return filled(setting['clientId']) && filled(setting['organisationId']);
    case 'pdf-renderer':
      return setting.type === PdfRendererType.Gotenberg ?
          filled(setting['gotenberg_url'])
        : filled(setting['cloudflare_accountId']);
  }
}

const labelOf = (setting: ProviderSetting) =>
  setting.name || setting.type || setting.id;

export function integrationStatus(
  key: IntegrationKey,
  settings: ProviderSetting[] | null | undefined
): IntegrationStatus {
  if (!settings?.length) {
    return { state: 'notSetUp' };
  }

  const providers = settings.map(labelOf);
  const incomplete = settings
    .filter(setting => !isProviderComplete(key, setting))
    .map(labelOf);

  if (incomplete.length) {
    return { state: 'incomplete', providers, incomplete };
  }

  if (
    key === 'mailchimp-sync' &&
    settings.every(setting => !setting['enabled'])
  ) {
    return { state: 'paused', providers };
  }

  return { state: 'ready', providers };
}
