import { PrismaClient, UserEvent } from '@prisma/client';
import { BaseMailProvider } from './mail-provider/base-mail-provider';
import { MailProviderTemplate } from './mail-provider/mail-provider.interface';

import { Injectable } from '@nestjs/common';
import { MailController, MailControllerConfig } from './mail.controller';

export interface SendRemoteEMailProps {
  readonly remoteTemplate: string;
  readonly recipient: string;
  readonly mailLogID: string;
  readonly data: Record<string, any>;
}

export interface MailContextOptions {
  readonly defaultFromAddress: string;
  readonly defaultReplyToAddress?: string;
}

export interface MailContextInterface {
  defaultFromAddress: string;
  defaultReplyToAddress?: string;

  sendMail(opts: MailControllerConfig): Promise<void>;
}

export interface MailContextProps extends MailContextOptions {
  readonly mailProvider: BaseMailProvider;
  readonly prisma: PrismaClient;
}

@Injectable()
export class MailContext implements MailContextInterface {
  mailProvider: BaseMailProvider;
  prisma: PrismaClient;
  defaultFromAddress: string;
  defaultReplyToAddress?: string;

  constructor(props: MailContextProps) {
    this.mailProvider = props.mailProvider;
    this.prisma = props.prisma;

    this.defaultFromAddress = props.defaultFromAddress;
    this.defaultReplyToAddress = props.defaultReplyToAddress;
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

    await this.mailProvider.sendMail({
      mailLogID,
      recipient,
      replyToAddress: this.defaultReplyToAddress ?? this.defaultFromAddress,
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
