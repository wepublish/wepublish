import { afterEach, describe, expect, it, vi } from 'vitest';

const loadMocks = async () => {
  vi.resetModules();

  return import('../index');
};

const findObjectsWithoutTypename = (value: unknown, path = '$'): string[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findObjectsWithoutTypename(item, `${path}[${index}]`)
    );
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  if ('type' in value && value.type === 'doc') {
    return [];
  }

  const missing = '__typename' in value ? [] : [path];

  return [
    ...missing,
    ...Object.entries(value).flatMap(([key, child]) =>
      findObjectsWithoutTypename(child, `${path}.${key}`)
    ),
  ];
};

describe('website mocks', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('produces the same data on every fresh import, whatever the wall clock says', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });

    vi.setSystemTime(new Date('2020-02-02T00:00:00.000Z'));
    const first = await loadMocks();
    const firstRun = {
      article: first.mockArticle(),
      subscription: first.mockSubscription(),
      invoice: first.mockInvoice(),
      user: first.mockSensitiveDataUser(),
      paymentMethod: first.mockPaymentMethod(),
      poll: first.mockPoll(),
      crowdfunding: first.mockCrowdfunding(),
      peer: first.mockPeer(),
    };

    vi.setSystemTime(new Date('2031-05-05T00:00:00.000Z'));
    const second = await loadMocks();
    const secondRun = {
      article: second.mockArticle(),
      subscription: second.mockSubscription(),
      invoice: second.mockInvoice(),
      user: second.mockSensitiveDataUser(),
      paymentMethod: second.mockPaymentMethod(),
      poll: second.mockPoll(),
      crowdfunding: second.mockCrowdfunding(),
      peer: second.mockPeer(),
    };

    expect(secondRun).toEqual(firstRun);
  }, 30_000);

  it('applies every override, including explicit null', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockArticle({ publishedAt: null }).publishedAt).toBeNull();
    expect(mocks.mockArticle({ paywall: null, slug: 'my-slug' })).toMatchObject(
      { paywall: null, slug: 'my-slug' }
    );
    expect(mocks.mockArticle({ hidden: true }).hidden).toBe(true);
    expect(mocks.mockArticleRevision({ hideAuthor: true }).hideAuthor).toBe(
      true
    );
    expect(mocks.mockPage({ publishedAt: null }).publishedAt).toBeNull();
    expect(mocks.mockAuthor({ name: 'Jane', jobTitle: null })).toMatchObject({
      name: 'Jane',
      jobTitle: null,
    });
    expect(mocks.mockTag({ color: '#f00', tag: null })).toMatchObject({
      color: '#f00',
      tag: null,
    });
    expect(
      mocks.mockEvent({ location: null, endsAt: null, lead: null })
    ).toMatchObject({ location: null, endsAt: null, lead: null });
    expect(mocks.mockImage({ title: 'Title', link: null })).toMatchObject({
      title: 'Title',
      link: null,
    });
    expect(mocks.mockPoll({ question: 'Why?' }).question).toBe('Why?');
    expect(
      mocks.mockPeer({ information: null, hostURL: 'https://peer.example' })
    ).toMatchObject({ information: null, hostURL: 'https://peer.example' });
    expect(
      mocks.mockComment({ parentID: 'parent', rejectionReason: null })
    ).toMatchObject({ parentID: 'parent', rejectionReason: null });
    expect(
      mocks.mockSubscription({ paidUntil: null, deactivation: null })
    ).toMatchObject({ paidUntil: null, deactivation: null });
    expect(mocks.mockInvoice({ total: 5000 }).total).toBe(5000);
    expect(mocks.mockInvoice({ paidAt: null }).paidAt).toBeNull();
    expect(mocks.mockCrowdfunding({ activeGoal: null }).activeGoal).toBeNull();
    expect(mocks.mockTitleBlock({ blockStyle: 'Banner' }).blockStyle).toBe(
      'Banner'
    );
    expect(mocks.mockBreakBlock({ blockStyle: 'ContextBox' }).blockStyle).toBe(
      'ContextBox'
    );
    expect(mocks.mockImageBlock({ caption: null }).caption).toBeNull();
    expect(
      mocks.mockSensitiveDataUser({ pendingEmail: 'new@example.com' })
        .pendingEmail
    ).toBe('new@example.com');
  });

  it('treats undefined as "use the default"', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockArticleTeaser({ title: undefined }).title).toBe(
      'This is a title'
    );
    expect(mocks.mockAuthor({ jobTitle: undefined }).jobTitle).toBe('Editor');
  });

  it('keeps the string key signature of mockImage', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockImage('1').url).toContain('key=1');
    expect(mocks.mockPeerImage('2').xl).toContain('key=2');
  });

  it('links related records to each other', async () => {
    const mocks = await loadMocks();

    const poll = mocks.mockPoll();
    expect(poll.answers.map(answer => answer.pollId)).toEqual(
      poll.answers.map(() => poll.id)
    );

    const comment = mocks.mockComment();
    expect(comment.userRatings[0].answer.id).toBe(
      comment.calculatedRatings[0].answer.id
    );
    expect(comment.overriddenRatings[0].answerId).toBe(
      comment.calculatedRatings[0].answer.id
    );

    const subscription = mocks.mockSubscription();
    const invoice = mocks.mockInvoice({ subscription });
    expect(invoice.subscriptionID).toBe(subscription.id);
    expect(subscription).toMatchObject({
      pendingPaymentMethodChange: null,
      canRenewPaymentMethod: false,
    });
  });

  it('builds paginated results with cursors and a matching totalCount', async () => {
    const mocks = await loadMocks();
    const nodes = [
      mocks.mockArticle({ id: 'a' }),
      mocks.mockArticle({ id: 'b' }),
    ];

    expect(mocks.mockPaginated('PaginatedArticles', nodes)).toEqual({
      __typename: 'PaginatedArticles',
      nodes,
      totalCount: 2,
      pageInfo: {
        __typename: 'PageInfo',
        startCursor: 'a',
        endCursor: 'b',
        hasNextPage: false,
        hasPreviousPage: false,
      },
    });
  });

  it('puts a __typename on every nested object', async () => {
    const mocks = await loadMocks();

    const fixtures = {
      blockContent: mocks.mockBlockContent(),
      article: mocks.mockArticle(),
      page: mocks.mockPage(),
      comment: mocks.mockComment(),
      ratingSystem: mocks.mockCommentRatingSystem(),
      subscription: mocks.mockSubscription(),
      subscriptionWithPendingChange: mocks.mockSubscription({
        pendingPaymentMethodChange:
          mocks.mockSubscriptionPaymentMethodChange(),
      }),
      invoice: mocks.mockInvoice(),
      sensitiveUser: mocks.mockSensitiveDataUser(),
      user: mocks.mockUser(),
      peer: mocks.mockPeer(),
      peerProfile: mocks.mockPeerProfile(),
      navigations: mocks.mockNavigations(),
      banner: mocks.mockBanner(),
      paywall: mocks.mockPaywall(),
      challenge: mocks.mockChallenge(),
      setting: mocks.mockSetting(),
      session: mocks.mockSession(),
      sessionWithoutUser: mocks.mockSessionWithoutUser(),
      subscribeBlock: mocks.mockSubscribeBlock(),
      mailchimp: mocks.mockInterestsMailchimpFormBlock(),
      flexBlock: mocks.mockFlexBlock(),
      blockTemplate: mocks.mockBlockTemplateBlock(),
      crowdfundingBlock: mocks.mockCrowdfundingBlock(),
      teaserSlots: mocks.mockTeaserSlotsBlock(),
      teaserGridFlex: mocks.mockTeaserGridFlexBlock(),
    };

    expect(findObjectsWithoutTypename(fixtures)).toEqual(['$']);
  });

  it('returns the website user without sensitive fields', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockUser()).not.toHaveProperty('email');
    expect(mocks.mockUser().__typename).toBe('User');
    expect(mocks.mockSensitiveDataUser().__typename).toBe('SensitiveDataUser');
  });

  it('returns the session types the login and the registration answer with', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockSession().__typename).toBe('SessionWithToken');
    expect(mocks.mockSessionWithoutUser().__typename).toBe(
      'SessionWithTokenWithoutUser'
    );
    expect(mocks.mockSession({ token: 'abc' }).token).toBe('abc');
  });

  it('uses the right type values on teasers and blocks', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockCustomTeaser().type).toBe('Custom');
    expect(mocks.mockTeaserGridBlock().type).toBe('TeaserGrid');
    expect(mocks.mockIFrameBlock().url).toBe('https://www.example.com');
    expect(mocks.mockBreakBlock().linkTarget).toBe('_blank');
  });
});

