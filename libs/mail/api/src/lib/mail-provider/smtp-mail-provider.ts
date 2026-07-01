import { createTransport, Transporter } from 'nodemailer';
import {
  MailLogStatus,
  MailProviderTemplateContent,
  SendMailProps,
  WebhookForSendMailProps,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

/**
 * Sends fully-composed mails over SMTP via nodemailer. Connection settings come
 * from the provider's database configuration (host/port/secure/user + the
 * encrypted `apiKey` reused as the password); the local dev default points at
 * Mailpit. SMTP has no delivery webhooks and no remote templates.
 */
export class SmtpMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  private async createTransporter(): Promise<Transporter> {
    const config = await this.getConfig();
    const host =
      config?.smtp_host || process.env['MAIL_SMTP_HOST'] || 'localhost';
    const port =
      config?.smtp_port ??
      (process.env['MAIL_SMTP_PORT'] ?
        Number(process.env['MAIL_SMTP_PORT'])
      : 1025);
    const secure = config?.smtp_secure ?? false;
    // Password is stored in the shared encrypted `apiKey` column.
    const user = config?.smtp_user ?? undefined;
    const pass = config?.apiKey ?? undefined;

    return createTransport({
      host,
      port,
      secure,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async webhookForSendMail(
    _props: WebhookForSendMailProps
  ): Promise<MailLogStatus[]> {
    // SMTP delivers synchronously and has no status webhook.
    return [];
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const config = await this.getConfig();
    const from =
      config?.fromAddress ||
      process.env['MAIL_SMTP_FROM'] ||
      'no-reply@wepublish.local';
    const transporter = await this.createTransporter();

    await transporter.sendMail({
      from,
      to: props.recipient,
      replyTo: props.replyToAddress || undefined,
      subject: props.subject,
      text: props.message,
      html: props.messageHtml,
    });
  }

  async getTemplateContent(): Promise<MailProviderTemplateContent> {
    // SMTP has no remote template store.
    return { html: '', subject: '' };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'SMTP';
  }
}
