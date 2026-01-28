import { Injectable } from '@nestjs/common';
import { MailTemplate, PrismaClient } from '@prisma/client';
import { MailContext, MailProviderTemplate } from '@wepublish/mail/api';

export interface MailTemplateSyncDiff {
  remoteNew: MailProviderTemplate[];
  remoteExisting: MailProviderTemplate[];
  localOutdated: MailTemplate[];
}

@Injectable()
export class MailTemplateSyncService {
  constructor(
    private prismaService: PrismaClient,
    private mailContext: MailContext
  ) {}

  /**
   * Synchronizes the local template list with the remote mail provider.
   * This performs the following actions:
   * - updates locally existing templates to match their remote counterpart
   * - creates local templates for any new remote templates
   * - marks any local templates as outdated if their remote counterpart is missing
   */
  async synchronizeTemplates(): Promise<void> {
    const localTemplates = await this.prismaService.mailTemplate.findMany();

    const { mailProvider } = await this.mailContext;
    const remoteTemplates =
      (await mailProvider.getTemplates()) as MailProviderTemplate[];

    const updatedRemoteTemplates = this.findUpdatedRemoteTemplates(
      localTemplates,
      remoteTemplates
    );
    for (const remoteTemplate of updatedRemoteTemplates) {
      await this.prismaService.mailTemplate.update({
        where: { externalMailTemplateId: remoteTemplate.uniqueIdentifier },
        data: {
          name: remoteTemplate.name,
          remoteMissing: false,
        },
      });
    }

    const newRemoteTemplates = this.findNewRemoteTemplates(
      localTemplates,
      remoteTemplates
    );
    for (const remoteTemplate of newRemoteTemplates) {
      await this.prismaService.mailTemplate.create({
        data: {
          name: remoteTemplate.name,
          externalMailTemplateId: remoteTemplate.uniqueIdentifier,
          remoteMissing: false,
        },
      });
    }

    const outdatedLocalTemplates = this.findOutdatedLocalTemplates(
      localTemplates,
      remoteTemplates
    );
    for (const localTemplate of outdatedLocalTemplates) {
      await this.prismaService.mailTemplate.update({
        where: { externalMailTemplateId: localTemplate.externalMailTemplateId },
        data: {
          remoteMissing: true,
        },
      });
    }
  }

  private findUpdatedRemoteTemplates(
    localTemplates: MailTemplate[],
    remoteTemplates: MailProviderTemplate[]
  ): MailProviderTemplate[] {
    return remoteTemplates.filter(remoteTemplate => {
      return localTemplates.find(
        localTemplate =>
          localTemplate.externalMailTemplateId ===
          remoteTemplate.uniqueIdentifier
      );
    });
  }

  private findNewRemoteTemplates(
    localTemplates: MailTemplate[],
    remoteTemplates: MailProviderTemplate[]
  ): MailProviderTemplate[] {
    return remoteTemplates.filter(remoteTemplate => {
      return !localTemplates.find(
        localTemplate =>
          localTemplate.externalMailTemplateId ===
          remoteTemplate.uniqueIdentifier
      );
    });
  }

  private findOutdatedLocalTemplates(
    localTemplates: MailTemplate[],
    remoteTemplates: MailProviderTemplate[]
  ): MailTemplate[] {
    return localTemplates.filter(localTemplate => {
      return !remoteTemplates.find(
        remoteTemplate =>
          remoteTemplate.uniqueIdentifier ===
          localTemplate.externalMailTemplateId
      );
    });
  }
}