describe('embed and mailchimp mocks', () => {
  it('builds a tweet whose text range covers the whole text', async () => {
    const mocks = await loadMocks();
    const tweet = mocks.mockTweet({ text: 'Hello' });

    expect(tweet.display_text_range).toEqual([0, 5]);
    expect(tweet.user.screen_name).toBe('WePublish_media');
    expect(mocks.mockTweet({ id_str: '1' }).id_str).toBe('1');
  });

  it('builds mailchimp success pages and subscribe results', async () => {
    const mocks = await loadMocks();

    expect(
      findObjectsWithoutTypename({
        successPage: mocks.mockMailchimpFormSuccessPage(),
        result: mocks.mockMailchimpSubscribeResult(),
      })
    ).toEqual(['$']);
    expect(
      mocks.mockMailchimpSubscribeResult({ success: false, error: 'Nope' })
    ).toMatchObject({ success: false, error: 'Nope' });
    expect(
      mocks.mockMailchimpFormSuccessPage({ description: null }).description
    ).toBeNull();
  });
});

describe('subscription info mocks', () => {
  it('builds subscribe and upgrade infos without a discount by default', async () => {
    const mocks = await loadMocks();

    expect(mocks.mockCreateSubscriptionInfo()).toEqual({
      __typename: 'CreateSubscriptionInfo',
      discountCodeValid: null,
      discountPercent: null,
    });
    expect(mocks.mockUpgradeSubscriptionInfo()).toEqual({
      __typename: 'UpgradeSubscription',
      discountAmount: 0,
      discountCodeValid: null,
      discountPercent: null,
    });
    expect(
      mocks.mockUpgradeSubscriptionInfo({
        discountAmount: 500,
        discountPercent: 0.2,
        discountCodeValid: true,
      })
    ).toMatchObject({
      discountAmount: 500,
      discountPercent: 0.2,
      discountCodeValid: true,
    });
  });
});

describe('richtext and editor settings mocks', () => {
  it('builds a richtext document with every node the website renders', async () => {
    const mocks = await loadMocks();
    const types = new Set<string>();
    const collect = (node: { type?: string; content?: unknown[] }) => {
      if (node.type) {
        types.add(node.type);
      }

      node.content?.forEach(child =>
        collect(child as { type?: string; content?: unknown[] })
      );
    };

    collect(mocks.mockRichTextAllNodes());

    expect([...types].sort()).toEqual([
      'blockquote',
      'bulletList',
      'codeBlock',
      'doc',
      'hardBreak',
      'heading',
      'image',
      'listItem',
      'orderedList',
      'paragraph',
      'table',
      'tableCell',
      'tableHeader',
      'tableRow',
      'text',
    ]);
  });

  it('builds editor website settings with a full theme palette', async () => {
    const mocks = await loadMocks();
    const settings = mocks.mockWebsiteSettings();

    expect(findObjectsWithoutTypename(settings.analytics)).toEqual([]);
    expect(settings.theme).toMatchObject({
      palette: {
        primary: { main: expect.any(String) },
        text: { primary: expect.any(String) },
        background: { default: expect.any(String) },
      },
    });
  });
});
