import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  SettingSyncProvider,
  SettingSyncProviderNewsletter,
  SyncProviderType,
} from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createHash } from 'crypto';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import {
  UpdateUserNewslettersInput,
  UserNewsletterGroup,
} from './mailchimp-newsletter.model';

type SyncConfig = SettingSyncProvider & { decryptedApiKey: string | null };

type ListMember = {
  status: string;
  interests?: Record<string, boolean>;
};

const SUBSCRIBED_STATUSES = ['subscribed', 'pending'];

const subscriberHash = (email: string) =>
  createHash('md5').update(email.trim().toLowerCase()).digest('hex');

const mailchimpError = (error: any) => {
  const status = error?.response?.body?.status ?? error?.status;
  const detail =
    error?.response?.body?.detail ?? error?.message ?? String(error);
  const title = error?.response?.body?.title ?? 'Mailchimp API error';

  return new Error(`${title} (${status}): ${detail}`);
};

/**
 * Lets logged in users toggle the Mailchimp interests (newsletters) an admin
 * configured on a sync provider.
 */
@Injectable()
export class MailchimpNewsletterService {
  constructor(private syncProviderSettings: SyncProviderSettingsService) {}

  async getUserNewsletters(email: string): Promise<UserNewsletterGroup[]> {
    const configs = await this.mailchimpConfigs();
    const groups: UserNewsletterGroup[] = [];

    // Sequential, as the Mailchimp client config is global.
    for (const config of configs) {
      const newsletters = await this.syncProviderSettings.newsletters(
        config.id
      );

      if (!newsletters.length) {
        continue;
      }

      this.configureMailchimpClient(config);
      const member = await this.getListMember(
        config.mailchimp_listId as string,
        email
      );

      groups.push(this.toGroup(config.id, newsletters, member));
    }

    return groups;
  }

  async updateUserNewsletters(
    email: string,
    { syncProviderId, newsletters: changes }: UpdateUserNewslettersInput
  ): Promise<UserNewsletterGroup> {
    const config = (await this.mailchimpConfigs()).find(
      ({ id }) => id === syncProviderId
    );

    if (!config) {
      throw new NotFoundException(
        `Newsletter provider ${syncProviderId} not found`
      );
    }

    const newsletters = await this.syncProviderSettings.newsletters(config.id);
    const unknown = changes.filter(
      change => !newsletters.some(n => n.interestId === change.interestId)
    );

    if (unknown.length) {
      throw new BadRequestException(
        `Unknown newsletters: ${unknown.map(n => n.interestId).join(', ')}`
      );
    }

    const listId = config.mailchimp_listId as string;
    const wantsAny = changes.some(change => change.subscribed);

    this.configureMailchimpClient(config);
    const member = await this.getListMember(listId, email);

    // Never add someone to the list just to tell them they want nothing.
    if (!member && !wantsAny) {
      return this.toGroup(config.id, newsletters, null);
    }

    try {
      const updated = (await mailchimp.lists.setListMember(
        listId,
        subscriberHash(email),
        {
          email_address: email.trim(),
          status_if_new: 'pending',
          // Without this, picking a newsletter would not resubscribe them.
          ...(member?.status === 'unsubscribed' &&
            wantsAny && { status: 'pending' }),
          interests: Object.fromEntries(
            changes.map(({ interestId, subscribed }) => [
              interestId,
              subscribed,
            ])
          ),
        } as any
      )) as ListMember;

      return this.toGroup(config.id, newsletters, updated);
    } catch (error) {
      throw mailchimpError(error);
    }
  }

  private async mailchimpConfigs(): Promise<SyncConfig[]> {
    const configs = await this.syncProviderSettings.getEnabledSyncConfigs();

    return configs.filter(
      config =>
        config.type === SyncProviderType.MAILCHIMP && config.mailchimp_listId
    );
  }

  private toGroup(
    syncProviderId: string,
    newsletters: SettingSyncProviderNewsletter[],
    member: ListMember | null
  ): UserNewsletterGroup {
    const isSubscribed =
      !!member && SUBSCRIBED_STATUSES.includes(member.status);

    return {
      syncProviderId,
      newsletters: newsletters.map(
        ({ interestId, name, description, imageID }) => ({
          interestId,
          name,
          description,
          imageID: imageID ?? undefined,
          subscribed: isSubscribed && member.interests?.[interestId] === true,
        })
      ),
    };
  }

  private async getListMember(
    listId: string,
    email: string
  ): Promise<ListMember | null> {
    try {
      return (await mailchimp.lists.getListMember(
        listId,
        subscriberHash(email)
      )) as ListMember;
    } catch (error: any) {
      const status = error?.response?.body?.status ?? error?.status;

      if (status === 404) {
        return null;
      }

      throw mailchimpError(error);
    }
  }

  private configureMailchimpClient(config: SyncConfig): void {
    if (!config.decryptedApiKey) {
      throw new Error('Missing Mailchimp API key');
    }

    const server = config.decryptedApiKey.split('-')[1];
    if (!server) {
      throw new Error('Invalid Mailchimp API key format (expected key-server)');
    }

    mailchimp.setConfig({
      apiKey: config.decryptedApiKey,
      server,
    });
  }
}
