import crypto from 'crypto';

import mailchimp from '@mailchimp/mailchimp_transactional';
import { AxiosError } from 'axios';

import { MailLogState } from '@prisma/client';
import {
  MailLogStatus,
  MailProviderError,
  MailProviderTemplateContent,
  SendMailProps,
  WebhookForSendMailProps,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

type MessageMetadata = NonNullable<mailchimp.MessagesMessage['metadata']>;

/** The typings demand a `website` key that Mandrill neither needs nor reads. */
const mailLogMetadata = (mailLogID: string): MessageMetadata =>
  ({ mail_log_id: mailLogID }) as unknown as MessageMetadata;

interface VerifyWebhookSignatureProps {
  signature: string;
  url: string;
  params: Record<string, any>;
}

function mapMandrillEventToMailLogState(event: string): MailLogState | null {
  switch (event) {
    case 'send':
      return MailLogState.delivered;
    case 'deferral':
      return MailLogState.deferred;
    case 'hard_bounce':
    case 'soft_bounce':
      return MailLogState.bounced;
    case 'reject':
      return MailLogState.rejected;
    default:
      return null;
  }
}

export class MailchimpMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super(props);
  }

  async getMailchimpClient(): Promise<mailchimp.ApiClient> {
    const config = await this.getConfig();
    if (!config?.apiKey) {
      throw new Error('Missing mailchimp base domain or api key');
    }
    return mailchimp(config.apiKey);
  }

  async verifyWebhookSignature({
    signature,
    url,
    params,
  }: VerifyWebhookSignatureProps): Promise<boolean> {
    const config = await this.getConfig();
    const keys = Object.keys(params).sort();

    const longString = keys.reduce((sig, key) => {
      return sig + key + params[key];
    }, url || '');

    const generatedSignature = crypto
      .createHmac('sha1', config?.webhookEndpointSecret ?? '')
      .update(longString)
      .digest('base64');

    return signature === generatedSignature;
  }

  async webhookForSendMail({
    req,
  }: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    if (req.method !== 'POST') {
      return [];
    }

    if (typeof req.headers['x-mandrill-signature'] !== 'string') {
      throw new Error('Webhook Header is missing signature');
    }

    if (
      !this.verifyWebhookSignature({
        signature: req.headers['x-mandrill-signature'],
        url: `https://${req.headers.host}${req.originalUrl}`,
        params: req.body,
      })
    ) {
      throw new Error('Webhook signature failed');
    }

    const mandrillEvents = JSON.parse(req.body.mandrill_events);
    const mailLogStatuses: MailLogStatus[] = [];

    for (const mandrillEvent of mandrillEvents) {
      const state = mapMandrillEventToMailLogState(mandrillEvent.event);
      const mailLogID = mandrillEvent?.msg?.metadata?.mail_log_id;

      if (state !== null && mailLogID !== undefined) {
        mailLogStatuses.push({
          state,
          mailLogID,
          mailData: JSON.stringify(mandrillEvent),
        });
      }
    }

    return mailLogStatuses;
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const config = await this.getConfig();
    const mailchimpClient = await this.getMailchimpClient();

    const response = await mailchimpClient.messages.send({
      message: {
        html: props.messageHtml,
        text: props.message,
        subject: props.subject,
        from_email: config?.fromAddress || '',
        to: [
          {
            email: props.recipient,
            type: 'to',
          },
        ],
        // Carried back by the webhook, which maps the delivery events of this
        // message onto its mail log entry.
        metadata: mailLogMetadata(props.mailLogID),
      },
    });

    if (this.responseIsError(response)) {
      throw new MailProviderError((response.response?.data as Error).message);
    }

    this.throwOnRejectedRecipient(response);
  }

  /**
   * Mandrill answers a refused message with HTTP 200 and a per-recipient
   * `rejected`/`invalid` status — without this the mail would be logged as
   * submitted although the provider never accepted it.
   */
  private throwOnRejectedRecipient(
    results: mailchimp.MessagesSendResponse[]
  ): void {
    const rejected = results.find(
      result => result.status === 'rejected' || result.status === 'invalid'
    );

    if (!rejected) {
      return;
    }

    throw new MailProviderError(
      `Mandrill ${rejected.status} ${rejected.email}${
        rejected.reject_reason ? `: ${rejected.reject_reason}` : ''
      }`
    );
  }

  private responseIsError<T>(response: T | AxiosError): response is AxiosError {
    return 'isAxiosError' in (response as object);
  }

  async getTemplateContent(
    externalMailTemplateId: string
  ): Promise<MailProviderTemplateContent> {
    const mailchimpClient = await this.getMailchimpClient();
    const response = await mailchimpClient.templates.info({
      name: externalMailTemplateId,
    });

    if (this.responseIsError(response)) {
      throw new MailProviderError(
        (response.response?.data as Error | undefined)?.message ??
          `Failed to load template ${externalMailTemplateId}`
      );
    }

    const template = response as {
      code?: string;
      publish_code?: string;
      subject?: string;
      publish_subject?: string;
    };

    return {
      html: template.publish_code ?? template.code ?? '',
      subject: template.publish_subject ?? template.subject,
    };
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
