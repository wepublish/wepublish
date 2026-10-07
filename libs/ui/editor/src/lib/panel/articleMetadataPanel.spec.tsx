import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing';
import { fireEvent, render, screen } from '@testing-library/react';

import { ArticleMetadata, ArticleMetadataPanel } from './articleMetadataPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const metadata: ArticleMetadata = {
  slug: 'slug',
  preTitle: '',
  title: 'Title',
  lead: '',
  seoTitle: '',
  seoDescription: '',
  authors: [],
  tags: [],
  defaultTags: [],
  url: '',
  properties: [],
  canonicalUrl: '',
  breaking: false,
  hideAuthor: false,
  socialMediaAuthors: [],
  likes: 0,
};

const renderPanel = (isTemplate?: boolean, onCreateTemplate?: () => void) =>
  render(
    <MockedProvider>
      <ArticleMetadataPanel
        articleID={null}
        peerId={null}
        value={metadata}
        infoData={{ charCount: 0 }}
        isTemplate={isTemplate}
        onCreateTemplate={onCreateTemplate}
      />
    </MockedProvider>
  );

describe('ArticleMetadataPanel', () => {
  it('should show article specific metadata for articles', () => {
    renderPanel();

    expect(
      screen.getByLabelText('articleEditor.panels.slug')
    ).toBeInTheDocument();
    expect(
      screen.getByText('articleEditor.panels.likeCount')
    ).toBeInTheDocument();
    expect(
      screen.getByText('articleEditor.panels.tracking')
    ).toBeInTheDocument();
  });

  it('should hide article specific metadata for article templates', () => {
    renderPanel(true);

    expect(
      screen.queryByLabelText('articleEditor.panels.slug')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('articleEditor.panels.likeCount')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('articleEditor.panels.tracking')
    ).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Title')).toBeInTheDocument();
  });

  it('should create a template from the article', () => {
    const onCreateTemplate = vi.fn();
    renderPanel(false, onCreateTemplate);

    fireEvent.click(
      screen.getByRole('button', {
        name: /articleEditor.panels.createTemplate/,
      })
    );

    expect(onCreateTemplate).toHaveBeenCalled();
  });

  it('should not offer to create a template without a handler or for templates', () => {
    renderPanel(true, vi.fn());

    expect(
      screen.queryByRole('button', {
        name: /articleEditor.panels.createTemplate/,
      })
    ).not.toBeInTheDocument();
  });
});
