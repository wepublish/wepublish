import { describe, expect, it } from 'vitest';
import { smtpRestore } from './mail-provider';

const ethereal = {
  id: 'smtp',
  type: 'SMTP',
  name: 'Ethereal (review)',
  fromAddress: 'dev@wepublish.ch',
  replyToAddress: null,
  smtp_host: 'smtp.ethereal.email',
  smtp_port: 587,
  smtp_secure: false,
  smtp_user: 'kim@ethereal.email',
  isApiKeySet: true,
  isWebhookEndpointSecretSet: false,
};

describe('smtpRestore', () => {
  it('puts back every setting it read, and the password from the mailbox secret', () => {
    expect(smtpRestore(ethereal, { user: 'kim@ethereal.email', password: 'secret' })).toEqual({
      id: 'smtp',
      type: 'SMTP',
      name: 'Ethereal (review)',
      fromAddress: 'dev@wepublish.ch',
      replyToAddress: null,
      smtp_host: 'smtp.ethereal.email',
      smtp_port: 587,
      smtp_secure: false,
      smtp_user: 'kim@ethereal.email',
      apiKey: 'secret',
    });
  });

  it('needs no password where the server takes none (Mailpit locally)', () => {
    const mailpit = { ...ethereal, smtp_host: 'localhost', smtp_port: 1025, smtp_user: null, isApiKeySet: false };

    expect(smtpRestore(mailpit, undefined)).toMatchObject({ smtp_user: null, apiKey: undefined });
  });

  it('refuses a provider it could not put back as it was', () => {
    expect(() => smtpRestore({ ...ethereal, type: 'MAILCHIMP' }, undefined)).toThrow(/only an SMTP/);
    expect(() => smtpRestore(ethereal, { user: 'other@ethereal.email', password: 'x' })).toThrow(
      /E2E_IMAP_USER/
    );
    expect(() => smtpRestore(ethereal, undefined)).toThrow(/E2E_IMAP_USER/);
    expect(() => smtpRestore({ ...ethereal, isWebhookEndpointSecretSet: true }, {
      user: 'kim@ethereal.email',
      password: 'secret',
    })).toThrow(/webhook secret/);
  });
});
