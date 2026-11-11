import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockAuthor,
  mockPaywall,
  mockPeer,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTag,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullArticleFragment } from '@wepublish/website/api';
import { BuilderArticleProps } from '@wepublish/website/builder';
import { t } from 'i18next';
import { Article } from './article';

const articleWith = (
  overrides: Parameters<typeof mockArticle>[0] = {},
  revision: Parameters<typeof mockArticleRevision>[0] = {}
) =>
  mockArticle({
    latest: mockArticleRevision({
      blocks: [
        mockTitleBlock({ title: 'Article title', lead: 'Article lead' }),
        mockRichTextBlock({
          richText: mockRichTextParagraph('Article text'),
        }),
      ],
      ...revision,
    }),
    ...overrides,
  });

const renderArticle = (
  article: FullArticleFragment | null,
  props: Partial<BuilderArticleProps> = {}
) =>
  renderWithProviders(
    <Article
      data={article ? { __typename: 'Query', article } : undefined}
      loading={false}
      error={undefined}
      showPaywall={false}
      hideContent={false}
      {...props}
    />
  );

describe('Article', () => {
  it('renders the blocks of the latest revision', () => {
    renderArticle(articleWith());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Article title' })
    ).toBeInTheDocument();
    expect(screen.getByText('Article lead')).toBeInTheDocument();
    expect(screen.getByText('Article text')).toBeInTheDocument();
  });

  it('sets the page title from the article', () => {
    renderArticle(
      articleWith({}, { title: 'Article title', seoTitle: 'SEO title' })
    );

    expect(document.querySelector('title')).toHaveTextContent('SEO title');
  });

  it('credits the authors and the publication date', () => {
    renderArticle(
      articleWith(
        { publishedAt: '2023-03-14T10:00:00.000Z' },
        {
          authors: [
            mockArticleRevisionAuthor({
              author: mockAuthor({ name: 'Jane Doe' }),
              role: 'Text',
            }),
          ],
        }
      )
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('14.03.2023')).toHaveAttribute(
      'datetime',
      '2023-03-14T10:00:00.000Z'
    );
  });

  it('leaves out authors that are hidden on articles', () => {
    renderArticle(
      articleWith(
        {},
        {
          authors: [
            mockArticleRevisionAuthor({
              author: mockAuthor({ name: 'Visible Author' }),
            }),
            mockArticleRevisionAuthor({
              author: mockAuthor({
                name: 'Hidden Author',
                hideOnArticle: true,
              }),
            }),
          ],
        }
      )
    );

    expect(screen.getByText('Visible Author')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Author')).not.toBeInTheDocument();
  });

  it('links every tag to its page', () => {
    const tag = mockTag({
      tag: 'Politik',
      url: 'https://example.com/a/tag/politik',
    });

    renderArticle(articleWith({ tags: [tag] }));

    expect(screen.getByRole('link', { name: 'Politik' })).toHaveAttribute(
      'href',
      'https://example.com/a/tag/politik'
    );
  });

  it('links a peered article to the original', () => {
    renderArticle(
      articleWith(
        { peer: mockPeer() },
        { canonicalUrl: 'https://peer.example.com/a/original' }
      )
    );

    expect(
      screen.getByRole('link', { name: t('article.toOriginal') })
    ).toHaveAttribute('href', 'https://peer.example.com/a/original');
  });

  it('does not link to an original for an own article', () => {
    renderArticle(articleWith());

    expect(
      screen.queryByRole('link', { name: t('article.toOriginal') })
    ).not.toBeInTheDocument();
  });

  it('shows the paywall when asked to', () => {
    renderArticle(articleWith({ paywall: mockPaywall() }), {
      showPaywall: true,
      hideContent: true,
    });

    expect(
      screen.getByRole('link', { name: t('paywall.subscribe') })
    ).toBeInTheDocument();
  });

  it('does not show the paywall to readers who may read the article', () => {
    renderArticle(articleWith({ paywall: mockPaywall() }), {
      showPaywall: false,
    });

    expect(
      screen.queryByRole('link', { name: t('paywall.subscribe') })
    ).not.toBeInTheDocument();
  });

  it('renders a tracking pixel for every pixel with an uri', () => {
    renderArticle(
      articleWith({
        trackingPixels: [
          {
            __typename: 'TrackingPixel',
            id: '1',
            uri: 'https://pixel.example.com/1.gif',
          },
          { __typename: 'TrackingPixel', id: '2', uri: null },
        ],
      })
    );

    expect(screen.getAllByAltText('tracking pixel')).toHaveLength(1);
    expect(screen.getByAltText('tracking pixel')).toHaveAttribute(
      'src',
      'https://pixel.example.com/1.gif'
    );
  });

  it('renders what is passed as children after the article', () => {
    renderArticle(articleWith(), { children: <p>Comments</p> });

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });

  it('tells the reader the article is not available when there is none', async () => {
    renderArticle(null, { error: new Error('Not found') });

    expect(
      await screen.findByRole('heading', { level: 1, name: /nicht verfügbar/ })
    ).toBeInTheDocument();
  });

  it('does not claim the article is unavailable while it is loading', () => {
    renderArticle(null, { loading: true });

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });
});
