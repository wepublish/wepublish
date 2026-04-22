import crypto from 'crypto';

import { MailLogState } from '@prisma/client';
import {
  EmailParams,
  EmailWebhookEventType,
  MailerSend,
  Recipient,
  Sender,
} from 'mailersend';
import { Personalization } from 'mailersend/lib/modules/Email.module';
import { APIResponse } from 'mailersend/lib/services/request.service';

import {
  MailLogStatus,
  MailProviderError,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps,
  WithExternalId,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

const MAIL_LOG_TAG_PREFIX = 'mail_log:';

// Shape of a MailerSend template as returned by `email.template.list()`.
// The SDK types the response body as `any`, so we narrow it here.
interface MailersendTemplate {
  id: string;
  name: string;
  type?: string;
  created_at: string;
}

function mapMailersendEventToMailLogState(
  event: EmailWebhookEventType | string
): MailLogState | null {
  switch (event) {
    case EmailWebhookEventType.SENT:
      return MailLogState.accepted;
    case EmailWebhookEventType.DELIVERED:
      return MailLogState.delivered;
    case EmailWebhookEventType.SOFT_BOUNCED:
    case EmailWebhookEventType.DEFERRED:
      return MailLogState.deferred;
    case EmailWebhookEventType.HARD_BOUNCED:
      return MailLogState.bounced;
    case EmailWebhookEventType.SPAM_COMPLIANT:
      return MailLogState.rejected;
    default:
      return null;
  }
}

function extractMailLogId(tags: unknown): string | undefined {
  if (!Array.isArray(tags)) return undefined;
  for (const tag of tags) {
    if (typeof tag === 'string' && tag.startsWith(MAIL_LOG_TAG_PREFIX)) {
      return tag.slice(MAIL_LOG_TAG_PREFIX.length);
    }
  }
  return undefined;
}

export class MailersendMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  private async getClient(): Promise<MailerSend> {
    const config = await this.getConfig();
    if (!config?.apiKey) {
      throw new MailProviderError('Missing MailerSend API key');
    }
    return new MailerSend({ apiKey: config.apiKey });
  }

  async verifyWebhookSignature(
    rawBody: string,
    signature: string | undefined
  ): Promise<boolean> {
    if (!signature) return false;
    const config = await this.getConfig();
    if (!config?.webhookEndpointSecret) return false;

    const computed = crypto
      .createHmac('sha256', config.webhookEndpointSecret)
      .update(rawBody)
      .digest('hex');

    const expected = new Uint8Array(Buffer.from(computed, 'utf8'));
    const received = new Uint8Array(Buffer.from(signature, 'utf8'));
    if (expected.length !== received.length) return false;
    return crypto.timingSafeEqual(expected, received);
  }

  async webhookForSendMail({
    req,
  }: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    if (req.method !== 'POST') {
      return [];
    }

    const signature = req.headers['signature'];
    const sigValue = Array.isArray(signature) ? signature[0] : signature;

    // MailerSend signs the raw request body. Express parses JSON by default
    // with bodyParser.json(), so we reconstruct the signed string from the
    // parsed body. If rawBody is available on the request (preserved via
    // bodyParser.json({ verify: ... })) we use that; otherwise stringify.
    const rawBody =
      typeof (req as any).rawBody === 'string' ?
        (req as any).rawBody
      : JSON.stringify(req.body);

    if (!(await this.verifyWebhookSignature(rawBody, sigValue))) {
      throw new Error('Webhook signature failed');
    }

    const eventType: string | undefined = req.body?.type;
    const state =
      eventType ? mapMailersendEventToMailLogState(eventType) : null;

    const mailLogID = extractMailLogId(req.body?.data?.email?.tags);

    const mailLogStatuses: MailLogStatus[] = [];
    if (state !== null && mailLogID !== undefined) {
      mailLogStatuses.push({
        state,
        mailLogID,
        mailData: JSON.stringify(req.body),
      });
    }

    return mailLogStatuses;
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const config = await this.getConfig();
    if (!config?.fromAddress) {
      throw new MailProviderError('Missing MailerSend fromAddress');
    }

    const client = await this.getClient();

    const params = new EmailParams()
      .setFrom(new Sender(config.fromAddress))
      .setTo([new Recipient(props.recipient)])
      .setSubject(props.subject)
      .setTags([`${MAIL_LOG_TAG_PREFIX}${props.mailLogID}`]);

    if (props.replyToAddress) {
      params.setReplyTo(new Sender(props.replyToAddress));
    }

    if (props.template) {
      params.setTemplateId(props.template);
      if (props.templateData && Object.keys(props.templateData).length > 0) {
        const personalization: Personalization[] = [
          {
            email: props.recipient,
            data: props.templateData,
          },
        ];
        params.setPersonalization(personalization);
      }
    } else {
      if (props.messageHtml) params.setHtml(props.messageHtml);
      if (props.message) params.setText(props.message);
    }

    try {
      const response: APIResponse = await client.email.send(params);
      if (response.statusCode >= 400) {
        throw new MailProviderError(
          `MailerSend send failed: ${response.body?.message ?? response.statusCode}`
        );
      }
    } catch (error: any) {
      if (error instanceof MailProviderError) throw error;
      const message =
        error?.body?.message ?? error?.message ?? 'Unknown MailerSend error';
      throw new MailProviderError(`MailerSend send failed: ${message}`);
    }
  }

  async getTemplates(): Promise<MailProviderTemplate[]> {
    const client = await this.getClient();

    try {
      const response: APIResponse = await client.email.template.list();
      const items = (response.body?.data as MailersendTemplate[]) ?? [];

      return items.map(template => ({
        name: template.name,
        uniqueIdentifier: template.id,
        createdAt: new Date(template.created_at),
        updatedAt: new Date(template.created_at),
      }));
    } catch (error: any) {
      const message =
        error?.body?.message ?? error?.message ?? 'Unknown MailerSend error';
      throw new MailProviderError(`MailerSend templates failed: ${message}`);
    }
  }

  async getTemplateUrl(template: WithExternalId): Promise<string> {
    return `https://app.mailersend.com/templates/${template.externalMailTemplateId}`;
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
