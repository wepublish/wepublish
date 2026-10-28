import { screen } from '@testing-library/react';
import {
  mockPage,
  mockPageRevision,
  mockRichTextBlock,
  mockRichTextParagraph,
  mockTitleBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullPageFragment } from '@wepublish/website/api';
import { BuilderPageProps } from '@wepublish/website/builder';
import { Page } from './page';

const page = mockPage({
  latest: mockPageRevision({
    title: 'Page SEO title',
    blocks: [
      mockTitleBlock({ title: 'Page title', lead: 'Page lead' }),
      mockRichTextBlock({ richText: mockRichTextParagraph('Page text') }),
    ],
  }),
});

const renderPage = (
  data: FullPageFragment | null,
  props: Partial<BuilderPageProps> = {}
) =>
  renderWithProviders(
    <Page
      data={data ? { __typename: 'Query', page: data } : undefined}
      loading={false}
      error={undefined}
      {...props}
    />
  );

const unavailableHeading = () =>
  screen.queryByRole('heading', { level: 1, name: /nicht verfügbar/ });

describe('Page', () => {
  it('renders the blocks of the latest revision', () => {
    renderPage(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page title' })
    ).toBeInTheDocument();
    expect(screen.getByText('Page lead')).toBeInTheDocument();
    expect(screen.getByText('Page text')).toBeInTheDocument();
    expect(unavailableHeading()).not.toBeInTheDocument();
  });

  it('sets the document title from the page', () => {
    renderPage(page);

    expect(document.querySelector('title')).toHaveTextContent('Page SEO title');
  });

  it('tells the reader the page is not available when it could not be loaded', () => {
    renderPage(null, { error: new Error('Page not found') });

    expect(unavailableHeading()).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Page title' })
    ).not.toBeInTheDocument();
  });

  it('shows neither content nor the unavailable notice while loading', () => {
    renderPage(null, { loading: true });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders its children after the page', () => {
    renderPage(page, { children: <p>Comments</p> });

    expect(screen.getByText('Comments')).toBeInTheDocument();
  });
});
