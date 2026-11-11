import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaClient,
  SettingSyncProvider,
  SyncProviderType,
} from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import { describeError } from '@wepublish/utils/api';
import { describeMailchimpError } from './mailchimp-error';

type SyncConfig = SettingSyncProvider & { decryptedApiKey: string | null };

interface MailchimpContact {
  status: string;
  contact_id: string;
}

// Mailchimp rejects example.com and the like as invalid email addresses.
const MOVED_CONTACT_DOMAIN = 'wepublish.ch';

function getStatusCode(error: any): number | null {
  return error?.response?.body?.status ?? error?.status ?? null;
}

function getSubscriberHash(email: string): string {
  return createHash('md5').update(email).digest('hex');
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
        `Could not load sync provider settings: ${describeError(error)}`
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

      await this.renameContact(listId, userId, previousEmail, nextEmail);
    } catch (error) {
      const message = describeMailchimpError(error);

      this.logger.error(
        `Could not update Mailchimp contact of user ${userId} from '${previousEmail}' to '${nextEmail}': ${message}`
      );

      await this.recordSyncError(
        config.id,
        userId,
        nextEmail,
        message,
        getStatusCode(error)
      );
    }
  }

  private async renameContact(
    listId: string,
    userId: string,
    previousEmail: string,
    nextEmail: string
  ): Promise<void> {
    try {
      await mailchimp.lists.updateListMember(
        listId,
        getSubscriberHash(previousEmail),
        {
          email_address: nextEmail,
        }
      );
    } catch (error) {
      const statusCode = getStatusCode(error);

      if (statusCode === 404) {
        this.logger.debug(
          `No Mailchimp contact for '${previousEmail}' in list ${listId}, nothing to rename`
        );

        return;
      }

      // Mailchimp refuses to rename a contact to an email that already has one
      if (
        statusCode === 400 &&
        (await this.moveToExistingContact(
          listId,
          userId,
          previousEmail,
          nextEmail
        ))
      ) {
        return;
      }

      throw error;
    }

    this.logger.log(
      `Updated Mailchimp contact of user ${userId} from '${previousEmail}' to '${nextEmail}'`
    );
  }

  /**
   * The user already has a contact for the new email, e.g. from signing up to
   * the newsletter with it. That contact is renamed to a placeholder and
   * archived, so the previous contact keeps its history and takes the email.
   *
   * Mailchimp refuses a rename onto an email that an archived or even a
   * permanently deleted contact still has (verified 2026-10-09), so the email
   * has to be freed by renaming that contact first.
   *
   * Returns false when there is no such contact, or when it is not subscribed
   * and someone has to decide which one to keep.
   */
  private async moveToExistingContact(
    listId: string,
    userId: string,
    previousEmail: string,
    nextEmail: string
  ): Promise<boolean> {
    const existing = await this.findContact(listId, nextEmail);

    if (!existing) {
      return false;
    }

    const previous = await this.findContact(listId, previousEmail);

    // Nothing gets sent to the previous contact, so there is nothing to move.
    if (previous?.status !== 'subscribed') {
      return true;
    }

    if (existing.status !== 'subscribed') {
      return false;
    }

    const placeholder = `moved-${existing.contact_id}@${MOVED_CONTACT_DOMAIN}`;

    await mailchimp.lists.updateListMember(
      listId,
      getSubscriberHash(nextEmail),
      { email_address: placeholder }
    );

    try {
      // Archives the contact, it can still be restored in Mailchimp.
      await mailchimp.lists.deleteListMember(
        listId,
        getSubscriberHash(placeholder)
      );
      await mailchimp.lists.updateListMember(
        listId,
        getSubscriberHash(previousEmail),
        { email_address: nextEmail }
      );
    } catch (error) {
      await this.restoreContact(listId, placeholder, nextEmail);

      throw error;
    }

    this.logger.log(
      `Moved Mailchimp contact of user ${userId} from '${previousEmail}' to '${nextEmail}', archived the existing contact as '${placeholder}'`
    );

    return true;
  }

  private async restoreContact(
    listId: string,
    placeholder: string,
    email: string
  ): Promise<void> {
    try {
      await mailchimp.lists.updateListMember(
        listId,
        getSubscriberHash(placeholder),
        { status: 'subscribed' }
      );
      await mailchimp.lists.updateListMember(
        listId,
        getSubscriberHash(placeholder),
        { email_address: email }
      );
    } catch (error) {
      throw new Error(
        `Could not give the contact of '${email}' its email back, it is still '${placeholder}': ${describeMailchimpError(error)}`
      );
    }
  }

  private async findContact(
    listId: string,
    email: string
  ): Promise<MailchimpContact | null> {
    try {
      return (await mailchimp.lists.getListMember(
        listId,
        getSubscriberHash(email)
      )) as MailchimpContact;
    } catch (error) {
      if (getStatusCode(error) === 404) {
        return null;
      }

      throw error;
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
        `Could not record Mailchimp sync error for user ${userId}: ${describeError(
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
