import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

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
});
