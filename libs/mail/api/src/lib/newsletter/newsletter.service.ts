import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SyncProviderType } from '@prisma/client';
import { ChallengeService } from '@wepublish/challenge/api';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import {
  NewsletterProvider,
  NewsletterProviderConfig,
  NewsletterProviderError,
} from './newsletter-provider.interface';
import { Newsletter, SubscribeToNewsletterArgs } from './newsletter.model';
import { MailchimpNewsletterProvider } from './providers/mailchimp-newsletter.provider';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private syncProviderSettingsService: SyncProviderSettingsService,
    private challengeService: ChallengeService
  ) {}

  /**
   * Newsletters an anonymous visitor may subscribe to. Returns them in the
   * given order, dropping ids that no longer resolve to an enabled provider.
   * Without ids every enabled provider is returned.
   */
  async getNewsletters(ids?: string[]): Promise<Newsletter[]> {
    const settings =
      await this.syncProviderSettingsService.syncProviderSettingsList({
        enabled: true,
      });

    const available = settings.filter(({ type }) => this.isSupported(type));

    if (!ids?.length) {
      return available.map(({ id, name }) => ({ id, name: name ?? undefined }));
    }

    return ids
      .map(id => available.find(setting => setting.id === id))
      .filter((setting): setting is (typeof available)[number] => !!setting)
      .map(({ id, name }) => ({ id, name: name ?? undefined }));
  }

  async subscribe({
    newsletterId,
    email,
    firstName,
    lastName,
    source,
    challenge,
  }: SubscribeToNewsletterArgs): Promise<boolean> {
    if (!challenge) {
      throw new BadRequestException(
        'A solved challenge is required to subscribe to a newsletter'
      );
    }

    const validation = await this.challengeService.validateChallenge({
      challengeID: challenge.challengeID,
      solution: challenge.challengeSolution,
    });

    if (!validation.valid) {
      throw new BadRequestException(
        `Challenge validation failed with following message: ${validation.message}`
      );
    }

    const configs =
      await this.syncProviderSettingsService.getEnabledSyncConfigs();

    const config = configs.find(({ id }) => id === newsletterId);

    if (!config || !this.isSupported(config.type)) {
      throw new BadRequestException(
        `Newsletter with id ${newsletterId} not found`
      );
    }

    try {
      await this.createProvider(config).subscribe({
        email,
        firstName,
        lastName,
        source,
      });
    } catch (error) {
      if (error instanceof NewsletterProviderError) {
        this.logger.error(
          `Could not subscribe to newsletter ${newsletterId}: ${error.message}`
        );

        throw new BadRequestException(
          'Could not subscribe to the newsletter, please try again later'
        );
      }

      throw error;
    }

    return true;
  }

  private isSupported(type: SyncProviderType): boolean {
    return type === SyncProviderType.MAILCHIMP;
  }

  private createProvider(config: NewsletterProviderConfig): NewsletterProvider {
    switch (config.type) {
      case SyncProviderType.MAILCHIMP:
      default:
        return new MailchimpNewsletterProvider(config);
    }
  }
}
