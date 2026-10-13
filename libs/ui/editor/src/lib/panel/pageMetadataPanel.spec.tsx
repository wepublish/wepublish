import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen } from '@testing-library/react';

import { PageMetadata, PageMetadataPanel } from './pageMetadataPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const metadata: PageMetadata = {
  slug: 'slug',
  title: 'Title',
  description: 'Description',
  seoTitle: '',
  seoDescription: '',
  tags: [],
  defaultTags: [],
  url: '',
  properties: [],
  hidden: false,
};

const renderPanel = (isTemplate?: boolean, onCreateTemplate?: () => void) =>
  render(
    <MockedProvider>
      <PageMetadataPanel
        value={metadata}
        isTemplate={isTemplate}
        onCreateTemplate={onCreateTemplate}
      />
    </MockedProvider>
  );

describe('PageMetadataPanel', () => {
  it('should show the slug for pages', () => {
    renderPanel();

    expect(screen.getByDisplayValue('slug')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Description')).toBeInTheDocument();
  });

  it('should hide the slug for page templates', () => {
    renderPanel(true);

    expect(screen.queryByDisplayValue('slug')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Description')).toBeInTheDocument();
  });

  it('should create a template from the page', () => {
    const onCreateTemplate = vi.fn();
    renderPanel(false, onCreateTemplate);

    fireEvent.click(
      screen.getByRole('button', {
        name: /pageEditor.panels.createTemplate/,
      })
    );

    expect(onCreateTemplate).toHaveBeenCalled();
  });

  it('should not offer to create a template without a handler', () => {
    renderPanel(false);

    expect(
      screen.queryByRole('button', {
        name: /pageEditor.panels.createTemplate/,
      })
    ).not.toBeInTheDocument();
  });

  it('should not offer to create a template from a template', () => {
    renderPanel(true, vi.fn());

    expect(
      screen.queryByRole('button', {
        name: /pageEditor.panels.createTemplate/,
      })
    ).not.toBeInTheDocument();
  });
});
