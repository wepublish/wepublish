import { MailLogState } from '@prisma/client';
import crypto from 'crypto';
import FormData from 'form-data';
import Client from 'mailgun.js/client';
import {
  MailLogStatus,
  MailProviderError,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps,
  WithExternalId,
} from './mail-provider.interface';
import { BaseMailProvider, MailProviderProps } from './base-mail-provider';

export interface MailgunMailProviderProps extends MailProviderProps {
  apiKey: string;
  baseDomain: string;
  mailDomain: string;
  webhookEndpointSecret: string;
  fromAddress: string;
  mailgunClient: Client;
}

interface VerifyWebhookSignatureProps {
  timestamp: string;
  token: string;
  signature: string;
}

interface MailgunApiError {
  status: number;
  details: string;
  type: string;
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

export class MailgunMailProvider extends BaseMailProvider {
  readonly auth: string;
  readonly baseDomain: string;
  readonly mailDomain: string;
  readonly webhookEndpointSecret: string;
  readonly mailgunClient: Client;

  constructor(props: MailgunMailProviderProps) {
    super(props);
    this.auth = Buffer.from(`api:${props.apiKey}`).toString('base64');
    this.baseDomain = props.baseDomain;
    this.mailDomain = props.mailDomain;
    this.webhookEndpointSecret = props.webhookEndpointSecret;
    this.mailgunClient = props.mailgunClient;
  }

  verifyWebhookSignature(props: VerifyWebhookSignatureProps): boolean {
    const encodedToken = crypto
      .createHmac('sha256', this.webhookEndpointSecret)
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
      !this.verifyWebhookSignature({ timestamp, token, signature })
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
    const mailLogID = body['event-data']['user-variables'].mail_log_id;

    if (state !== null && mailLogID !== undefined) {
      mailLogStatuses.push({
        state,
        mailLogID,
        mailData: JSON.stringify(body['event-data']),
      });
    }

    return mailLogStatuses;
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const form = new FormData();
    form.append('from', this.fromAddress);
    form.append('to', props.recipient);
    form.append('subject', props.subject);
    form.append('text', props.message ?? '');

    if (props.messageHtml) {
      form.append('html', props.messageHtml);
    }

    if (props.template) {
      form.append('template', props.template);

      for (const [key, value] of Object.entries(props.templateData || {})) {
        // Enforce max length of 16kb per key => https://documentation.mailgun.com/en/latest/api-sending.html
        let serializedValue: string | number = '';
        if (typeof value === 'number') {
          serializedValue = value;
        } else if (typeof value === 'string') {
          serializedValue = value.substring(0, 15000);
        } else {
          serializedValue = JSON.stringify(value).substring(0, 15000);
        }
        form.append(`v:${key}`, serializedValue);
      }
    }

    form.append('v:mail_log_id', props.mailLogID);
    return new Promise((resolve, reject) => {
      form.submit(
        {
          protocol: 'https:',
          host: this.baseDomain,
          path: `/v3/${this.mailDomain}/messages`,
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${this.auth}`,
          },
        },
        (err, res) => {
          return err || res.statusCode !== 200 ? reject(err || res) : resolve();
        }
      );
    });
  }

  async getTemplates(): Promise<MailProviderTemplate[]> {
    try {
      const response = await this.mailgunClient.domains.domainTemplates.list(
        this.mailDomain
      );
      const templates: MailProviderTemplate[] = response.items.map(
        mailTemplateResponse => {
          return {
            name: mailTemplateResponse.name,
            uniqueIdentifier: mailTemplateResponse.name,
            createdAt: new Date(mailTemplateResponse.createdAt),
            updatedAt: new Date(mailTemplateResponse.createdAt),
          };
        }
      );

      return templates;
    } catch (e: unknown) {
      if (this.isMailgunApiError(e)) {
        throw new MailProviderError(e.details);
      }

      throw new MailProviderError(String(e));
    }
  }

  isMailgunApiError(error: unknown): error is MailgunApiError {
    return (error as MailgunApiError).type === 'MailgunAPIError';
  }

  getTemplateUrl(template: WithExternalId): string {
    return `https://app.mailgun.com/app/sending/domains/${this.mailDomain}/templates/details/${template.externalMailTemplateId}`;
  }
}
