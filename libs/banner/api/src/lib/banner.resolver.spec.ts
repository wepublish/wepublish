import {
  EngagementActionRole,
  EngagementActionType,
  EngagementAudience,
  EngagementEnforcement,
  EngagementGoal,
  EngagementPlacement,
  NewsletterReferralMode,
} from '@prisma/client';
import {
  EngagementRuleWithStages,
  EngagementStageWithActions,
} from '@wepublish/engagement/api';
import { BannerResolver } from './banner.resolver';
import {
  BannerDocumentType,
  LoginStatus,
  PrimaryBannerArgs,
} from './banner.model';
import { toBanner } from './to-banner';

const stage = (
  overrides: Partial<EngagementStageWithActions> = {}
): EngagementStageWithActions => ({
  id: 'stage-1',
  ruleId: 'rule-1',
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
  afterArticles: 0,
  placement: EngagementPlacement.BANNER,
  enforcement: EngagementEnforcement.SOFT,
  requirement: null,
  previewBlocks: null,
  dismissible: true,
  hideForMinutes: 1440,
  delaySeconds: 5,
  title: 'Test Banner',
  text: 'Test Banner Text',
  cta: 'Read on',
  description: null,
  html: null,
  embedUrl: null,
  imageId: 'image-1',
  actions: [
    {
      id: 'action-1',
      stageId: 'stage-1',
      createdAt: new Date('2023-01-01'),
      modifiedAt: new Date('2023-01-01'),
      type: EngagementActionType.URL,
      label: 'Subscribe',
      url: 'https://example.com',
      style: 'primary',
      role: EngagementActionRole.PRIMARY,
    },
    {
      id: 'action-2',
      stageId: 'stage-1',
      createdAt: new Date('2023-01-01'),
      modifiedAt: new Date('2023-01-01'),
      type: EngagementActionType.LOGIN,
      label: 'Login',
      url: '',
      style: '',
      role: EngagementActionRole.OTHER,
    },
  ],
  ...overrides,
});

const announcement = (
  id: string,
  overrides: Partial<EngagementRuleWithStages> = {}
): EngagementRuleWithStages => ({
  id,
  createdAt: new Date('2023-01-01'),
  modifiedAt: new Date('2023-01-01'),
  name: id,
  goal: EngagementGoal.ANNOUNCEMENT,
  active: true,
  priority: 0,
  version: 1,
  audience: EngagementAudience.ALL,
  showOnArticles: true,
  showOnPageIds: ['page-1'],
  includePeeredArticles: true,
  meterWindowDays: null,
  newsletterReferral: NewsletterReferralMode.NONE,
  newsletterReferralLimit: 0,
  newsletterParams: [],
  stages: [stage()],
  ...overrides,
});

// The banners the audience engagement migration made, with its priorities.
const migrated = {
  all: announcement('all', { audience: EngagementAudience.ALL, priority: 0 }),
  loggedIn: announcement('logged-in', {
    audience: EngagementAudience.REGISTERED,
    priority: 1,
  }),
  unsubscribed: announcement('unsubscribed', {
    audience: EngagementAudience.NON_MEMBERS,
    priority: 2,
  }),
  loggedOut: announcement('logged-out', {
    audience: EngagementAudience.ANONYMOUS,
    priority: 3,
  }),
  subscribed: announcement('subscribed', {
    audience: EngagementAudience.MEMBERS,
    priority: 3,
  }),
  bypassed: announcement('bypassed', {
    audience: EngagementAudience.PAYWALL_BYPASSED,
    priority: 4,
  }),
};

const args = (
  overrides: Partial<PrimaryBannerArgs> = {}
): PrimaryBannerArgs => ({
  documentType: BannerDocumentType.ARTICLE,
  documentId: 'article-1',
  loggedIn: false,
  hasSubscription: false,
  hasPaywallBypass: false,
  ...overrides,
});

describe('BannerResolver', () => {
  let rules: EngagementRuleWithStages[];
  const images = { load: vi.fn().mockResolvedValue({ id: 'image-1' }) };
  const resolver = () =>
    new BannerResolver(
      { getActiveRules: async () => rules } as never,
      images as never
    );

  beforeEach(() => {
    rules = [];
  });

  it('maps an announcement onto the banner type older websites select', async () => {
    rules = [announcement('rule-1')];

    expect(await resolver().primaryBanner(args())).toMatchSnapshot();
  });

  it('answers no banner without a matching announcement', async () => {
    rules = [
      announcement('inactive', { active: false }),
      announcement('pages only', { showOnArticles: false }),
      announcement('metered', {
        goal: EngagementGoal.NEWSLETTER,
        meterWindowDays: 30,
      }),
    ];

    expect(await resolver().primaryBanner(args())).toBeNull();
  });

  it('answers the banners of a page', async () => {
    rules = [
      announcement('elsewhere', { showOnPageIds: ['page-2'] }),
      announcement('here'),
    ];

    expect(
      await resolver().primaryBanner(
        args({ documentType: BannerDocumentType.PAGE, documentId: 'page-1' })
      )
    ).toMatchObject({ id: 'here', showOnPages: [{ id: 'page-1' }] });
  });

  describe('Scenarios C and E: the audience that fits the reader best wins, as before', () => {
    it.each([
      ['an anonymous reader', args(), Object.values(migrated), 'logged-out'],
      [
        'an anonymous reader without a logged out banner',
        args(),
        [migrated.all, migrated.unsubscribed, migrated.loggedIn],
        'unsubscribed',
      ],
      [
        'a logged-in reader without a subscription',
        args({ loggedIn: true }),
        Object.values(migrated),
        'unsubscribed',
      ],
      [
        'a logged-in reader without a subscription, without an unsubscribed banner',
        args({ loggedIn: true }),
        [migrated.all, migrated.loggedIn, migrated.loggedOut],
        'logged-in',
      ],
      [
        'a subscriber',
        args({ loggedIn: true, hasSubscription: true }),
        Object.values(migrated),
        'subscribed',
      ],
      [
        'a subscriber without a subscribed banner',
        args({ loggedIn: true, hasSubscription: true }),
        [migrated.all, migrated.loggedIn, migrated.unsubscribed],
        'logged-in',
      ],
      [
        'a reader with a paywall bypass',
        args({ hasPaywallBypass: true }),
        Object.values(migrated),
        'bypassed',
      ],
      ['anyone else', args(), [migrated.all, migrated.subscribed], 'all'],
    ])('picks the banner for %s', async (_, reader, available, expected) => {
      rules = available;

      expect((await resolver().primaryBanner(reader))?.id).toBe(expected);
    });

    it('prefers a higher priority among banners for the same audience', async () => {
      rules = [
        announcement('a', { priority: 0 }),
        announcement('b', { priority: 5 }),
      ];

      expect((await resolver().primaryBanner(args()))?.id).toBe('b');
    });
  });

  it('resolves the image', async () => {
    rules = [announcement('rule-1')];
    const banner = await resolver().primaryBanner(args());

    expect(await resolver().image(banner!)).toEqual({ id: 'image-1' });
    expect(images.load).toHaveBeenCalledWith('image-1');
  });
});

describe('toBanner', () => {
  it('shows a rule for specific plans to subscribers on older websites', () => {
    const rule = announcement('plans', {
      audience: EngagementAudience.MEMBER_PLANS,
    });

    expect(toBanner(rule, rule.stages[0]).showForLoginStatus).toBe(
      LoginStatus.SUBSCRIBED
    );
  });
});
