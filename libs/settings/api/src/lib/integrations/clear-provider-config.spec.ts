import { clearProviderConfig } from './clear-provider-config';

describe('clearProviderConfig', () => {
  test('nulls every credential of a mail provider', () => {
    const patch = clearProviderConfig('SettingMailProvider');

    expect(patch).toEqual({
      fromAddress: null,
      replyToAddress: null,
      webhookEndpointSecret: null,
      apiKey: null,
      mailgun_mailDomain: null,
      mailgun_baseDomain: null,
      mailchimp_baseURL: null,
      slack_webhookURL: null,
      smtp_host: null,
      smtp_port: null,
      smtp_secure: null,
      smtp_user: null,
    });
  });

  test('keeps the columns that identify the row', () => {
    const patch = clearProviderConfig('SettingChallengeProvider');

    expect(patch).toEqual({ secret: null, siteKey: null });
    expect(Object.keys(patch)).not.toContain('id');
    expect(Object.keys(patch)).not.toContain('type');
    expect(Object.keys(patch)).not.toContain('name');
    expect(Object.keys(patch)).not.toContain('lastLoadedAt');
  });

  test('refuses a model it does not know', () => {
    expect(() => clearProviderConfig('Nonsense')).toThrow(
      'Unknown provider model Nonsense'
    );
  });
});
