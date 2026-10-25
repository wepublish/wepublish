import { MockedProvider } from '@apollo/client/testing/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ArticleMetadataPanel } from './articleMetadataPanel';
import { PageMetadataPanel } from './pageMetadataPanel';
import { JSX } from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
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

  test('shows the social previews in the social media tab', () => {
    renderPanel(panel(vi.fn(), vi.fn()));

    expect(screen.queryByTestId('social-previews')).toBe(null);

    fireEvent.click(screen.getByText('articleEditor.panels.socialMedia'));

    expect(screen.getByTestId('social-previews')).toBeTruthy();
  });

  test('names the tags picker after its label', () => {
    renderPanel(panel(vi.fn(), vi.fn()));

    expect(
      screen.getByRole('combobox', {
        name: /^(articleEditor|pageEditor)\.panels\.tags$/,
      })
    ).toBeTruthy();
  });

  test('labels the tab panel with the selected tab', () => {
    renderPanel(panel(vi.fn(), vi.fn()));

    const tabpanel = screen.getByRole('tabpanel', {
      name: 'articleEditor.panels.general',
    });

    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.getAttribute('aria-controls')).toBe(tabpanel.id);
    }

    fireEvent.click(
      screen.getByRole('tab', { name: 'articleEditor.panels.socialMedia' })
    );

    expect(
      screen.getByRole('tabpanel', {
        name: 'articleEditor.panels.socialMedia',
      })
    ).toBeTruthy();
  });
});

describe('ArticleMetadataPanel tracking tab', () => {
  const renderWithPixels = (trackingPixels: unknown[]) =>
    renderPanel(
      <ArticleMetadataPanel
        articleID="article"
        peerId={null}
        value={{ ...articleMetadata, trackingPixels } as never}
        infoData={{ charCount: 0 } as never}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

  test('names a tracking error in the tab, not only by colour', () => {
    renderWithPixels([{ id: 'p1', uri: null, error: 'failed' }]);

    expect(
      screen.getByRole('tab', {
        name: /^articleEditor\.panels\.tracking\s*, articleEditor\.panels\.hasErrors$/,
      })
    ).toBeTruthy();
  });

  test('keeps the plain name without errors', () => {
    renderWithPixels([{ id: 'p1', uri: 'https://x.ch', error: null }]);

    expect(
      screen.getByRole('tab', { name: 'articleEditor.panels.tracking' })
    ).toBeTruthy();
  });
});
