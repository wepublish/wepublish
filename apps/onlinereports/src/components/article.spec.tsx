import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { AdsProvider } from '../context/ads-context';
import { OnlineReportsArticle } from './article';

vi.mock('@wepublish/content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/content/website')>()),
  ContentUnavailable: () => <p>content unavailable</p>,
}));

const theme = createTheme({
  typography: {
    h2: { [createTheme().breakpoints.up('md')]: { fontSize: '36px' } },
  },
});

const renderArticle = (loading: boolean) =>
  render(
    <ThemeProvider theme={theme}>
      <AdsProvider>
        <OnlineReportsArticle
          data={undefined}
          loading={loading}
          showPaywall={false}
          hideContent={false}
        />
      </AdsProvider>
    </ThemeProvider>
  );

describe('OnlineReportsArticle', () => {
  it('tells visitors that an article without a visible version is not available', () => {
    renderArticle(false);

    expect(screen.getByText('content unavailable')).toBeDefined();
  });

  it('does not while the article loads', () => {
    renderArticle(true);

    expect(screen.queryByText('content unavailable')).toBeNull();
  });
});
