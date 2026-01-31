import { PrismaClient, SettingMailProvider, UserEvent } from '@prisma/client';
import { BaseMailProvider } from './mail-provider/base-mail-provider';
import { MailProviderTemplate } from './mail-provider/mail-provider.interface';

import { Injectable } from '@nestjs/common';
import { MailController, MailControllerConfig } from './mail.controller';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';

export interface SendRemoteEMailProps {
  readonly remoteTemplate: string;
  readonly recipient: string;
  readonly mailLogID: string;
  readonly data: Record<string, any>;
}

// LEGACY
export interface MailContextOptions {
  readonly defaultFromAddress: string;
  readonly defaultReplyToAddress?: string;
}

class MailContextConfig {
  private readonly ttl = 21600; // 6h

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
    return this.prisma.settingMailProvider.findUnique({
      where: {
        id: this.id,
      },
    });
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

export interface MailContextInterface {
  sendMail(opts: MailControllerConfig): Promise<void>;
}

export interface MailContextProps {
  readonly mailProvider: BaseMailProvider;
  readonly prisma: PrismaClient;
  readonly kv: KvTtlCacheService;
}

@Injectable()
export class MailContext implements MailContextInterface {
  mailProvider: BaseMailProvider;
  prisma: PrismaClient;
  kv: KvTtlCacheService;

  constructor(props: MailContextProps) {
    this.mailProvider = props.mailProvider;
    this.prisma = props.prisma;
    this.kv = props.kv;
  }

  async sendMail(
    opts: Omit<MailControllerConfig, 'externalMailTemplateId'> & {
      externalMailTemplateId: string | null;
    }
  ) {
    if (opts.externalMailTemplateId) {
      await new MailController(
        this.prisma as PrismaClient,
        this,
        opts as MailControllerConfig
      ).sendMail();
    }
  }

  async sendRemoteTemplateDirect({
    remoteTemplate,
    recipient,
    data,
    mailLogID,
  }: SendRemoteEMailProps): Promise<void> {
    if (!this.mailProvider) {
      throw new Error('MailProvider is not set!');
    }
    const config = await new MailContextConfig(
      this.prisma,
      this.kv,
      this.mailProvider.id
    ).getConfig();

    await this.mailProvider.sendMail({
      mailLogID,
      recipient,
      replyToAddress: config?.replyToAddress ?? config?.fromAddress ?? '',
      subject: '',
      template: remoteTemplate,
      templateData: data,
    });
  }

  async getUserTemplateName(
    event: UserEvent,
    throwOnMissing: true
  ): Promise<string>;
  async getUserTemplateName(
    event: UserEvent,
    throwOnMissing?: false
  ): Promise<string | null>;
  async getUserTemplateName(
    event: UserEvent,
    throwOnMissing = true
  ): Promise<string | null> {
    const userFlowMail = await this.prisma.userFlowMail.findUnique({
      where: {
        event,
      },
      include: {
        mailTemplate: true,
      },
    });

    // Return null if no mailtemplete is defined and function is not called "throwOnMissing"
    if (!throwOnMissing) {
      return userFlowMail?.mailTemplate?.externalMailTemplateId || null;
    }

    if (!userFlowMail) {
      throw new Error(`No UserFlowMail defined for event ${event}`);
    }

    if (!userFlowMail.mailTemplate) {
      throw new Error(`No email template defined for event ${event}`);
    }

    return userFlowMail.mailTemplate.externalMailTemplateId;
  }

  async getTemplates(): Promise<MailProviderTemplate[]> {
    return this.mailProvider.getTemplates();
  }

  async getUsedTemplateIdentifiers(): Promise<string[]> {
    const intervals = await this.prisma.subscriptionInterval.findMany({
      include: {
        mailTemplate: true,
      },
    });

    return intervals.flatMap(
      interval => interval.mailTemplate?.externalMailTemplateId ?? []
    );
  }
}
