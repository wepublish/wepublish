import { screen, waitFor } from '@testing-library/react';
import {
  anyVariables,
  mockAnnouncementPrompt,
  mockArticle,
  mockArticleAccess,
  mockArticleRevision,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockRestrictedByRule,
  mockRichTextBlock,
  mockChallengeQuery,
  mockOperation,
  mockPaywall,
  mockPrimaryBannerQuery,
  mockSettingListQuery,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { clearArticleAccess } from '@wepublish/paywall/website';
import {
  ArticleAccessSource,
  ArticleDocument,
  ArticleQueryVariables,
  FullArticleAccessFragment,
  FullArticleFragment,
  FullEngagementPromptFragment,
  ViewArticleDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { ArticleContainer } from './article-container';

const article = mockArticle({
  slug: 'article-slug',
  latest: mockArticleRevision({
    blocks: [mockTitleBlock({ title: 'Article title' })],
  }),
});

const providerMocks = () => [
  mockPrimaryBannerQuery(),
  mockSettingListQuery(),
  mockChallengeQuery(),
];

const articleQuery = (
  variables: ArticleQueryVariables,
  result: FullArticleFragment = article
) =>
  mockOperation(ArticleDocument, {
    variables,
    data: { __typename: 'Query', article: result },
  });

const articleTitle = () =>
  screen.findByRole('heading', { level: 1, name: 'Article title' });

describe('ArticleContainer', () => {
  it('loads the article by id', async () => {
    renderWithProviders(<ArticleContainer id={article.id} />, {
      mocks: [
        articleQuery({ id: article.id }),
        viewArticle(article),
        ...providerMocks(),
      ],
    });

    expect(await articleTitle()).toBeInTheDocument();
  });

  it('loads the article by slug', async () => {
    renderWithProviders(<ArticleContainer slug="article-slug" />, {
      mocks: [
        articleQuery({ slug: 'article-slug' }),
        viewArticle(article),
        ...providerMocks(),
      ],
    });

    expect(await articleTitle()).toBeInTheDocument();
  });

  it('tells the reader the article is not available when loading it fails', async () => {
    renderWithProviders(<ArticleContainer id="missing" />, {
      mocks: [
        mockOperation(ArticleDocument, {
          variables: { id: 'missing' },
          errors: [{ message: 'Article not found' }],
        }),
        ...providerMocks(),
      ],
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: /nicht verfügbar/ })
    ).toBeInTheDocument();
  });

  it('puts a paywall in front of a paywalled article for logged out readers', async () => {
    const paywalled = mockArticle({
      latest: mockArticleRevision({
        blocks: [mockTitleBlock({ title: 'Article title' })],
      }),
      paywall: mockPaywall({ anyMemberPlan: false }),
    });

    renderWithProviders(<ArticleContainer id={paywalled.id} />, {
      mocks: [
        articleQuery({ id: paywalled.id }, paywalled),
        viewArticle(paywalled),
        ...providerMocks(),
      ],
    });

    expect(
      await screen.findByRole('link', { name: t('paywall.subscribe') })
    ).toBeInTheDocument();
  });

  it('renders its children after the article', async () => {
    renderWithProviders(
      <ArticleContainer id={article.id}>
        <p>Comments</p>
      </ArticleContainer>,
      {
        mocks: [
          articleQuery({ id: article.id }),
          viewArticle(article),
          ...providerMocks(),
        ],
      }
    );

    await articleTitle();

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });
});

/** The answer of viewArticle, which the container asks once mounted. */
const viewArticle = (
  { id, latest }: FullArticleFragment,
  {
    access = mockArticleAccess(),
    prompts = [],
  }: {
    access?: FullArticleAccessFragment;
    prompts?: FullEngagementPromptFragment[];
  } = {}
) =>
  mockOperation(ViewArticleDocument, {
    variables: anyVariables,
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: {
      __typename: 'Mutation',
      viewArticle: {
        __typename: 'ArticleView',
        meterToken: 'meter-token',
        access,
        prompts,
        article: {
          __typename: 'Article',
          id,
          latest: {
            __typename: 'ArticleRevision',
            id: latest.id,
            restricted: !access.granted,
            blocks: latest.blocks,
          },
        },
      },
    },
  });

describe('ArticleContainer with engagement and paywalls', () => {
  const preview = mockRichTextBlock();
  const restricted = (overrides: Partial<FullArticleFragment> = {}) =>
    mockArticle({
      ...overrides,
      latest: mockArticleRevision({ blocks: [preview], restricted: true }),
    });

  const renderArticle = (
    data: FullArticleFragment,
    view: Parameters<typeof viewArticle>[1] = {}
  ) =>
    renderWithProviders(<ArticleContainer id={data.id} />, {
      mocks: [
        articleQuery({ id: data.id }, data),
        viewArticle(data, view),
        ...providerMocks(),
      ],
    });

  beforeEach(() => {
    localStorage.clear();
    clearArticleAccess();
  });

  it('shows a soft modal the server answered', async () => {
    renderArticle(article, { prompts: [mockEngagementPrompt()] });

    expect(
      await screen.findByText('Enjoying our journalism?')
    ).toBeInTheDocument();
  });

  it('shows the cutoff of a hard stage after the preview, and no modal', async () => {
    const hardStage = mockHardEngagementPrompt();

    renderArticle(restricted(), {
      access: mockRestrictedByRule(hardStage),
      prompts: [hardStage, mockEngagementPrompt()],
    });

    expect(
      await screen.findByText('Register to keep reading')
    ).toBeInTheDocument();
    expect(
      screen.getByText(t('engagement.action.REGISTER'))
    ).toBeInTheDocument();
    expect(screen.queryByText('Enjoying our journalism?')).toBeNull();
  });

  it('shows the paywall of an enforced paywall the server restricted', async () => {
    const paywall = mockPaywall({ enforced: true });
    const data = restricted({ paywall });

    renderArticle(data, {
      access: mockArticleAccess({
        granted: false,
        source: ArticleAccessSource.Paywall,
        paywallId: paywall.id,
        previewBlocks: 2,
      }),
    });

    expect(await screen.findByText(t('paywall.subscribe'))).toBeInTheDocument();
  });

  it('keeps the paywall away from articles the server granted', async () => {
    renderArticle(article);

    await waitFor(() =>
      expect(localStorage.getItem('engagement-meter')).toBe('meter-token')
    );
    expect(screen.queryByText(t('paywall.subscribe'))).toBeNull();
  });

  it('shows an announcement as banner', async () => {
    renderArticle(article, { prompts: [mockAnnouncementPrompt()] });

    expect(
      await screen.findByText('Our annual crowdfunding')
    ).toBeInTheDocument();
  });
});
