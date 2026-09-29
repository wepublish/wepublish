import { EmailQualityEventType, MailLogState } from '@prisma/client';
import crypto from 'crypto';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import {
  MailLogStatus,
  MailProviderTemplate,
  MailProviderTemplateContent,
  MailQualitySignal,
  SendMailProps,
  SendMailResult,
  WebhookForSendMailProps,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

interface VerifyWebhookSignatureProps {
  timestamp: string;
  token: string;
  signature: string;
}

function mapMailgunEventToMailLogState(event: string): MailLogState | null {
  switch (event) {
    case 'accepted':
      return MailLogState.accepted;
    case 'delivered':
      return MailLogState.delivered;
    case 'failed':
      return MailLogState.bounced;
    case 'rejected':
      return MailLogState.rejected;
    default:
      return null;
  }
}

type MailgunEventData = {
  event?: string;
  severity?: string;
  reason?: string;
  recipient?: string;
  timestamp?: number;
  'delivery-status'?: { description?: string; message?: string };
};

/** What an event says about the recipient's address, besides the delivery state. */
function mapMailgunEventToQualitySignal(
  data: MailgunEventData
): MailQualitySignal | null {
  const signal = (
    type: EmailQualityEventType,
    detail?: string | null
  ): MailQualitySignal => ({
    type,
    email: data.recipient,
    detail: detail ?? null,
    occurredAt:
      typeof data.timestamp === 'number' ?
        new Date(data.timestamp * 1000)
      : undefined,
  });

  switch (data.event) {
    case 'failed': {
      const diagnosis =
        data['delivery-status']?.description ||
        data['delivery-status']?.message ||
        data.reason ||
        null;

      // temporary failures are retried by Mailgun and may still get through
      return signal(
        data.severity === 'permanent' ?
          EmailQualityEventType.hardBounce
        : EmailQualityEventType.softBounce,
        diagnosis
      );
    }
    case 'rejected':
      return signal(EmailQualityEventType.rejected, data.reason);
    case 'complained':
      return signal(EmailQualityEventType.spamComplaint);
    case 'unsubscribed':
      return signal(EmailQualityEventType.unsubscribed);
    case 'opened':
      return signal(EmailQualityEventType.opened);
    case 'clicked':
      return signal(EmailQualityEventType.clicked);
    default:
      return null;
  }
}

export class MailgunMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async verifyWebhookSignature(
    props: VerifyWebhookSignatureProps
  ): Promise<boolean> {
    const config = await this.getConfig();
    const encodedToken = crypto
      .createHmac('sha256', config?.webhookEndpointSecret ?? '')
      .update(props.timestamp.concat(props.token))
      .digest('hex');

    return encodedToken === props.signature;
  }

  async webhookForSendMail({
    req,
  }: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    const { body } = req;

    if (!body.signature) {
      throw new Error('No signature in webhook body');
    }

    const { signature, token, timestamp } =
      body.signature as VerifyWebhookSignatureProps;

    if (
      !timestamp ||
      !token ||
      !signature ||
      !(await this.verifyWebhookSignature({ timestamp, token, signature }))
    ) {
      throw new Error('Webhook signature failed');
    }

    if (!body['event-data']) {
      throw new Error('No event-data in webhook body');
    }

    if (!body['event-data']['user-variables']) {
      throw new Error('No user-variables in webhook body');
    }

    const mailLogStatuses: MailLogStatus[] = [];
    const state = mapMailgunEventToMailLogState(body['event-data'].event);
    const signal = mapMailgunEventToQualitySignal(body['event-data']);
    const mailLogID = body['event-data']['user-variables'].mail_log_id;

    if ((state !== null || signal) && mailLogID !== undefined) {
      mailLogStatuses.push({
        state,
        mailLogID,
        mailData: JSON.stringify(body['event-data']),
        qualitySignals: signal ? [signal] : [],
      });
    }

    return mailLogStatuses;
  }

  /**
   * Delivery states arrive through Mailgun's webhook, so no message id is kept
   * for polling — `getMessageStates` stays unimplemented for this provider.
   */
  async sendMail(props: SendMailProps): Promise<SendMailResult> {
    const config = await this.getConfig();
    const form = new FormData();
    form.append('from', config?.fromAddress ?? '');
    form.append('to', props.recipient);
    form.append('subject', props.subject);
    form.append('text', props.message ?? '');

    if (props.messageHtml) {
      form.append('html', props.messageHtml);
    }

    const auth = Buffer.from(`api:${config?.apiKey}`).toString('base64');
    form.append('v:mail_log_id', props.mailLogID);
    return new Promise((resolve, reject) => {
      form.submit(
        {
          protocol: 'https:',
          host: config?.mailgun_baseDomain,
          path: `/v3/${config?.mailgun_mailDomain}/messages`,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${auth}`,
          },
        },
        (err, res) => {
          return err || res.statusCode !== 200 ?
              reject(err || res)
            : resolve({});
        }
      );
    });
  }

  async getTemplateContent(
    externalMailTemplateId: string
  ): Promise<MailProviderTemplateContent> {
    const { client, mailDomain } = await this.getMailgunClient();
    const response = await client.domains.domainTemplates.get(
      mailDomain,
      externalMailTemplateId,
      { active: 'yes' } as never
    );
    return { html: response.version?.template ?? '' };
  }

  /**
   * Mailgun's template list is shallow and paginated (10 per page by default),
   * so page through it and fetch each template's active version separately.
   * Mailgun templates carry no subject — the local one is kept on import.
   */
  override async listTemplates(): Promise<MailProviderTemplate[]> {
    const { client, mailDomain } = await this.getMailgunClient();
    const names: string[] = [];
    let page: `?${string}` | undefined = undefined;

    for (;;) {
      const result = await client.domains.domainTemplates.list(mailDomain, {
        limit: 100,
        ...(page ? { page } : {}),
      });
      const items = result.items ?? [];
      names.push(...items.map(item => item.name));

      const next = result.pages?.next?.page as `?${string}` | undefined;
      if (!items.length || !next || next === page) {
        break;
      }
      page = next;
    }

    const templates: MailProviderTemplate[] = [];
    for (const name of names) {
      const content = await this.getTemplateContent(name);
      templates.push({ externalId: name, name, html: content.html });
    }

    return templates;
  }

  private async getMailgunClient() {
    const config = await this.getConfig();
    if (!config?.apiKey || !config?.mailgun_baseDomain) {
      throw new Error('Missing mailgun base domain or api key');
    }

    return {
      client: new Mailgun(FormData).client({
        username: 'api',
        key: config.apiKey,
        url: `https://${config.mailgun_baseDomain}`,
      }),
      mailDomain: config.mailgun_mailDomain ?? '',
    };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
