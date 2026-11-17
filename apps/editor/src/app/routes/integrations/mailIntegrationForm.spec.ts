import { MailProviderType, SettingMailProvider } from '@wepublish/editor/api';
import { TFunction } from 'i18next';

import { mailFields } from './mailIntegrationForm';

const t = ((key: string) => key) as unknown as TFunction;
const fieldsFor = (type: MailProviderType) =>
  mailFields({ id: 'x', type } as SettingMailProvider, t, []);
const field = (type: MailProviderType, name: string) =>
  fieldsFor(type).find(candidate => candidate.name === name);

describe('mailFields', () => {
  it('asks Brevo for its API key and webhook secret', () => {
    expect(field(MailProviderType.Brevo, 'apiKey')).toBeDefined();
    expect(field(MailProviderType.Brevo, 'webhookEndpointSecret')?.info).toBe(
      'integrations.mailSettings.webhookSecretInfo.brevo'
    );
  });

  it('explains the webhook secret for the provider at hand', () => {
    expect(field(MailProviderType.Mailgun, 'webhookEndpointSecret')?.info).toBe(
      'integrations.mailSettings.webhookSecretInfo.mailgun'
    );
    expect(
      field(MailProviderType.Mailchimp, 'webhookEndpointSecret')?.info
    ).toBe('integrations.mailSettings.webhookSecretInfo.mandrill');
  });

  it('asks only Mailgun for its domains', () => {
    expect(field(MailProviderType.Mailgun, 'mailgun_mailDomain')).toBeDefined();
    expect(field(MailProviderType.Brevo, 'mailgun_mailDomain')).toBeUndefined();
  });

  it('asks SMTP for no webhook', () => {
    expect(
      field(MailProviderType.Smtp, 'webhookEndpointSecret')
    ).toBeUndefined();
    expect(field(MailProviderType.Smtp, 'smtp_host')).toBeDefined();
  });

  it('says where the API key of the provider at hand is made', () => {
    expect(field(MailProviderType.Mailgun, 'apiKey')?.info).toBe(
      'integrations.mailSettings.apiKeyInfoByType.mailgun'
    );
  });
});
