import { Injectable, Logger } from '@nestjs/common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export interface ClickTrackingExtensionConfig {
  urlPattern: string;
  pathSegmentIndex: number;
  mergeFieldTag: string;
  lookbackHours: number;
  requireQueryParam?: string | null;
}

interface MailchimpReport {
  id: string;
  campaign_title: string;
  send_time: string;
}

interface MailchimpReportUrl {
  id: string;
  url: string;
}

interface MailchimpReportUrlClick {
  email_address: string;
}

export const CLICK_TRACKING_EXTENSION_TYPE = 'click-tracking';

@Injectable()
export class ClickTrackingExtension {
  private logger = new Logger('ClickTrackingExtension');

  readonly type = CLICK_TRACKING_EXTENSION_TYPE;

  async execute(
    listId: string,
    config: ClickTrackingExtensionConfig
  ): Promise<void> {
    if (!config.mergeFieldTag) {
      this.logger.error(
        `Click tracking: missing mergeFieldTag, skipping extension`
      );
      return;
    }
    if (!config.urlPattern) {
      this.logger.error(
        `Click tracking: missing urlPattern, skipping extension`
      );
      return;
    }

    const lookbackHours = config.lookbackHours ?? 30;
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    const reportsResponse = (await (
      mailchimp as any
    ).reports.getAllCampaignReports({ since_send_time: since })) as {
      reports: MailchimpReport[];
    };

    const reports = reportsResponse.reports ?? [];
    const sortedReports = [...reports].sort(
      (a, b) =>
        new Date(a.send_time).getTime() - new Date(b.send_time).getTime()
    );

    const regex = new RegExp(config.urlPattern);
    const pathIndex = config.pathSegmentIndex ?? 2;
    const requiredParam = config.requireQueryParam ?? 'answerId';

    for (const report of sortedReports) {
      const urlsResponse = (await (
        mailchimp as any
      ).reports.getCampaignClickDetails(report.id, { count: 1000 })) as {
        urls_clicked: MailchimpReportUrl[];
      };

      const urlsClicked = urlsResponse.urls_clicked ?? [];
      const urls = urlsClicked.filter(clicked => regex.test(clicked.url));

      this.logger.log(
        `${report.campaign_title}: Out of ${urlsClicked.length} urls ${urls.length} match pattern`
      );

      for (const url of urls) {
        const parsed = new URL(url.url);
        const id = parsed.pathname.split('/')[pathIndex];
        const queryValue =
          requiredParam ? parsed.searchParams.get(requiredParam) : 'skip';

        if (!id || (requiredParam && !queryValue)) {
          this.logger.log(
            `${report.campaign_title}: skipping URL ${url.url} (missing path segment or required query param)`
          );
          continue;
        }

        const clicks = await this.getClicks(report, url);
        for (const click of clicks) {
          const userObj = {
            merge_fields: {
              [config.mergeFieldTag]: id,
            },
          };
          try {
            await (mailchimp as any).lists.updateListMember(
              listId,
              click.email_address,
              userObj,
              { skip_merge_validation: true }
            );
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            this.logger.warn(
              `click-tracking: Failed to update user ${JSON.stringify(userObj)} (${click.email_address}): ${message}`
            );
          }
        }
        this.logger.log(
          `${report.campaign_title}: Synced ${clicks.length} clicks for id ${id}${requiredParam ? ` with ${requiredParam} ${queryValue}` : ''}`
        );
      }
    }
  }

  private async getClicks(
    report: MailchimpReport,
    url: MailchimpReportUrl
  ): Promise<MailchimpReportUrlClick[]> {
    let clicks: MailchimpReportUrlClick[] = [];
    let lastResponse: MailchimpReportUrlClick[] = [];
    let offset = 0;

    while (lastResponse.length > 0 || offset === 0) {
      const response = (await (mailchimp as any).reports.getSubscribersInfo(
        report.id,
        url.id,
        { count: 1000, offset }
      )) as { members: MailchimpReportUrlClick[] };
      lastResponse = response.members ?? [];
      clicks = clicks.concat(lastResponse);
      offset += 1000;
    }
    return clicks;
  }
}
