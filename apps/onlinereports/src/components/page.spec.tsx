import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { OnlineReportsPage } from './page';

vi.mock('@wepublish/content/website', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/content/website')>()),
  ContentUnavailable: () => <p>content unavailable</p>,
}));

const theme = createTheme({
  typography: {
    h2: { [createTheme().breakpoints.up('md')]: { fontSize: '36px' } },
  },
});

const renderPage = (loading: boolean) =>
  render(
    <ThemeProvider theme={theme}>
      <OnlineReportsPage
        data={undefined}
        loading={loading}
      />
    </ThemeProvider>
  );

describe('OnlineReportsPage', () => {
  it('tells visitors that a page without a visible version is not available', () => {
    renderPage(false);

    expect(screen.getByText('content unavailable')).toBeDefined();
  });

  it('does not while the page loads', () => {
    renderPage(true);

    expect(screen.queryByText('content unavailable')).toBeNull();
  });
});
