import { MailProviderType } from '@wepublish/editor/api';

export interface PlaceholderSyntax {
  open: string;
  close: string;
}

export const getPlaceholderSyntax = (
  providerType?: MailProviderType | null
): PlaceholderSyntax => {
  switch (providerType) {
    case MailProviderType.Mailchimp:
      return { open: '*|', close: '|*' };
    case MailProviderType.Mailgun:
    case MailProviderType.Mailersend:
    default:
      return { open: '{{', close: '}}' };
  }
};

export const formatPlaceholder = (
  key: string,
  syntax: PlaceholderSyntax
): string => `${syntax.open}${key}${syntax.close}`;
