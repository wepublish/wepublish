import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  BuilderContentWrapperProps,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';

import { ReflektArticle } from './reflekt-article';

vi.mock('next/font/local', () => ({
  default: () => ({ className: '', style: { fontFamily: 'serif' } }),
}));

vi.mock('next/font/google', () => ({
  Roboto_Mono: () => ({ className: '', style: { fontFamily: 'monospace' } }),
}));

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
        <ReflektArticle
          data={undefined}
          loading={loading}
          showPaywall={false}
          hideContent={false}
        />
      </WebsiteBuilderProvider>
    </ThemeProvider>
  );

describe('ReflektArticle', () => {
  it('tells visitors that an article without a visible version is not available', () => {
    renderArticle(false);

    expect(screen.getByText('content unavailable')).toBeDefined();
  });

  it('does not while the article loads', () => {
    renderArticle(true);

    expect(screen.queryByText('content unavailable')).toBeNull();
  });
});
