import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  BuilderContentWrapperProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

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
