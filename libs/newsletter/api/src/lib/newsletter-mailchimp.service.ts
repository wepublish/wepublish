import {
  BadGatewayException,
  HttpException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { SyncProviderType } from '@prisma/client';
import type { InterestCategory, MergeTag } from '@wepublish/newsletter';
import { INTEREST_NAME, isSystemMergeTag } from '@wepublish/newsletter';
import { SyncProviderSettingsService } from '@wepublish/settings/api';

/**
 * Mailchimp Marketing API client for draft campaigns. It reuses the Mailchimp
 * sync integration's settings (API key and audience) from the database, so a
 * medium that syncs its members to Mailchimp can publish newsletters into the
 * same account with nothing else configured.
 *
 * Nothing here sends or schedules a campaign; preserve that property.
 */

export class MailchimpCampaignError extends HttpException {}

export interface MailchimpConfig {
  apiKey: string;
  /** The audience pinned in the sync settings; absent means the account's only one. */
  listId?: string;
}

export interface Audience {
  id: string;
  name: string;
  fromName?: string;
  fromEmail?: string;
}

export interface CampaignFields {
  title: string;
  subject: string;
  previewText: string;
}

export interface CreatedCampaign {
  id: string;
  webId: number;
  title: string;
  editUrl: string;
}

function datacenter(apiKey: string): string {
  const dc = apiKey.split('-').pop();

  if (!dc || dc === apiKey) {
    throw new MailchimpCampaignError(
      'The Mailchimp API key is missing its "-usXX" datacenter suffix',
      500
    );
  }

  return dc;
}

export const editUrlFor = (apiKey: string, webId: number): string =>
  `https://${datacenter(apiKey)}.admin.mailchimp.com/campaigns/edit?id=${webId}`;

function settingsFor(fields: CampaignFields): Record<string, unknown> {
  return {
    title: fields.title,
    // Mailchimp rejects a campaign without a subject line.
    subject_line: fields.subject || fields.title,
    preview_text: fields.previewText,
  };
}

@Injectable()
export class NewsletterMailchimpService {
  private readonly logger = new Logger(NewsletterMailchimpService.name);

  constructor(private syncProviderSettings: SyncProviderSettingsService) {}

  /**
   * The enabled Mailchimp integration. With several enabled the choice is
   * refused rather than guessed: the cost of picking wrong is a newsletter
   * pushed into the wrong account.
   */
  async config(): Promise<MailchimpConfig> {
    const configs = (await this.syncProviderSettings.getEnabledSyncConfigs())
      .filter(config => config.type === SyncProviderType.MAILCHIMP)
      .filter(config => config.decryptedApiKey);

    if (configs.length === 0) {
      throw new UnprocessableEntityException(
        'No enabled Mailchimp integration with an API key. Configure one under Settings › Integrations.'
      );
    }

    if (configs.length > 1) {
      throw new UnprocessableEntityException(
        `Several Mailchimp integrations are enabled (${configs
          .map(config => config.name ?? config.id)
          .join(', ')}). Keep exactly one enabled to publish newsletters.`
      );
    }

    const [config] = configs;

    return {
      apiKey: config.decryptedApiKey as string,
      listId: config.mailchimp_listId ?? undefined,
    };
  }

  /** Whether publishing is possible at all, for the editor's hints. */
  async configured(): Promise<boolean> {
    try {
      await this.config();

      return true;
    } catch {
      return false;
    }
  }

  private async call<T>(
    apiKey: string,
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    let response: Response;

    try {
      response = await fetch(
        `https://${datacenter(apiKey)}.api.mailchimp.com/3.0${path}`,
        {
          method,
          headers: {
            authorization: `Basic ${Buffer.from(`key:${apiKey}`).toString('base64')}`,
            'content-type': 'application/json',
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        }
      );
    } catch (error) {
      this.logger.warn(`Mailchimp ${method} ${path} unreachable`, error);

      throw new BadGatewayException('Mailchimp is unreachable');
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();

    if (!response.ok) {
      let detail = text.slice(0, 300);

      try {
        const parsed = JSON.parse(text) as { detail?: string; title?: string };
        detail = parsed.detail ?? parsed.title ?? detail;
      } catch {
        // keep the raw body
      }

      throw new MailchimpCampaignError(
        `Mailchimp ${method} ${path} failed: ${detail}`,
        response.status
      );
    }

    return JSON.parse(text) as T;
  }

  /**
   * The audience and sender come from the Mailchimp list's own
   * `campaign_defaults`, which is where editors set them anyway.
   */
  async fetchAudience({ apiKey, listId }: MailchimpConfig): Promise<Audience> {
    const data = await this.call<{
      lists: {
        id: string;
        name: string;
        campaign_defaults?: { from_name?: string; from_email?: string };
      }[];
    }>(
      apiKey,
      'GET',
      '/lists?count=20&fields=lists.id,lists.name,lists.campaign_defaults,total_items'
    );

    const chosen =
      listId ? data.lists.find(list => list.id === listId)
      : data.lists.length === 1 ? data.lists[0]
      : undefined;

    if (!chosen) {
      if (data.lists.length === 0) {
        throw new MailchimpCampaignError('Mailchimp has no audience.', 422);
      }

      throw new MailchimpCampaignError(
        listId ?
          `Audience ${listId} was not found in Mailchimp.`
        : `Mailchimp has several audiences (${data.lists
            .map(list => list.name)
            .join(', ')}). Pick one in the Mailchimp integration settings.`,
        422
      );
    }

    return {
      id: chosen.id,
      name: chosen.name,
      fromName: chosen.campaign_defaults?.from_name || undefined,
      fromEmail: chosen.campaign_defaults?.from_email || undefined,
    };
  }

  /** The audience's own merge fields; system tags are filtered out. */
  async fetchMergeFields(
    apiKey: string,
    audienceId: string
  ): Promise<MergeTag[]> {
    const data = await this.call<{
      merge_fields: { tag: string; name: string }[];
    }>(
      apiKey,
      'GET',
      `/lists/${audienceId}/merge-fields?count=100&fields=merge_fields.tag,merge_fields.name`
    );

    return data.merge_fields
      .map(field => ({
        tag: `*|${field.tag}|*`,
        label: field.name || field.tag,
        description: field.tag,
      }))
      .filter(field => !isSystemMergeTag(field.tag));
  }

  /**
   * Interest categories (Mailchimp's "groups") and their group names. Names
   * `INTEREST_NAME` refuses are dropped: they cannot be addressed in a tag.
   */
  async fetchInterestCategories(
    apiKey: string,
    audienceId: string
  ): Promise<InterestCategory[]> {
    const data = await this.call<{
      categories: { id: string; title: string }[];
    }>(
      apiKey,
      'GET',
      `/lists/${audienceId}/interest-categories?count=60&fields=categories.id,categories.title`
    );

    const filled = await Promise.all(
      data.categories
        .filter(category => INTEREST_NAME.test(category.title))
        .map(async category => {
          const interests = await this.call<{ interests: { name: string }[] }>(
            apiKey,
            'GET',
            `/lists/${audienceId}/interest-categories/${category.id}/interests?count=200&fields=interests.name`
          );

          return {
            title: category.title,
            groups: interests.interests
              .map(interest => interest.name)
              .filter(name => INTEREST_NAME.test(name)),
          };
        })
    );

    return filled.filter(category => category.groups.length > 0);
  }

  /**
   * Created from scratch and deliberately without a `template_id`, never via
   * `actions/replicate`: a campaign carrying a template renders from it and
   * silently discards uploaded HTML (the PUT returns 200 and the campaign
   * shows Mailchimp boilerplate). Fresh campaigns are `content_type: html`.
   */
  async createDraftCampaign(
    apiKey: string,
    audience: Audience,
    fields: CampaignFields
  ): Promise<CreatedCampaign> {
    const created = await this.call<{ id: string; web_id: number }>(
      apiKey,
      'POST',
      '/campaigns',
      {
        type: 'regular',
        recipients: { list_id: audience.id },
        settings: {
          ...settingsFor(fields),
          ...(audience.fromName ? { from_name: audience.fromName } : {}),
          ...(audience.fromEmail ? { reply_to: audience.fromEmail } : {}),
        },
      }
    );

    return {
      id: created.id,
      webId: created.web_id,
      title: fields.title,
      editUrl: editUrlFor(apiKey, created.web_id),
    };
  }

  async updateDraftCampaign(
    apiKey: string,
    campaignId: string,
    fields: CampaignFields
  ): Promise<void> {
    await this.call(apiKey, 'PATCH', `/campaigns/${campaignId}`, {
      settings: settingsFor(fields),
    });
  }

  /**
   * Always called after any settings patch: patching settings makes Mailchimp
   * re-render the campaign, which throws away HTML uploaded before it.
   */
  async setCampaignHtml(
    apiKey: string,
    campaignId: string,
    html: string
  ): Promise<void> {
    await this.call(apiKey, 'PUT', `/campaigns/${campaignId}/content`, {
      html,
    });
  }

  /**
   * The remembered draft, if it is still there and still editable. A deleted
   * or already sent campaign yields null so the next publish creates a fresh
   * draft rather than rewriting the archive of an issue subscribers received.
   */
  async findReusableDraft(
    apiKey: string,
    campaignId: string
  ): Promise<{ id: string; webId: number } | null> {
    try {
      const campaign = await this.call<{
        id: string;
        web_id: number;
        status: string;
      }>(apiKey, 'GET', `/campaigns/${campaignId}`);

      return campaign.status === 'save' ?
          { id: campaign.id, webId: campaign.web_id }
        : null;
    } catch (error) {
      if (
        error instanceof MailchimpCampaignError &&
        error.getStatus() === 404
      ) {
        return null;
      }

      throw error;
    }
  }
}
