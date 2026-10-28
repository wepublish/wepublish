import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ArticleMetadataPanel } from './articleMetadataPanel';
import { PageMetadataPanel } from './pageMetadataPanel';
import { JSX, ReactNode } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey, children }: { i18nKey: string; children?: ReactNode }) => (
    <>
      {i18nKey}
      {children}
    </>
  ),
}));

vi.mock('./seoTab', () => ({ SeoTab: () => null }));

vi.mock('./seoPreviews', async importOriginal => ({
  ...(await importOriginal<typeof import('./seoPreviews')>()),
  SocialPreviews: () => <div data-testid="social-previews" />,
}));

const theme = createTheme({ cssVariables: true });

const renderPanel = (panel: JSX.Element) =>
  render(
    <ThemeProvider theme={theme}>
      <MockedProvider>
        <MemoryRouter>{panel}</MemoryRouter>
      </MockedProvider>
    </ThemeProvider>
  );

const pageMetadata = {
  slug: '',
  title: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  tags: [],
  defaultTags: [],
  url: '',
  properties: [],
  socialMediaTitle: '',
  socialMediaDescription: '',
};

const articleMetadata = {
  ...pageMetadata,
  preTitle: '',
  lead: '',
  authors: [],
  canonicalUrl: '',
  shared: false,
  paywall: null,
  hidden: false,
  disableComments: false,
  breaking: false,
  hideAuthor: false,
  socialMediaAuthors: [],
  likes: 0,
  trackingPixels: [],
};

describe.each([
  [
    'PageMetadataPanel',
    (onSave: () => void, onClose: () => void) => (
      <PageMetadataPanel
        value={pageMetadata}
        onSave={onSave}
        onClose={onClose}
      />
    ),
  ],
  [
    'ArticleMetadataPanel',
    (onSave: () => void, onClose: () => void) => (
      <ArticleMetadataPanel
        articleID="article"
        peerId={null}
        value={articleMetadata as never}
        infoData={{ charCount: 0 } as never}
        onSave={onSave}
        onClose={onClose}
      />
    ),
  ],
])('%s', (_, panel) => {
  test('saves without closing', () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    renderPanel(panel(onSave, onClose));

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('links the SEO title and description to their checklist guides', () => {
    renderPanel(panel(vi.fn(), vi.fn()));

    const hrefs = screen
      .getAllByRole('link')
      .map(link => link.getAttribute('href'));

    expect(hrefs).toContain('/settings/seo#seo-titles');
    expect(hrefs).toContain('/settings/seo#meta-descriptions');
  });

  test('shows the social previews in the social media tab', () => {
    renderPanel(panel(vi.fn(), vi.fn()));

    expect(screen.queryByTestId('social-previews')).toBe(null);

    fireEvent.click(screen.getByText('articleEditor.panels.socialMedia'));

    expect(screen.getByTestId('social-previews')).toBeTruthy();
  });
});
