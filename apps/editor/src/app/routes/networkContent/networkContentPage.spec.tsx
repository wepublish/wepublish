import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { NetworkContentPage } from './networkContentPage';

const hooks = vi.hoisted(() => ({
  articles: {
    articles: [] as unknown[],
    totalCount: 0,
    loading: false,
    error: undefined,
  },
  clients: {
    clients: [] as unknown[],
    totalCount: 45,
    loading: false,
    error: undefined,
  },
}));

vi.mock('./networkContent.hooks', () => ({
  ARTICLES_PER_PAGE: 20,
  CLIENTS_PER_PAGE: 20,
  usePeerArticles: () => hooks.articles,
  usePeerMatching: () => ({ findPeerMatch: () => null, loading: false }),
  useNetworkClients: () => hooks.clients,
  useAllNetworkClients: () => [],
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderPage = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter>
        <NetworkContentPage />
      </MemoryRouter>
    </ThemeProvider>
  );

describe('NetworkContentPage', () => {
  it('announces when a search finds no articles', () => {
    renderPage();

    expect(
      screen
        .getAllByRole('status')
        .some(region =>
          within(region).queryByText('networkContentDashboard.noArticles')
        )
    ).toBe(true);
  });

  it('uses second-level card headings and distinct pagination labels', () => {
    renderPage();

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'networkContentPage.articlesTitle',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'networkContentPage.mediaTitle',
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('navigation', { name: 'networkContentPage.mediaTitle' })
    ).toBeTruthy();
  });
});
