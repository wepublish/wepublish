import { campaigns } from '@mailchimp/mailchimp_marketing';
import { captureException } from '@sentry/react';
import { createServerFn } from '@tanstack/react-start';

export type DailyBriefingOptions = {
  /** How many of the newest sent campaigns to show. */
  count: number;
  /** The mailchimp folder the tenant files its briefings in. */
  folderId: string;
};

type MailchimpLike = {
  setConfig: (config: { apiKey?: string; server?: string }) => void;
  campaigns: { list: (query: Record<string, unknown>) => Promise<unknown> };
};

/**
 * The latest sent campaigns for the `daily-briefing` teaser on the home page.
 *
 * Each tenant's `getStaticProps` ran this and handed the result to
 * `DailyBriefingContext`. The client is a parameter so the query and the
 * failure handling can be tested without reaching mailchimp.
 *
 * Never throws: a briefing list that cannot be fetched is an empty teaser,
 * not a home page that fails to render — which is what the Next pages did.
 */
export const fetchDailyBriefing = async (
  { count, folderId }: DailyBriefingOptions,
  client: MailchimpLike
): Promise<campaigns.Campaigns[]> => {
  try {
    client.setConfig({
      apiKey: process.env.MAILCHIMP_API_KEY,
      server: process.env.MAILCHIMP_SERVER_PREFIX,
    });

    const response = (await client.campaigns.list({
      count,
      folderId,
      sortField: 'send_time',
      sortDir: 'DESC',
      status: 'sent',
      fields: [
        'campaigns.id',
        'campaigns.long_archive_url',
        'campaigns.settings.subject_line',
      ],
    })) as campaigns.CampaignsSuccessResponse | undefined;

    return response?.campaigns ?? [];
  } catch (error) {
    // Logged as well as reported: an empty briefing teaser looks exactly like
    // a tenant that has not published one, so without this a bad key or a
    // changed response shape is invisible in the pod logs. The Next page did
    // the same.
    console.error(
      'daily briefing fetch failed',
      (error as { status?: number })?.status,
      (error as { response?: { body?: unknown } })?.response?.body ??
        (error as Error)?.message
    );
    captureException(error);

    return [];
  }
};

/** Server-side half of the home page's briefing teaser. */
export const loadDailyBriefing = createServerFn({ method: 'GET' })
  .validator((data: DailyBriefingOptions) => data)
  .handler(async ({ data }) => {
    const { default: mailchimp } =
      await import('@mailchimp/mailchimp_marketing');

    return fetchDailyBriefing(data, mailchimp as unknown as MailchimpLike);
  });
