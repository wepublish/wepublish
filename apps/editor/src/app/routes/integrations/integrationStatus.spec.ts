import {
  MailProviderType,
  PaymentProviderType,
  PdfRendererType,
} from '@wepublish/editor/api';

import { integrationStatus, isProviderComplete } from './integrationStatus';

describe('integrationStatus', () => {
  it('is not set up while there is no provider', () => {
    expect(integrationStatus('mail', [])).toEqual({ state: 'notSetUp' });
    expect(integrationStatus('mail', undefined)).toEqual({ state: 'notSetUp' });
  });

  it('is ready once every provider has what it needs', () => {
    expect(
      integrationStatus('mail', [
        {
          id: 'mailgun',
          name: 'Mailgun',
          type: MailProviderType.Mailgun,
          isApiKeySet: true,
          fromAddress: 'abo@example.ch',
          mailgun_mailDomain: 'mg.example.ch',
        },
      ])
    ).toEqual({ state: 'ready', providers: ['Mailgun'] });
  });

  it('needs attention while a provider lacks its credentials', () => {
    expect(
      integrationStatus('payment', [
        {
          id: 'stripe',
          name: 'Stripe',
          type: PaymentProviderType.Stripe,
          isApiKeySet: false,
        },
        { id: 'free', name: '', type: PaymentProviderType.NoCharge },
      ])
    ).toEqual({
      state: 'incomplete',
      providers: ['Stripe', PaymentProviderType.NoCharge],
      incomplete: ['Stripe'],
    });
  });

  it('is paused while the Mailchimp audience sync is switched off', () => {
    expect(
      integrationStatus('mailchimp-sync', [
        {
          id: 'mailchimp-sync',
          name: 'Mailchimp',
          enabled: false,
          mailchimp_isApiKeySet: true,
          mailchimp_listId: 'abc',
        },
      ])
    ).toEqual({ state: 'paused', providers: ['Mailchimp'] });
  });

  it('asks for the key and the audience before anything else', () => {
    expect(
      integrationStatus('mailchimp-sync', [
        { id: 'mailchimp-sync', name: 'Mailchimp', enabled: true },
      ])
    ).toEqual({
      state: 'incomplete',
      providers: ['Mailchimp'],
      incomplete: ['Mailchimp'],
    });
  });
});

describe('isProviderComplete', () => {
  it.each([
    ['mail', { type: MailProviderType.Log }, true],
    ['mail', { type: MailProviderType.Smtp, fromAddress: 'a@b.ch' }, false],
    [
      'mail',
      { type: MailProviderType.Smtp, fromAddress: 'a@b.ch', smtp_host: 'h' },
      true,
    ],
    ['mail', { type: MailProviderType.Slack, slack_webhookURL: 'x' }, true],
    [
      'payment',
      { type: PaymentProviderType.Payrexx, isApiKeySet: true },
      false,
    ],
    [
      'payment',
      {
        type: PaymentProviderType.Payrexx,
        isApiKeySet: true,
        payrexx_instancename: 'medium',
      },
      true,
    ],
    ['payment', { type: PaymentProviderType.Simulated }, true],
    ['challenge', { isSecretSet: true }, true],
    ['ai', { isApiKeySet: false }, false],
    ['analytics', { isCredentialsSet: true }, true],
    ['tracking-pixel', { prolitteris_memberNr: '1' }, true],
    ['letter', { clientId: 'c' }, false],
    ['letter', { clientId: 'c', organisationId: 'o' }, true],
    [
      'pdf-renderer',
      { type: PdfRendererType.Cloudflare, cloudflare_accountId: 'a' },
      true,
    ],
    ['pdf-renderer', { type: PdfRendererType.Gotenberg }, false],
  ] as const)('%s %o is complete: %s', (key, setting, expected) => {
    expect(isProviderComplete(key, { id: 'x', ...setting })).toBe(expected);
  });
});
