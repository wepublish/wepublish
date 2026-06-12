import crypto from 'crypto';

import axios, { AxiosError, Method } from 'axios';
import bodyParser from 'body-parser';
import { Request } from 'express';

import { MailLogState } from '@prisma/client';

import { BaseMailProvider, MailProviderProps } from './base-mail-provider';
import {
  MailLogStatus,
  MailProviderError,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps,
  WithExternalId,
} from './mail-provider.interface';

const MAILERSEND_API_BASE_URL = 'https://api.mailersend.com/v1';
const MAIL_LOG_TAG_PREFIX = 'mail_log:';

type RawBodyRequest = Request & { rawBody?: string };

type MailerSendTemplate = {
  id: string;
  name: string;
  created_at: string;
  updated_at?: string | null;
};

type MailerSendTemplateListResponse = {
  data?: MailerSendTemplate[];
};

type MailerSendErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type MailerSendRequestOptions = {
  method?: Method;
  body?: unknown;
  headers?: Record<string, string>;
};

function withRawJsonBodyParser() {
  return bodyParser.json({
    verify: (req: RawBodyRequest, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  });
}

function mapMailerSendEventToMailLogState(event: string): MailLogState | null {
  switch (event) {
    case 'activity.sent':
      return MailLogState.accepted;
    case 'activity.delivered':
      return MailLogState.delivered;
    case 'activity.soft_bounced':
    case 'activity.deferred':
      return MailLogState.deferred;
    case 'activity.hard_bounced':
      return MailLogState.bounced;
    case 'activity.spam_complaint':
      return MailLogState.rejected;
    default:
      return null;
  }
}

function extractMailLogId(tags: unknown): string | undefined {
  if (!Array.isArray(tags)) {
    return undefined;
  }

  return tags
    .find(
      (tag): tag is string =>
        typeof tag === 'string' && tag.startsWith(MAIL_LOG_TAG_PREFIX)
    )
    ?.slice(MAIL_LOG_TAG_PREFIX.length);
}

function safeStringify(body: unknown): string {
  return typeof body === 'string' ? body : JSON.stringify(body ?? {});
}

export class MailersendMailProvider extends BaseMailProvider {
  constructor(props: MailProviderProps) {
    super({
      ...props,
      incomingRequestHandler:
        props.incomingRequestHandler ?? withRawJsonBodyParser(),
    });
  }

  private async apiRequest<T>(
    path: string,
    options: MailerSendRequestOptions = {}
  ): Promise<T> {
    const config = await this.getConfig();

    if (!config?.apiKey) {
      throw new MailProviderError('Missing MailerSend API key');
    }

    try {
      const response = await axios.request<T>({
        url: `${MAILERSEND_API_BASE_URL}${path}`,
        method: options.method ?? 'GET',
        data: options.body,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
          ...options.headers,
        },
      });

      return response.data;
    } catch (error) {
      if (!this.isAxiosError(error)) {
        throw error;
      }

      const errorBody = error.response?.data as
        | MailerSendErrorResponse
        | undefined;
      const validationErrors = Object.values(errorBody?.errors ?? {})
        .flat()
        .join(', ');
      const details =
        errorBody?.message ||
        validationErrors ||
        error.response?.statusText ||
        error.message;

      throw new MailProviderError(
        `MailerSend ${options.method ?? 'GET'} ${path} failed: ${details}`
      );
    }
  }

  private isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
  }

  async verifyWebhookSignature(
    rawBody: string,
    signature: string | undefined
  ): Promise<boolean> {
    if (!signature) {
      return false;
    }

    const config = await this.getConfig();
    if (!config?.webhookEndpointSecret) {
      return false;
    }

    const computedSignature = crypto
      .createHmac('sha256', config.webhookEndpointSecret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const received = Buffer.from(signature, 'hex');
    const computed = Buffer.from(computedSignature, 'hex');

    return (
      received.length === computed.length &&
      crypto.timingSafeEqual(received, computed)
    );
  }

  async webhookForSendMail({
    req,
  }: WebhookForSendMailProps): Promise<MailLogStatus[]> {
    if (req.method !== 'POST') {
      return [];
    }

    const signatureHeader = req.headers['signature'];
    const signature =
      Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    const rawBody = (req as RawBodyRequest).rawBody ?? safeStringify(req.body);

    if (!(await this.verifyWebhookSignature(rawBody, signature))) {
      throw new Error('Webhook signature failed');
    }

    const event = req.body?.type;
    const state =
      typeof event === 'string' && mapMailerSendEventToMailLogState(event);
    const mailLogID = extractMailLogId(
      req.body?.data?.tags ?? req.body?.data?.email?.tags
    );

    if (!state || !mailLogID) {
      return [];
    }

    return [
      {
        state,
        mailLogID,
        mailData: rawBody,
      },
    ];
  }

  async sendMail(props: SendMailProps): Promise<void> {
    const config = await this.getConfig();

    if (!config?.fromAddress) {
      throw new MailProviderError('Missing MailerSend fromAddress');
    }

    const body: Record<string, unknown> = {
      from: {
        email: config.fromAddress,
      },
      to: [
        {
          email: props.recipient,
        },
      ],
      subject: props.subject,
      tags: [`${MAIL_LOG_TAG_PREFIX}${props.mailLogID}`],
    };

    const replyToAddress = props.replyToAddress || config.replyToAddress;
    if (replyToAddress) {
      body['reply_to'] = {
        email: replyToAddress,
      };
    }

    if (props.template) {
      body['template_id'] = props.template;

      if (props.templateData && Object.keys(props.templateData).length > 0) {
        body['personalization'] = [
          {
            email: props.recipient,
            data: props.templateData,
          },
        ];
      }
    } else {
      if (props.message) {
        body['text'] = props.message;
      }

      if (props.messageHtml) {
        body['html'] = props.messageHtml;
      }
    }

    await this.apiRequest('/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
  }

  async getTemplates(): Promise<MailProviderTemplate[]> {
    const response = await this.apiRequest<MailerSendTemplateListResponse>(
      '/templates?limit=100'
    );

    return (response.data ?? []).map(template => ({
      name: template.name,
      uniqueIdentifier: template.id,
      createdAt: new Date(template.created_at),
      updatedAt: new Date(template.updated_at ?? template.created_at),
    }));
  }

  async getTemplateUrl(template: WithExternalId): Promise<string> {
    return `https://app.mailersend.com/templates/${template.externalMailTemplateId}`;
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'unknown';
  }
}
