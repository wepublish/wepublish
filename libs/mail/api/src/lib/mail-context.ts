import { PrismaClient, SettingMailProvider, UserEvent } from '@prisma/client';
import { BaseMailProvider } from './mail-provider/base-mail-provider';

import { Injectable } from '@nestjs/common';
import { MailController, MailControllerConfig } from './mail.controller';
import { KvTtlCacheService } from '@wepublish/kv-ttl-cache/api';
import { SecretCrypto } from '@wepublish/settings/api';
import { composeMail, MailTemplateContent } from './mail-renderer';

export interface SendComposedMailProps {
  readonly mailTemplateId: string;
  readonly recipient: string;
  readonly mailLogID: string;
  readonly data: Record<string, any>;
}

export interface SendComposedContentProps {
  readonly content: MailTemplateContent;
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

export interface MailContextInterface {
  sendMail(opts: MailControllerConfig): Promise<void>;
}

export interface MailContextProps {
  readonly mailProvider: BaseMailProvider;
  readonly prisma: PrismaClient;
  readonly kv: KvTtlCacheService;
  readonly jwtGenerator: (userId: string) => Promise<string>;
}

@Injectable()
export class MailContext implements MailContextInterface {
  mailProvider: BaseMailProvider;
  prisma: PrismaClient;
  kv: KvTtlCacheService;
  jwtGenerator: (userId: string) => Promise<string>;

  constructor(props: MailContextProps) {
    this.mailProvider = props.mailProvider;
    this.prisma = props.prisma;
    this.kv = props.kv;
    this.jwtGenerator = props.jwtGenerator;
  }

  async sendMail(
    opts: Omit<MailControllerConfig, 'mailTemplateId'> & {
      mailTemplateId: string | null;
    }
  ) {
    if (opts.mailTemplateId) {
      await new MailController(
        this.prisma as PrismaClient,
        this,
        opts as MailControllerConfig
      ).sendMail();
    }
  }

  /**
   * Compose the mail locally from the stored template (subject, html, text)
   * and send the fully-composed message to the mail provider. The provider's
   * own template engine is not used.
   */
  async sendComposedMail({
    mailTemplateId,
    recipient,
    data,
    mailLogID,
  }: SendComposedMailProps): Promise<void> {
    if (!this.mailProvider) {
      throw new Error('MailProvider is not set!');
    }

    const template = await this.prisma.mailTemplate.findUnique({
      where: { id: mailTemplateId },
    });

    if (!template) {
      throw new Error(`MailTemplate <${mailTemplateId}> not found!`);
    }

    const config = await new MailContextConfig(
      this.prisma,
      this.kv,
      this.mailProvider.id
    ).getConfig();

    const composed = composeMail(template, data);

    await this.mailProvider.sendMail({
      mailLogID,
      recipient,
      replyToAddress: config?.replyToAddress ?? config?.fromAddress ?? '',
      subject: composed.subject,
      message: composed.message,
      messageHtml: composed.messageHtml,
    });
  }

  /**
   * Compose ad-hoc content (not a stored template) locally and send it. Used
   * for test mails from the editor, where the draft isn't saved yet.
   */
  async sendComposedContent({
    content,
    recipient,
    data,
    mailLogID,
  }: SendComposedContentProps): Promise<void> {
    if (!this.mailProvider) {
      throw new Error('MailProvider is not set!');
    }

    const config = await new MailContextConfig(
      this.prisma,
      this.kv,
      this.mailProvider.id
    ).getConfig();

    const composed = composeMail(content, data);

    await this.mailProvider.sendMail({
      mailLogID,
      recipient,
      replyToAddress: config?.replyToAddress ?? config?.fromAddress ?? '',
      subject: composed.subject,
      message: composed.message,
      messageHtml: composed.messageHtml,
    });
  }

  async getUserTemplateId(
    event: UserEvent,
    throwOnMissing: true
  ): Promise<string>;
  async getUserTemplateId(
    event: UserEvent,
    throwOnMissing?: false
  ): Promise<string | null>;
  async getUserTemplateId(
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

    // Return null if no mailtemplate is defined and function is not called "throwOnMissing"
    if (!throwOnMissing) {
      return userFlowMail?.mailTemplate?.id || null;
    }

    if (!userFlowMail) {
      throw new Error(`No UserFlowMail defined for event ${event}`);
    }

    if (!userFlowMail.mailTemplate) {
      throw new Error(`No email template defined for event ${event}`);
    }

    return userFlowMail.mailTemplate.id;
  }

  async getUsedTemplateIdentifiers(): Promise<string[]> {
    const [intervals, userFlowMails] = await Promise.all([
      this.prisma.subscriptionInterval.findMany({
        include: {
          mailTemplate: true,
        },
      }),
      this.prisma.userFlowMail.findMany({
        include: {
          mailTemplate: true,
        },
      }),
    ]);

    return [
      ...intervals.flatMap(interval => interval.mailTemplate?.id ?? []),
      ...userFlowMails.flatMap(
        userFlowMail => userFlowMail.mailTemplate?.id ?? []
      ),
    ];
  }
}
