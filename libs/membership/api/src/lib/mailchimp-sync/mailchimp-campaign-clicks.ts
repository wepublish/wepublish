import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import {
  EmailQualityEventSource,
  EmailQualityEventType,
  PrismaClient,
} from '@prisma/client';
import mailchimp from '@mailchimp/mailchimp_marketing';
import {
  EMAIL_QUALITY_RECORDER,
  EmailQualityRecorder,
  MailQualitySignal,
} from '@wepublish/mail/api';
import { describeError } from '@wepublish/utils/api';

/**
 * Clicks keep coming in for days after a campaign went out, so every night
 * looks at the campaigns of the last week and records the clickers it has not
 * seen yet.
 */
export const CAMPAIGN_CLICK_LOOKBACK_DAYS = 7;

const PAGE = 1000;

interface CampaignReport {
  id: string;
  campaign_title?: string;
  list_id?: string;
  send_time?: string;
}

interface ClickedUrl {
  id: string;
  url: string;
}

interface Clicker {
  email_address?: string;
}

export interface CampaignClicksResult {
  /** Campaigns of the audience looked at. */
  campaigns: number;
  /** Clicks recorded tonight, one per person and campaign. */
  recorded: number;
}

/**
 * Newsletter clicks as proof that an address is read. The campaign reports
 * name who clicked but not when, so a click is dated by the campaign's send
 * time; close enough for a window measured in months. Opens are deliberately
 * not read: mail clients and scanners load pixels on their own.
 */
@Injectable()
export class MailchimpCampaignClicksService {
  private logger = new Logger('MailchimpCampaignClicksService');

  constructor(
    private prisma: PrismaClient,
    @Optional()
    @Inject(EMAIL_QUALITY_RECORDER)
    private recorder?: EmailQualityRecorder
  ) {}

  /** Expects the Mailchimp client to be configured for the audience's account. */
  async record(listId: string, since: Date): Promise<CampaignClicksResult> {
    const result: CampaignClicksResult = { campaigns: 0, recorded: 0 };

    if (!this.recorder) {
      return result;
    }

    const campaigns = (await this.listCampaigns(since)).filter(
      campaign => campaign.list_id === listId
    );

    for (const campaign of campaigns) {
      result.campaigns++;

      try {
        result.recorded += await this.recordCampaign(listId, campaign);
      } catch (error) {
        this.logger.error(
          `Could not read the clicks of campaign "${
            campaign.campaign_title ?? campaign.id
          }": ${describeError(error)}`
        );
      }
    }

    this.logger.log(
      `Audience ${listId}: ${result.recorded} new click(s) from ${result.campaigns} campaign(s)`
    );

    return result;
  }

  private async listCampaigns(since: Date): Promise<CampaignReport[]> {
    const campaigns: CampaignReport[] = [];

    for (let offset = 0; ; offset += 100) {
      const response = (await (
        mailchimp as unknown as {
          reports: {
            getAllCampaignReports: (
              options: Record<string, unknown>
            ) => Promise<{ reports?: CampaignReport[] }>;
          };
        }
      ).reports.getAllCampaignReports({
        since_send_time: since.toISOString(),
        count: 100,
        offset,
      })) as { reports?: CampaignReport[] };
      const page = response.reports ?? [];
      campaigns.push(...page);

      if (page.length < 100) {
        return campaigns;
      }
    }
  }

  private async recordCampaign(
    listId: string,
    campaign: CampaignReport
  ): Promise<number> {
    const clickers = await this.clickersOf(campaign);
    const eventIdOf = (email: string) =>
      `mailchimp-campaign:${campaign.id}:${email}`;
    const known = await this.knownEventIds([...clickers].map(eventIdOf));
    const occurredAt =
      campaign.send_time ? new Date(campaign.send_time) : undefined;
    const detail = `mailchimp:${listId}${
      campaign.campaign_title ? `: ${campaign.campaign_title}` : ''
    }`;
    let recorded = 0;

    for (const email of clickers) {
      const providerEventId = eventIdOf(email);

      if (known.has(providerEventId)) {
        continue;
      }

      const signal: MailQualitySignal = {
        type: EmailQualityEventType.clicked,
        email,
        detail,
        occurredAt:
          occurredAt && !Number.isNaN(occurredAt.getTime()) ?
            occurredAt
          : undefined,
        providerEventId,
      };

      try {
        await this.recorder!.recordAddressSignals({
          email,
          signals: [signal],
          source: EmailQualityEventSource.poll,
        });
        recorded++;
      } catch (error) {
        this.logger.error(
          `Could not record the click of ${email}: ${describeError(error)}`
        );
      }
    }

    return recorded;
  }

  /** Everyone who clicked any link of the campaign, lowercased. */
  private async clickersOf(campaign: CampaignReport): Promise<Set<string>> {
    const client = mailchimp as unknown as {
      reports: {
        getCampaignClickDetails: (
          campaignId: string,
          options: Record<string, unknown>
        ) => Promise<{ urls_clicked?: ClickedUrl[] }>;
        getSubscribersInfo: (
          campaignId: string,
          linkId: string,
          options: Record<string, unknown>
        ) => Promise<{ members?: Clicker[] }>;
      };
    };
    const details = await client.reports.getCampaignClickDetails(campaign.id, {
      count: PAGE,
    });
    const clickers = new Set<string>();

    for (const url of details.urls_clicked ?? []) {
      for (let offset = 0; ; offset += PAGE) {
        const page = await client.reports.getSubscribersInfo(
          campaign.id,
          url.id,
          { count: PAGE, offset }
        );
        const members = page.members ?? [];

        for (const member of members) {
          const email = member.email_address?.trim().toLowerCase();

          if (email) {
            clickers.add(email);
          }
        }

        if (!members.length) {
          break;
        }
      }
    }

    return clickers;
  }

  /**
   * Recording an event twice is harmless but re-evaluates the person each
   * time; a week of nights over the same campaign adds up.
   */
  private async knownEventIds(ids: string[]): Promise<Set<string>> {
    const known = new Set<string>();

    for (let i = 0; i < ids.length; i += PAGE) {
      const rows = await this.prisma.emailQualityEvent.findMany({
        where: { providerEventId: { in: ids.slice(i, i + PAGE) } },
        select: { providerEventId: true },
      });

      for (const row of rows) {
        if (row.providerEventId) {
          known.add(row.providerEventId);
        }
      }
    }

    return known;
  }
}
