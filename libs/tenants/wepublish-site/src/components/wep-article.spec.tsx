import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  applyTenantTranslations,
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockAuthor,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import {
  BuilderContentWrapperProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { wepublishSiteTenant } from '../wepublish-site-tenant';
import { WepArticle } from './wep-article';

vi.mock('@wepublish/content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/content/website')>()),
  ContentUnavailable: () => <p>content unavailable</p>,
}));

const ContentWrapper = ({
  className,
  children,
}: BuilderContentWrapperProps) => <div className={className}>{children}</div>;

const renderArticle = (loading: boolean) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <WebsiteBuilderProvider ContentWrapper={ContentWrapper}>
        <WepArticle
          data={undefined}
          loading={loading}
          showPaywall={false}
          hideContent={false}
        />
      </WebsiteBuilderProvider>
    </ThemeProvider>
  );

describe('WepArticle', () => {
  it('tells visitors that an article without a visible version is not available', () => {
    renderArticle(false);

    expect(screen.getByText('content unavailable')).toBeDefined();
  });

  it('does not while the article loads', () => {
    renderArticle(true);

    expect(screen.queryByText('content unavailable')).toBeNull();
  });
});

describe('WepArticle info below the intro', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  const article = (authors: ReturnType<typeof mockArticleRevisionAuthor>[]) =>
    mockArticle({
      publishedAt: new Date(2026, 7, 14, 10).toISOString(),
      latest: mockArticleRevision({ blocks: [], authors }),
    });

  const renderWithArticle = (
    authors: ReturnType<typeof mockArticleRevisionAuthor>[]
  ) =>
    renderWithProviders(
      <WepArticle
        data={{ __typename: 'Query', article: article(authors) }}
        loading={false}
        showPaywall={false}
        hideContent={false}
      />,
      { tenant: wepublishSiteTenant }
    );

  it('links the authors to their page and shows the date', () => {
    renderWithArticle([
      mockArticleRevisionAuthor({
        author: mockAuthor({
          name: 'Ramona Sprenger',
          url: '/author/ramona-sprenger',
        }),
      }),
    ]);

    const byline = screen.getByText(/^von/);

    expect(byline).toHaveTextContent('von Ramona Sprenger, 14.08.2026');
    expect(
      screen.getByRole('link', { name: 'Ramona Sprenger' })
    ).toHaveAttribute('href', '/author/ramona-sprenger');
  });

  it('leaves out authors hidden on articles', () => {
    renderWithArticle([
      mockArticleRevisionAuthor({
        author: mockAuthor({ name: 'Versteckt', hideOnArticle: true }),
      }),
    ]);

    expect(screen.queryByText(/Versteckt/)).not.toBeInTheDocument();
    expect(screen.getByText('14.08.2026')).toBeInTheDocument();
  });

  it('lets the reader share the article', () => {
    renderWithArticle([]);

    expect(screen.getByRole('button', { name: 'Teilen' })).toBeInTheDocument();
  });
});
