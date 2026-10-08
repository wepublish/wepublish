import { Prisma, PrismaClient } from '@prisma/client';

const daysAgo = (days: number, hours = 12) => {
  const date = new Date();
  date.setUTCHours(hours, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
};

const midnightDaysAgo = (days: number) => {
  const date = daysAgo(days, 0);
  return date;
};

/**
 * Seeds periodic job logs covering every state (failed, partially failed,
 * running, successful). The most recent execution time is older than the
 * 28h threshold on purpose, so the "job did not run" notification shows too.
 */
export async function seedPeriodicJobLogs(prisma: PrismaClient) {
  const jobs: Prisma.PeriodicJobCreateInput[] = [
    {
      date: midnightDaysAgo(0),
      executionTime: null,
      successfullyFinished: null,
      finishedWithError: null,
      tries: 1,
      error: null,
    },
    {
      date: midnightDaysAgo(1),
      executionTime: daysAgo(1, 4),
      successfullyFinished: null,
      finishedWithError: daysAgo(1, 5),
      tries: 3,
      error:
        'Renewal of 12 subscriptions failed: payment provider timed out after 30s',
    },
    {
      date: midnightDaysAgo(2),
      executionTime: daysAgo(2, 4),
      successfullyFinished: daysAgo(2, 5),
      finishedWithError: daysAgo(2, 4),
      tries: 2,
      error: null,
    },
    {
      date: midnightDaysAgo(3),
      executionTime: daysAgo(3, 4),
      successfullyFinished: daysAgo(3, 5),
      finishedWithError: null,
      tries: 1,
      error: null,
    },
    {
      date: midnightDaysAgo(4),
      executionTime: daysAgo(4, 4),
      successfullyFinished: daysAgo(4, 5),
      finishedWithError: null,
      tries: 1,
      error: null,
    },
  ];

  for (const job of jobs) {
    await prisma.periodicJob.upsert({
      where: { date: job.date as Date },
      update: job,
      create: job,
    });
  }
}

type DemoChangelogEntry = {
  slug: string;
  title: string;
  lead: string;
  description?: string;
  actionRequired?: boolean;
  confirmed?: boolean;
};

const demoChangelogEntries: DemoChangelogEntry[] = [
  {
    slug: 'navigation_drag_and_drop',
    title: 'Reorder navigations by drag & drop',
    lead: 'Navigation entries can now be reordered by simply dragging them.',
  },
  {
    slug: 'new_paywall_designs',
    title: 'Three new paywall designs',
    lead: 'Pick between the classic, compact and full-page paywall in the paywall settings.',
    actionRequired: true,
    description:
      'Head to **Paywalls** and choose one of the new designs. Until you pick one, your readers keep seeing the classic design.\n\n- Classic: as before\n- Compact: slim banner at the end of the article\n- Full page: covers the article after the lead',
  },
  {
    slug: 'image_focus_point',
    title: 'Focus point for images',
    lead: 'Set a focus point on any image so crops always keep the important part visible.',
  },
  {
    slug: 'comment_moderation_queue',
    title: 'Faster comment moderation',
    lead: 'The moderation queue loads twice as fast and shows new comments without reloading.',
  },
  {
    slug: 'newsletter_double_optin',
    title: 'Double opt-in for newsletters',
    lead: 'New newsletter subscribers now confirm their e-mail address before they are added.',
    actionRequired: true,
    confirmed: true,
    description:
      'Check the confirmation mail template under **Mail templates** and adjust the wording to your publication.',
  },
  {
    slug: 'article_scheduling',
    title: 'Schedule articles further ahead',
    lead: 'Articles can now be scheduled up to a year in advance.',
  },
  {
    slug: 'author_profiles',
    title: 'Richer author profiles',
    lead: 'Author pages support a portrait, a biography and links to social media profiles.',
  },
  {
    slug: 'event_recurrence',
    title: 'Recurring events',
    lead: 'Events can repeat weekly or monthly — create them once, publish every occurrence.',
  },
  {
    slug: 'poll_result_embeds',
    title: 'Embed poll results',
    lead: 'Poll results can be embedded in articles and update live while the poll runs.',
  },
  {
    slug: 'tag_merging',
    title: 'Merge duplicate tags',
    lead: 'Duplicate tags can be merged without losing the articles attached to them.',
    actionRequired: true,
    confirmed: true,
    description:
      'Review your tag list under **Tags** and merge obvious duplicates. Nothing breaks if you skip this, but search and tag pages work better without duplicates.',
  },
  {
    slug: 'subscription_pause',
    title: 'Readers can pause subscriptions',
    lead: 'Subscribers can pause their subscription for up to three months in the member area.',
  },
  {
    slug: 'crowdfunding_progress_block',
    title: 'Crowdfunding progress block',
    lead: 'Show the live progress of a crowdfunding campaign anywhere on your site.',
  },
  {
    slug: 'peering_dashboard',
    title: 'Better peering overview',
    lead: 'The network page shows which articles were taken over by other publications.',
  },
  {
    slug: 'mail_log_search',
    title: 'Search the mail log',
    lead: 'Find any mail sent to a reader by address, subject or date in the new mail log search.',
  },
  {
    slug: 'banner_scheduling',
    title: 'Schedule banners',
    lead: 'Banners can be scheduled with a start and end date, for example for campaigns.',
  },
  {
    slug: 'consent_dashboard',
    title: 'Consent overview',
    lead: 'See which consents your readers granted and how they change over time.',
  },
  {
    slug: 'block_style_presets',
    title: 'Block style presets',
    lead: 'Save block styles as presets and reuse them across articles and pages.',
  },
  {
    slug: 'audience_export',
    title: 'Export audience statistics',
    lead: 'Audience numbers can be exported as CSV for the date range you select.',
  },
  {
    slug: 'discount_code_limits',
    title: 'Usage limits for discount codes',
    lead: 'Limit how often a discount code can be redeemed, in total or per reader.',
  },
  {
    slug: 'two_factor_login',
    title: 'Two-factor login for your team',
    lead: 'Protect editor accounts with time-based one-time passwords (TOTP).',
    actionRequired: true,
    description:
      'Ask every team member to enable two-factor authentication in their account settings. You can make it mandatory under **Settings → Security**.',
  },
];

/**
 * Seeds 20 demo changelog entries so lists, pagination and the different
 * severities can be tested. Kept apart from real entries (which are synced
 * from libs/api/changelogs/) by the `_demo_` marker in their unique name.
 */
export async function seedChangelogEntries(prisma: PrismaClient) {
  for (const [index, entry] of demoChangelogEntries.entries()) {
    const releasedAt = daysAgo(30 + index * 9);
    const timestamp = releasedAt
      .toISOString()
      .slice(0, 19)
      .replace(/[-T:]/g, '');
    const name = `${timestamp}_demo_${entry.slug}`;

    const data = {
      releasedAt,
      title: entry.title,
      lead: entry.lead,
      description: entry.description ?? null,
      actionRequired: entry.actionRequired ?? false,
    };

    await prisma.changelogEntry.upsert({
      where: { name },
      update: data,
      create: {
        ...data,
        name,
        confirmedAt: entry.confirmed ? daysAgo(28 + index * 9) : null,
      },
    });
  }
}
