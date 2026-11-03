import { AISettingsResolver } from './ai-settings.resolver';
import { AnalyticsProviderSettingsResolver } from './analytics-provider-settings.resolver';
import { ChallengeProviderSettingsResolver } from './challenge-provider-settings.resolver';
import { PaymentProviderSettingsResolver } from './payment-provider-settings.resolver';
import { SyncProviderSettingsResolver } from './sync-provider-settings.resolver';
import { TrackingPixelProviderSettingsResolver } from './tracking-pixel-provider-settings.resolver';

const build = <T>(Resolver: new (...args: never[]) => T) =>
  new (Resolver as new (...args: unknown[]) => T)({}, {}, {}, {});

// Every provider says whether each of its secrets is stored, without ever
// returning the secret: the editor shows it as the field's placeholder.
const cases = [
  [AISettingsResolver, 'apiKey', 'isApiKeySet'],
  [AnalyticsProviderSettingsResolver, 'credentials', 'isCredentialsSet'],
  [ChallengeProviderSettingsResolver, 'secret', 'isSecretSet'],
  [PaymentProviderSettingsResolver, 'apiKey', 'isApiKeySet'],
  [
    PaymentProviderSettingsResolver,
    'webhookEndpointSecret',
    'isWebhookEndpointSecretSet',
  ],
  [SyncProviderSettingsResolver, 'mailchimp_apiKey', 'mailchimp_isApiKeySet'],
  [
    TrackingPixelProviderSettingsResolver,
    'prolitteris_password',
    'prolitteris_isPasswordSet',
  ],
] as const;

describe.each(cases)('%o', (Resolver, column, field) => {
  const resolver = build(Resolver) as unknown as Record<
    string,
    (setting: Record<string, unknown>) => boolean
  >;

  it(`resolves ${field} from a stored ${column}`, () => {
    expect(resolver[field]({ [column]: 'encrypted' })).toBe(true);
  });

  it.each([null, ''])(`resolves ${field} from ${column} %j as not stored`, value => {
    expect(resolver[field]({ [column]: value })).toBe(false);
  });
});
