import { Injectable, Logger } from '@nestjs/common';
import type { InterestCategory, MergeTag } from '@wepublish/newsletter/email';
import { SyncProviderSettingsService } from '@wepublish/settings/api';
import {
  CampaignFields,
  createdCampaign,
  CreatedCampaign,
  createDraftCampaign,
  editUrlFor,
  fetchAudience,
  fetchInterestCategories,
  fetchMergeFields,
  findReusableDraft,
  MailchimpError,
  setCampaignHtml,
  updateDraftCampaign,
} from './mailchimp';

interface MailchimpConfig {
  apiKey: string;
  audienceId: string;
}

export interface MergeFields {
  fields: MergeTag[];
  interests: InterestCategory[];
  error?: string;
}

/**
 * The Mailchimp side of a newsletter. The API key and the audience are those of
 * the Mailchimp integration (Settings → Integrations), the first enabled one
 * that has both.
 */
@Injectable()
export class NewsletterMailchimpService {
  private logger = new Logger(NewsletterMailchimpService.name);

  constructor(private syncSettings: SyncProviderSettingsService) {}

  private async config(): Promise<MailchimpConfig | undefined> {
    const configs = await this.syncSettings.getEnabledSyncConfigs();
    const config = configs.find(
      ({ type, decryptedApiKey, mailchimp_listId }) =>
        type === 'MAILCHIMP' && decryptedApiKey && mailchimp_listId
    );

    return config ?
        {
          apiKey: config.decryptedApiKey as string,
          audienceId: config.mailchimp_listId as string,
        }
      : undefined;
  }

  private async requireConfig(): Promise<MailchimpConfig> {
    const config = await this.config();

    if (!config) {
      throw new MailchimpError(
        'Keine aktive Mailchimp-Integration mit API-Key und Publikum gefunden. Bitte unter Einstellungen → Integrationen einrichten.',
        500
      );
    }

    return config;
  }

  /**
   * Links to a draft in the Mailchimp admin. The datacenter lives in the API
   * key, so the link is built here, where the key is in scope; only the finished
   * URL leaves this service.
   */
  async editUrls(): Promise<((webId: number) => string) | undefined> {
    const config = await this.config();

    return config ? webId => editUrlFor(config.apiKey, webId) : undefined;
  }

  /**
   * One draft per issue, not one per click. The first push creates the draft;
   * later ones patch the remembered draft and re-upload the HTML. A remembered
   * campaign that was deleted, or already sent, is not reused — a new draft is
   * created rather than rewriting the archive of an issue subscribers already
   * received.
   */
  async pushDraft(
    rememberedId: string | null | undefined,
    fields: CampaignFields,
    html: string
  ): Promise<{ campaign: CreatedCampaign; created: boolean }> {
    const { apiKey, audienceId } = await this.requireConfig();
    const existing =
      rememberedId ? await findReusableDraft(apiKey, rememberedId) : null;

    let campaign: CreatedCampaign;

    if (existing) {
      // Settings first, HTML second — a settings patch re-renders the campaign
      // and would discard HTML uploaded before it.
      await updateDraftCampaign(apiKey, existing.id, fields);
      campaign = createdCampaign(
        apiKey,
        existing.id,
        existing.webId,
        fields.title
      );
    } else {
      const audience = await fetchAudience(apiKey, audienceId);
      campaign = await createDraftCampaign(apiKey, audience, fields);
    }

    await setCampaignHtml(apiKey, campaign.id, html);

    return { campaign, created: !existing };
  }

  /**
   * The audience's merge fields and groups, for the prose fields' tag picker and
   * the dynamic-content row.
   *
   * A failure is reported *in* the answer rather than thrown: the picker still
   * has every system tag and only needs to say why the contact fields are
   * absent. Groups are faulted on their own, so a key without the scope for them
   * does not cost the contact fields as well.
   */
  async mergeFields(): Promise<MergeFields> {
    const config = await this.config();

    if (!config) {
      return {
        fields: [],
        interests: [],
        error:
          'Ohne Mailchimp-Integration stehen nur die System-Merge-Tags zur Verfügung.',
      };
    }

    try {
      const [fields, groups] = await Promise.all([
        fetchMergeFields(config.apiKey, config.audienceId),
        fetchInterestCategories(config.apiKey, config.audienceId).then(
          interests => ({ interests, error: undefined as string | undefined }),
          (cause: unknown) => {
            this.logger.error('Failed to load interest categories', cause);

            return {
              interests: [] as InterestCategory[],
              error: 'Die Interessengruppen konnten nicht geladen werden.',
            };
          }
        ),
      ]);

      return { fields, interests: groups.interests, error: groups.error };
    } catch (cause) {
      this.logger.error('Failed to load merge fields', cause);

      return {
        fields: [],
        interests: [],
        error: cause instanceof Error ? cause.message : String(cause),
      };
    }
  }
}
