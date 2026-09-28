import { logger } from '@wepublish/utils/api';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';
import {
  MailLogStatus,
  MailProviderTemplateContent,
  SendMailProps,
  SendMailResult,
  WebhookForSendMailProps,
} from './mail-provider.interface';

export const LOG_MAIL_BODY_MAX_LENGTH = 2000;
export const LOG_MAIL_MAX_LINKS = 20;

export const readableBody = (props: {
  message?: string;
  messageHtml?: string;
}): string => {
  const text =
    props.message ??
    (props.messageHtml ?? '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&');

  const collapsed = text.replace(/\s+/g, ' ').trim();

  return collapsed.length > LOG_MAIL_BODY_MAX_LENGTH ?
      `${collapsed.slice(0, LOG_MAIL_BODY_MAX_LENGTH)}…`
    : collapsed;
};

export const extractLinks = (props: {
  message?: string;
  messageHtml?: string;
}): string[] => {
  const hrefs = [
    ...(props.messageHtml ?? '').matchAll(/href="(https?:\/\/[^"]+)"/gi),
  ].map(([, href]) => href);
  const plain = (props.message ?? '').match(/https?:\/\/[^\s"'<>)]+/g) ?? [];

  // Only what a reader would click: an xmlns declaration and an image source
  // are links too, and they crowd out the one link the log is opened for.
  return [...new Set([...hrefs, ...plain])].slice(0, LOG_MAIL_MAX_LINKS);
};

export class LogMailProvider extends BaseMailProvider {
  private readonly log = logger('mail-provider');

  constructor(props: MailProviderProps) {
    super(props);
  }

  async webhookForSendMail(
    _props: WebhookForSendMailProps
  ): Promise<MailLogStatus[]> {
    return [];
  }

  async sendMail(props: SendMailProps): Promise<SendMailResult> {
    const config = await this.getConfig();

    this.log.info(
      {
        mailLogID: props.mailLogID,
        from: config?.fromAddress ?? null,
        to: props.recipient,
        replyTo: props.replyToAddress || null,
        subject: props.subject,
        body: readableBody(props),
        links: extractLinks(props),
      },
      `Mail to ${props.recipient}: ${props.subject}`
    );

    return {};
  }

  async getTemplateContent(): Promise<MailProviderTemplateContent> {
    return { html: '', subject: '' };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'Log';
  }
}
