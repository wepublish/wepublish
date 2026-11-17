import {
  LetterProviderType,
  MailProviderType,
  PaymentProviderType,
} from '@wepublish/editor/api';
import { TFunction } from 'i18next';

import { providerGuide, webhookUrl } from './providerGuides';

const t = ((key: string) => key) as unknown as TFunction;
const apiURL = 'https://api.example.ch';

describe('webhookUrl', () => {
  it('builds the address the API receives the provider’s reports on', () => {
    expect(webhookUrl('payment', 'stripe', apiURL)).toBe(
      'https://api.example.ch/payment-webhooks/stripe'
    );
    expect(webhookUrl('mail', 'mailgun', `${apiURL}/`)).toBe(
      'https://api.example.ch/mail-webhooks/mailgun'
    );
    expect(webhookUrl('letter', 'pingen', apiURL)).toBe(
      'https://api.example.ch/letter-webhooks/pingen'
    );
  });

  it('has no address for integrations without webhooks', () => {
    expect(webhookUrl('ai', 'v0', apiURL)).toBeUndefined();
  });
});

describe('providerGuide', () => {
  it('tells where Stripe keys are made and which URL to register', () => {
    const steps = providerGuide(
      'payment',
      { id: 'stripe', type: PaymentProviderType.Stripe },
      t,
      apiURL
    );

    expect(steps?.[0]).toEqual({
      text: 'integrations.guides.stripe.apiKey',
      href: 'https://dashboard.stripe.com/apikeys',
    });
    expect(steps).toContainEqual(
      expect.objectContaining({
        webhookUrl: 'https://api.example.ch/payment-webhooks/stripe',
      })
    );
  });

  it('asks for the secret in the URL where the provider signs nothing', () => {
    const steps = providerGuide(
      'mail',
      { id: 'brevo', type: MailProviderType.Brevo },
      t,
      apiURL
    );

    expect(steps).toContainEqual(
      expect.objectContaining({
        webhookUrl: 'https://api.example.ch/mail-webhooks/brevo?key=…',
      })
    );
  });

  it('guides the letter provider through its webhook too', () => {
    const steps = providerGuide(
      'letter',
      { id: 'pingen', type: LetterProviderType.Pingen },
      t,
      apiURL
    );

    expect(steps).toContainEqual(
      expect.objectContaining({
        webhookUrl: 'https://api.example.ch/letter-webhooks/pingen',
      })
    );
  });

  it('has no guide for a type it does not know', () => {
    expect(
      providerGuide('mail', { id: 'x', type: 'CARRIER_PIGEON' }, t, apiURL)
    ).toBeUndefined();
  });
});
