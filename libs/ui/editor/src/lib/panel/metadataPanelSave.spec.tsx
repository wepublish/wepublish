import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ArticleMetadataPanel } from './articleMetadataPanel';
import { PageMetadataPanel } from './pageMetadataPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

vi.mock('./seoTab', () => ({ SeoTab: () => null }));

const renderPanel = (panel: JSX.Element) =>
  render(
    <MockedProvider>
      <MemoryRouter>{panel}</MemoryRouter>
    </MockedProvider>
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
});
