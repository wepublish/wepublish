import crypto from 'crypto';

import mailchimp from '@mailchimp/mailchimp_transactional';
import { AxiosError } from 'axios';

import { MailLogState } from '@prisma/client';
import {
  MailLogStatus,
  MailProviderError,
  SendMailProps,
  WebhookForSendMailProps,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

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
      },
    });

    if (this.responseIsError(response)) {
      throw new MailProviderError((response.response?.data as Error).message);
    }
  }

  private responseIsError<T>(response: T | AxiosError): response is AxiosError {
    return 'isAxiosError' in (response as object);
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
