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
      `mailprovider:settings:${this.id}`,
      () => this.load(),
      this.ttl
    );
  }

  async getConfig(): Promise<SettingMailProvider | null> {
    return await this.getFromCache();
  }
}
