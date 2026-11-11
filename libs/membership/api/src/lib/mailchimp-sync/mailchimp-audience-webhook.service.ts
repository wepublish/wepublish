import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { describeMailchimpError } from '@wepublish/mail/api';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { randomBytes } from 'crypto';
import { AUDIENCE_WEBHOOK_PATH_PREFIX } from './mailchimp-audience-webhook';

export interface MailchimpAudienceWebhookRegistration {
  url: string;
  webhookId: string;
  registeredAt: Date;
}

/** The events worth a call: the rest say nothing about whether an inbox works. */
const EVENTS = {
  subscribe: false,
  unsubscribe: true,
  profile: false,
  cleaned: true,
  upemail: true,
  campaign: false,
};

/** Whoever caused the change: the person, an admin in Mailchimp, or an API call. */
const SOURCES = { user: true, admin: true, api: true };

type Webhook = { id?: string; url?: string };

type ListsApi = {
  getListWebhooks: (listId: string) => Promise<{ webhooks?: Webhook[] }>;
  createListWebhook: (
    listId: string,
    body: Record<string, unknown>
  ) => Promise<Webhook>;
  updateListWebhook: (
    listId: string,
    webhookId: string,
    body: Record<string, unknown>
  ) => Promise<Webhook>;
};

const statusOf = (error: unknown): number | null =>
  (error as { response?: { body?: { status?: number } }; status?: number })
    ?.response?.body?.status ??
  (error as { status?: number })?.status ??
  null;

/**
 * Registers the audience webhook at Mailchimp from the sync settings, so no
 * admin has to paste a URL into Mailchimp. Idempotent: a webhook registered
 * earlier is updated, one Mailchimp still has for this installation is
 * adopted, and the secret in the URL is kept once it exists.
 */
@Injectable()
export class MailchimpAudienceWebhookService {
  private logger = new Logger('MailchimpAudienceWebhookService');

  constructor(private settings: SyncProviderSettingsService) {}

  async register(
    configId: string
  ): Promise<MailchimpAudienceWebhookRegistration> {
    const config = await this.settings.getSyncConfig(configId);
    const listId = config.mailchimp_listId;

    if (!listId) {
      throw new BadRequestException(
        'Choose a Mailchimp audience before registering its webhook'
      );
    }

    const hostUrl = process.env['HOST_URL']?.replace(/\/+$/, '');

    if (!hostUrl) {
      throw new Error(
        'HOST_URL is not configured; Mailchimp needs the public address of this api'
      );
    }

    this.configureClient(config.decryptedApiKey);

    const secret =
      config.decryptedWebhookSecret ?? randomBytes(24).toString('base64url');
    const endpoint = `${hostUrl}/${AUDIENCE_WEBHOOK_PATH_PREFIX}/mailchimp/${configId}`;
    const url = `${endpoint}?key=${secret}`;
    const body = { url, events: EVENTS, sources: SOURCES };
    const lists = mailchimp.lists as unknown as ListsApi;

    try {
      let webhookId = await this.renew(
        lists,
        listId,
        config.mailchimp_webhookId,
        body
      );

      if (!webhookId) {
        const known = (await lists.getListWebhooks(listId)).webhooks ?? [];
        const mine = known.find(webhook => webhook.url?.startsWith(endpoint));

        if (mine?.id) {
          await lists.updateListWebhook(listId, mine.id, body);
          webhookId = mine.id;
        } else {
          const created = await lists.createListWebhook(listId, body);
          webhookId = created.id ?? '';
        }
      }

      const registeredAt = new Date();

      await this.settings.setMailchimpWebhook(configId, {
        secret: config.decryptedWebhookSecret ? undefined : secret,
        webhookId,
        registeredAt,
      });
      this.logger.log(
        `Registered the audience webhook ${webhookId} of list ${listId} at Mailchimp`
      );

      return { url, webhookId, registeredAt };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new Error(
        `Mailchimp refused the webhook registration: ${describeMailchimpError(error)}`
      );
    }
  }

  /** Updates the webhook registered before; null when Mailchimp no longer knows it. */
  private async renew(
    lists: ListsApi,
    listId: string,
    webhookId: string | null,
    body: Record<string, unknown>
  ): Promise<string | null> {
    if (!webhookId) {
      return null;
    }

    try {
      await lists.updateListWebhook(listId, webhookId, body);

      return webhookId;
    } catch (error) {
      if (statusOf(error) === 404) {
        return null;
      }

      throw error;
    }
  }

  private configureClient(apiKey: string | null) {
    if (!apiKey) {
      throw new BadRequestException('Missing Mailchimp API key');
    }

    const server = apiKey.split('-')[1];

    if (!server) {
      throw new BadRequestException(
        'Invalid Mailchimp API key format (expected key-server)'
      );
    }

    mailchimp.setConfig({ apiKey, server });
  }
}
