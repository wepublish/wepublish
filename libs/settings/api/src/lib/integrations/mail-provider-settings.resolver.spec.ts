import { SettingMailProvider } from '@prisma/client';
import { MailProviderSettingsResolver } from './mail-provider-settings.resolver';

const resolver = new MailProviderSettingsResolver({} as never, {} as never);

const row = (secrets: Partial<SettingMailProvider>) =>
  ({ id: 'mail', apiKey: null, webhookEndpointSecret: null, ...secrets }) as
    | SettingMailProvider;

describe('MailProviderSettingsResolver', () => {
  it('says a secret is stored without giving it away', () => {
    const setting = row({ apiKey: 'encrypted', webhookEndpointSecret: 'x' });

    expect(resolver.isApiKeySet(setting)).toBe(true);
    expect(resolver.isWebhookEndpointSecretSet(setting)).toBe(true);
  });

  it.each([null, ''])('says a secret of %j is not stored', value => {
    const setting = row({ apiKey: value, webhookEndpointSecret: value });

    expect(resolver.isApiKeySet(setting)).toBe(false);
    expect(resolver.isWebhookEndpointSecretSet(setting)).toBe(false);
  });
});
