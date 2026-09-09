import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  SettingSyncProvider,
  SyncProviderType,
} from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import { SyncProviderSettingsService } from '@wepublish/settings/api';

type SyncConfig = SettingSyncProvider & { decryptedApiKey: string | null };

function getStatusCode(error: any): number | null {
  return error?.response?.body?.status ?? error?.status ?? null;
}

function getErrorMessage(error: any): string {
  const detail = error?.response?.body?.detail;
  const title = error?.response?.body?.title;

  if (title && detail) {
    return `${title}: ${detail}`;
  }

  return detail ?? error?.message ?? String(error);
}

@Injectable()
export class MailchimpContactService {
  private readonly logger = new Logger(MailchimpContactService.name);

  constructor(
    private prisma: PrismaClient,
    private syncProviderSettingsService: SyncProviderSettingsService
  ) {}

  async updateContactEmail(
    userId: string,
    oldEmail: string,
    newEmail: string
  ): Promise<void> {
    const previousEmail = oldEmail.trim().toLowerCase();
    const nextEmail = newEmail.trim().toLowerCase();

    if (previousEmail === nextEmail) {
      return;
    }

    let configs: SyncConfig[] = [];

    try {
      configs = await this.syncProviderSettingsService.getEnabledSyncConfigs();
    } catch (error) {
      this.logger.error(
        `Could not load sync provider settings: ${getErrorMessage(error)}`
      );

      return;
    }

    for (const config of configs) {
      if (config.type !== SyncProviderType.MAILCHIMP) {
        continue;
      }

      if (!config.decryptedApiKey || !config.mailchimp_listId) {
        continue;
      }

      await this.updateContactEmailForConfig(
        config,
        userId,
        previousEmail,
        nextEmail
      );
    }
  }

  private async updateContactEmailForConfig(
    config: SyncConfig,
    userId: string,
    previousEmail: string,
    nextEmail: string
  ): Promise<void> {
    const listId = config.mailchimp_listId as string;

    try {
      this.configureMailchimpClient(config);

      await mailchimp.lists.updateListMember(
        listId,
        createHash('md5').update(previousEmail).digest('hex'),
        {
          email_address: nextEmail,
        }
      );

      this.logger.log(
        `Updated Mailchimp contact of user ${userId} from '${previousEmail}' to '${nextEmail}'`
      );
    } catch (error) {
      const statusCode = getStatusCode(error);

      if (statusCode === 404) {
        this.logger.debug(
          `No Mailchimp contact for '${previousEmail}' in list ${listId}, nothing to rename`
        );

        return;
      }

      const message = getErrorMessage(error);

      this.logger.error(
        `Could not update Mailchimp contact of user ${userId} from '${previousEmail}' to '${nextEmail}': ${message}`
      );

      await this.recordSyncError(
        config.id,
        userId,
        nextEmail,
        message,
        statusCode
      );
    }
  }

  private async recordSyncError(
    syncProviderId: string,
    userId: string,
    email: string,
    errorMessage: string,
    statusCode: number | null
  ): Promise<void> {
    try {
      await this.prisma.mailchimpSyncError.upsert({
        where: {
          userId_syncProviderId: { userId, syncProviderId },
        },
        create: { userId, syncProviderId, email, errorMessage, statusCode },
        update: { email, errorMessage, statusCode },
      });
    } catch (error) {
      this.logger.error(
        `Could not record Mailchimp sync error for user ${userId}: ${getErrorMessage(
          error
        )}`
      );

      throw error;
    }
  }

  private configureMailchimpClient(config: SyncConfig): void {
    const server = (config.decryptedApiKey as string).split('-')[1];

    if (!server) {
      throw new Error('Invalid Mailchimp API key format (expected key-server)');
    }

    mailchimp.setConfig({
      apiKey: config.decryptedApiKey as string,
      server,
    });
  }
}
