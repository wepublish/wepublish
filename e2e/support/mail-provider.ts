/**
 * The tenant's one mail provider, as far as the load test needs it: switched
 * to LOG for the run (mails composed with their pdf, not sent) and put back
 * afterwards. Ethereal rate-limits after about 200 mails and the run stops on
 * that (`429 Rate limited`), so 1200 renewal mails cannot go through it.
 *
 * Changing the type clears the provider's configuration, its password
 * included, which cannot be read back. Only an SMTP provider whose account is
 * the IMAP mailbox the suite already knows (Ethereal: same login for SMTP and
 * IMAP) can be put back as it was.
 */

export type MailProviderSetting = {
  id: string;
  type: string;
  name: string | null;
  fromAddress: string | null;
  replyToAddress: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_user: string | null;
  isApiKeySet: boolean;
  isWebhookEndpointSecretSet: boolean;
};

export const MAIL_PROVIDER_FIELDS =
  'id type name fromAddress replyToAddress smtp_host smtp_port smtp_secure smtp_user isApiKeySet isWebhookEndpointSecretSet';

/** The update that puts `setting` back, password included; throws when it cannot. */
export function smtpRestore(
  setting: MailProviderSetting,
  mailbox: { user: string; password: string } | undefined
) {
  if (setting.type !== 'SMTP') {
    throw new Error(
      `The mail provider is ${setting.type}: only an SMTP provider can be switched to LOG and put back.`
    );
  }

  if (setting.isWebhookEndpointSecretSet) {
    throw new Error('The mail provider has a webhook secret, which could not be put back.');
  }

  if (setting.isApiKeySet && (!mailbox || mailbox.user !== setting.smtp_user)) {
    throw new Error(
      `The mail provider logs in as ${setting.smtp_user}, but E2E_IMAP_USER is ${mailbox?.user ?? 'not set'}: its password could not be put back.`
    );
  }

  return {
    id: setting.id,
    type: 'SMTP',
    name: setting.name,
    fromAddress: setting.fromAddress,
    replyToAddress: setting.replyToAddress,
    smtp_host: setting.smtp_host,
    smtp_port: setting.smtp_port,
    smtp_secure: setting.smtp_secure,
    smtp_user: setting.smtp_user,
    apiKey: setting.isApiKeySet ? mailbox?.password : undefined,
  };
}
