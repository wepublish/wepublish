import {
  MailLogStatus,
  MailProvider,
  MailProviderTemplate,
  SendMailProps,
  WebhookForSendMailProps,
  WithExternalId,
} from './mail-provider.interface';
import bodyParser from 'body-parser';
import { NextHandleFunction } from 'connect';
import {
  PrismaClient,
  MailProviderType,
  SettingMailProvider,
} from '@prisma/client';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';

export interface MailProviderProps {
  id: string;
  incomingRequestHandler?: NextHandleFunction;
}

export interface MailProviderProps {
  id: string;
  prisma: PrismaClient;
  kv: KvTtlCacheService;
  incomingRequestHandler?: NextHandleFunction;
}

export abstract class BaseMailProvider implements MailProvider {
  readonly id: string;
  readonly prisma: PrismaClient;
  readonly kv: KvTtlCacheService;
  readonly incomingRequestHandler: NextHandleFunction;

  protected constructor(props: MailProviderProps) {
    this.id = props.id;
    this.incomingRequestHandler =
      props.incomingRequestHandler ?? bodyParser.json();
    this.prisma = props.prisma;
    this.kv = props.kv;
  }

  abstract webhookForSendMail(
    props: WebhookForSendMailProps
  ): Promise<MailLogStatus[]>;
  abstract sendMail(props: SendMailProps): Promise<void>;
  abstract getTemplates(): Promise<MailProviderTemplate[]>;
  abstract getTemplateUrl(template: WithExternalId): Promise<string>;
  abstract getName(): Promise<string>;
  async getConfig(): Promise<SettingMailProvider | null> {
    return await new MailProviderConfig(
      this.prisma,
      this.kv,
      this.id
    ).getConfig();
  }
  public async initDatabaseConfiguration(
    type: MailProviderType
  ): Promise<void> {
    await this.prisma.settingMailProvider.upsert({
      where: {
        id: this.id,
      },
      create: {
        id: this.id,
        type,
      },
      update: {},
    });
    return;
  }
}

class MailProviderConfig {
  private readonly ttl = 21600; // 6h
  private readonly crypto = new SecretCrypto();

  constructor(
    private readonly prisma: PrismaClient,
    private readonly kv: KvTtlCacheService,
    private readonly id: string
  ) {}

  private async load(): Promise<SettingMailProvider | null> {
    await this.prisma.settingMailProvider.update({
      where: { id: this.id },
      data: { lastLoadedAt: new Date() },
    });
    const config = await this.prisma.settingMailProvider.findUnique({
      where: {
        id: this.id,
      },
    });
    if (!config) {
      return null;
    }

    let decryptedApiKey: string | null = null;
    if (config.apiKey) {
      try {
        decryptedApiKey = this.crypto.decrypt(config.apiKey);
      } catch (e) {
        console.error(e);
        throw new Error(
          `Failed to decrypt apikey for Mail provider setting ${this.id}`
        );
      }
    }
    let decryptedWebhookEndpointSecret: string | null = null;
    if (config.webhookEndpointSecret) {
      try {
        decryptedWebhookEndpointSecret = this.crypto.decrypt(
          config.webhookEndpointSecret
        );
      } catch (e) {
        console.error(e);
        throw new Error(
          `Failed to decrypt webhookEndpointSecret for Mail provider setting ${this.id}`
        );
      }
    }
    return {
      ...config,
      apiKey: decryptedApiKey,
      webhookEndpointSecret: decryptedWebhookEndpointSecret,
    };
  }

  async getFromCache(): Promise<SettingMailProvider | null> {
    return this.kv.getOrLoadNs<SettingMailProvider | null>(
      `settings:mailprovider`,
      `${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingMailProvider | null> {
    return await this.getFromCache();
  }
}
