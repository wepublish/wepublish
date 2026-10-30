import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { ReactNode } from 'react';

import { ArticleMetadata } from './articleMetadataPanel';
import { PageMetadata } from './pageMetadataPanel';
import { PublishArticlePanel } from './publishArticlePanel';
import { PublishPagePanel } from './publishPagePanel';

const theme = createTheme({ cssVariables: true });

vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({
    t: (key: string, opts?: { done?: number; total?: number }) =>
      opts && 'done' in opts ? `${key}:${opts.done}/${opts.total}` : key,
  }),
}));

const wrap = (children: ReactNode) =>
  render(<ThemeProvider theme={theme}>{children}</ThemeProvider>);

const pageMetadata = {
  title: 'Agenda',
  description: '',
  tags: [],
  defaultTags: [],
  url: 'https://example.com/agenda',
  properties: [],
} as PageMetadata;

const articleMetadata = {
  slug: '',
  preTitle: '',
  title: 'Hallo Welt',
  lead: '',
  seoTitle: '',
  seoDescription: '',
  authors: [],
  tags: [],
  defaultTags: [],
  url: 'https://example.com/a/hallo-welt',
  properties: [],
  canonicalUrl: '',
  breaking: true,
  hideAuthor: false,
  socialMediaAuthors: [],
  likes: 0,
} as ArticleMetadata;

const rowOf = (label: string) => screen.getByText(label).closest('li')!;

describe('PublishPagePanel', () => {
  const renderPanel = (publishedAtDate?: Date) => {
    const onConfirm = vi.fn();

    wrap(
      <PublishPagePanel
        publishedAtDate={publishedAtDate}
        metadata={pageMetadata}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    return onConfirm;
  };

  it('ticks off filled fields in the checklist', () => {
    renderPanel();

    const title = rowOf('pageEditor.panels.title');

    expect(
      within(title).getByLabelText('seoChecklist.status.Ok')
    ).toBeInTheDocument();
    expect(within(title).getByText('Agenda')).toBeInTheDocument();
  });

  it('flags missing fields with what to add', () => {
    renderPanel();

    const image = rowOf('pageEditor.panels.image');

    expect(
      within(image).getByLabelText('seoChecklist.status.Warning')
    ).toBeInTheDocument();
    expect(
      within(image).getByText('pageEditor.panels.enterImage')
    ).toBeInTheDocument();
  });

  it('counts progress over the recommended fields only', () => {
    renderPanel();

    expect(screen.getByText('seoChecklist.progress:1/6')).toBeInTheDocument();
  });

  it('links the page url under the title', () => {
    renderPanel();

    expect(
      screen.getByRole('link', { name: 'https://example.com/agenda' })
    ).toHaveAttribute('href', 'https://example.com/agenda');
  });

  it('publishes right away by default', () => {
    const onConfirm = renderPanel();

    fireEvent.click(
      screen.getByRole('button', { name: 'publishDialog.publish' })
    );

    expect(onConfirm).toHaveBeenCalledWith(expect.any(Date));
  });

  it('offers scheduling for a date in the future', () => {
    renderPanel(new Date(Date.now() + 24 * 60 * 60 * 1000));

    expect(
      screen.getByRole('button', { name: 'publishDialog.schedule' })
    ).toBeEnabled();
  });
});

describe('PublishArticlePanel', () => {
  const renderPanel = (metadata: ArticleMetadata = articleMetadata) =>
    wrap(
      <PublishArticlePanel
        metadata={metadata}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

  it('blocks publishing without a slug and says why', () => {
    renderPanel();

    const slug = rowOf('articleEditor.panels.slug');

    expect(
      within(slug).getByLabelText('seoChecklist.status.Error')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'publishDialog.publish' })
    ).toBeDisabled();
  });

  it('lists only the options that are switched on', () => {
    renderPanel();

    expect(
      screen.getByText('articleEditor.panels.breakingNews')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('articleEditor.panels.hideAuthors')
    ).not.toBeInTheDocument();
  });
});
