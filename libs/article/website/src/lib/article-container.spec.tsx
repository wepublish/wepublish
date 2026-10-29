import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockChallengeQuery,
  mockOperation,
  mockPaywall,
  mockPrimaryBannerQuery,
  mockSettingListQuery,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  ArticleDocument,
  ArticleQueryVariables,
  FullArticleFragment,
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
      mocks: [articleQuery({ id: article.id }), ...providerMocks()],
    });

    expect(await articleTitle()).toBeInTheDocument();
  });

  it('loads the article by slug', async () => {
    renderWithProviders(<ArticleContainer slug="article-slug" />, {
      mocks: [articleQuery({ slug: 'article-slug' }), ...providerMocks()],
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
      { mocks: [articleQuery({ id: article.id }), ...providerMocks()] }
    );

    await articleTitle();

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });
});
