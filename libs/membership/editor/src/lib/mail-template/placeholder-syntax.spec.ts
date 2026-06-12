import { MailProviderType } from '@wepublish/editor/api';

import { formatPlaceholder, getPlaceholderSyntax } from './placeholder-syntax';

describe('placeholder syntax', () => {
  it('uses Mandrill merge-var syntax for Mailchimp transactional templates', () => {
    expect(
      formatPlaceholder(
        'user_email',
        getPlaceholderSyntax(MailProviderType.Mailchimp)
      )
    ).toBe('*|user_email|*');
  });

  it('uses handlebars syntax for Mailgun and MailerSend templates', () => {
    expect(
      formatPlaceholder(
        'user_email',
        getPlaceholderSyntax(MailProviderType.Mailgun)
      )
    ).toBe('{{user_email}}');
    expect(
      formatPlaceholder(
        'user_email',
        getPlaceholderSyntax(MailProviderType.Mailersend)
      )
    ).toBe('{{user_email}}');
  });
});
