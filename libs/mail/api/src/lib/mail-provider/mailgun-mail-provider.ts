import {
  MailLogState,
  PrismaClient,
  SettingMailProvider,
} from '@prisma/client';
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
import Mailgun from 'mailgun.js';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

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
class MailGunConfig {
  private readonly ttl = 60;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingMailProvider | null> {
    return this.prisma.settingMailProvider.findUnique({
      where: {
        id: this.id,
      },
    });
  }

  async getFromCache(): Promise<SettingMailProvider | null> {
    return this.kv.getOrLoad<SettingMailProvider | null>(
      `mailgun:settings:${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingMailProvider | null> {
    return await this.getFromCache();
  }
}

export class MailgunMailProvider extends BaseMailProvider {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    props: MailProviderProps
  ) {
    super(props);
  }

  async getMailgunClient(): Promise<Client> {
    const config = await new MailGunConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    if (!config?.apiKey || !config?.mailgun_baseDomain) {
      throw new Error('Missing mailgun base domain or api key');
    }
    return new Mailgun(FormData).client({
      username: 'api',
      key: config.apiKey,
      url: `https://${config.mailgun_baseDomain}`,
    });
  }

  async verifyWebhookSignature(
    props: VerifyWebhookSignatureProps
  ): Promise<boolean> {
    const config = await new MailGunConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
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
    const config = await new MailGunConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    const form = new FormData();
    form.append('from', config?.fromAddress ?? '');
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
          return err || res.statusCode !== 200 ? reject(err || res) : resolve();
        }
      );
    });
  }

  async getTemplates(): Promise<MailProviderTemplate[]> {
    const config = await new MailGunConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    const mailgunClient = await this.getMailgunClient();
    try {
      const response = await mailgunClient.domains.domainTemplates.list(
        config?.mailgun_mailDomain ?? ''
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

  async getTemplateUrl(template: WithExternalId): Promise<string> {
    const config = await new MailGunConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
    return `https://app.mailgun.com/app/sending/domains/${config?.mailgun_mailDomain}/templates/details/${template.externalMailTemplateId}`;
  }

  async getName(): Promise<string> {
    return (
      (await new MailGunConfig(this.prisma, this.kv, this.id).getConfig())
        ?.name ?? 'unknown'
    );
  }
}
