import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { ArticleQuery } from '@wepublish/website/api';

import { EenewsArticle } from './eenews-article';

vi.mock('@wepublish/content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/content/website')>()),
  ContentUnavailable: () => <p>content unavailable</p>,
}));

const renderArticle = (loading: boolean) =>
  render(
    <MockedProvider>
      <ThemeProvider theme={createTheme()}>
        <EenewsArticle
          data={undefined}
          loading={loading}
          showPaywall={false}
          hideContent={false}
        />
      </ThemeProvider>
    </MockedProvider>
  );

describe('EenewsArticle', () => {
  it('tells visitors that an article without a visible version is not available', () => {
    renderArticle(false);

    expect(screen.getByText('content unavailable')).toBeDefined();
  });

  it('shows nothing while the article loads', () => {
    const { container } = renderArticle(true);

    expect(container.innerHTML).toBe('');
  });

  it('renders the ProLitteris tracking pixel so the visit is counted', () => {
    const uri = 'https://pl02.owen.prolitteris.ch/na/plzm.abc';
    const article = {
      __typename: 'Article',
      id: 'article',
      url: 'https://ee-news.ch/a/article',
      publishedAt: new Date('2026-01-01').toISOString(),
      disableComments: true,
      paywall: null,
      tags: [],
      trackingPixels: [{ __typename: 'TrackingPixel', id: 'pixel', uri }],
      latest: {
        __typename: 'ArticleRevision',
        title: 'Title',
        lead: 'Lead',
        preTitle: null,
        breaking: false,
        image: null,
        authors: [],
        properties: [],
        blocks: [],
      },
    } as unknown as ArticleQuery['article'];

    const { container } = render(
      <MockedProvider>
        <SessionTokenContext.Provider value={[null, false, vi.fn()]}>
          <ThemeProvider theme={createTheme()}>
            <EenewsArticle
              data={{ __typename: 'Query', article }}
              loading={false}
              showPaywall={false}
              hideContent={false}
            />
          </ThemeProvider>
        </SessionTokenContext.Provider>
      </MockedProvider>
    );

    expect(container.querySelector(`img[src="${uri}"]`)).not.toBeNull();
  });
});
