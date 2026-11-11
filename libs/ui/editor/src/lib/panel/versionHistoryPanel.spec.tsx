import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import {
  getAuthorName,
  getRevisionState,
  VersionHistory,
  VersionHistoryRevision,
} from './versionHistoryPanel';

const theme = createTheme({ cssVariables: true });

// Translate to the raw key so assertions stay deterministic and locale-agnostic.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'count' in opts ? `${key}:${opts.count}` : key,
    i18n: { language: 'en' },
  }),
}));

const draft: VersionHistoryRevision = {
  id: 'draft-1',
  createdAt: '2026-06-01T10:00:00.000Z',
  publishedAt: null,
  archivedAt: null,
  title: 'Working draft',
};

const published: VersionHistoryRevision = {
  id: 'pub-1',
  createdAt: '2026-05-20T10:00:00.000Z',
  publishedAt: '2026-05-21T10:00:00.000Z',
  archivedAt: null,
  title: 'Live version',
};

const archived: VersionHistoryRevision = {
  id: 'arch-1',
  createdAt: '2026-05-01T10:00:00.000Z',
  publishedAt: null,
  archivedAt: '2026-05-19T10:00:00.000Z',
  title: 'Old archived version',
};

const renderPanel = (
  props: Partial<Parameters<typeof VersionHistory>[0]> = {}
) => {
  const onRestore = vi.fn();
  const onClose = vi.fn();

  render(
    <ThemeProvider theme={theme}>
      <VersionHistory
        open
        onClose={onClose}
        revisions={[draft, published, archived]}
        draftId="draft-1"
        publishedId="pub-1"
        onRestore={onRestore}
        {...props}
      />
    </ThemeProvider>
  );

  return { onRestore, onClose };
};

describe('getRevisionState', () => {
  const ids = {
    draftId: 'draft-1',
    pendingId: 'pending-1',
    publishedId: 'pub-1',
  };

  it('labels the current draft/pending/published revisions', () => {
    expect(getRevisionState(draft, ids)).toBe('draft');
    expect(getRevisionState(published, ids)).toBe('published');
    expect(getRevisionState({ ...archived, id: 'pending-1' }, ids)).toBe(
      'pending'
    );
  });

  it('labels archived revisions', () => {
    expect(getRevisionState(archived, ids)).toBe('archived');
  });

  it('labels a previously-published (superseded) revision', () => {
    const superseded: VersionHistoryRevision = {
      id: 'old-pub',
      createdAt: '2026-01-01T00:00:00.000Z',
      publishedAt: '2026-01-02T00:00:00.000Z',
      archivedAt: null,
    };

    expect(
      getRevisionState(superseded, ids, new Date('2026-06-01T00:00:00.000Z'))
    ).toBe('superseded');
  });
});

describe('VersionHistory', () => {
  it('renders every revision with its title', () => {
    renderPanel();

    expect(screen.getByText('Working draft')).toBeTruthy();
    expect(screen.getByText('Live version')).toBeTruthy();
    expect(screen.getByText('Old archived version')).toBeTruthy();
    expect(screen.getByText('versionHistory.subtitle:3')).toBeTruthy();
  });

  it('marks the current draft and hides its restore button', () => {
    renderPanel();

    // draft is current -> shown as current version, the other two are restorable
    expect(screen.getByText('versionHistory.currentVersion')).toBeTruthy();
    expect(
      screen.getAllByRole('button', { name: /^versionHistory\.restore\b/ })
    ).toHaveLength(2);
  });

  it('asks for confirmation and restores the chosen revision', () => {
    const { onRestore } = renderPanel();

    // first restorable revision is the published one ('pub-1')
    fireEvent.click(
      screen.getAllByRole('button', { name: /^versionHistory\.restore\b/ })[0]
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('versionHistory.confirm.title')
    ).toBeTruthy();

    fireEvent.click(within(dialog).getByText('versionHistory.confirm.confirm'));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith('pub-1');
  });

  it('can cancel the restore without calling onRestore', () => {
    const { onRestore } = renderPanel();

    fireEvent.click(
      screen.getAllByRole('button', { name: /^versionHistory\.restore\b/ })[0]
    );
    fireEvent.click(screen.getByText('versionHistory.confirm.cancel'));

    expect(onRestore).not.toHaveBeenCalled();
  });

  it('disables restore buttons while a restore is in flight', () => {
    renderPanel({ restoringId: 'pub-1' });

    screen
      .getAllByRole('button', { name: /^versionHistory\.restore\b/ })
      .forEach(button => expect(button).toBeDisabled());
  });

  it('shows an empty state when there are no revisions', () => {
    renderPanel({ revisions: [] });

    expect(screen.getByText('versionHistory.empty')).toBeTruthy();
  });

  it('hides restore actions entirely when canRestore is false', () => {
    renderPanel({ canRestore: false });

    expect(
      screen.queryByRole('button', { name: /^versionHistory\.restore\b/ })
    ).toBeNull();
  });

  it('does not render preview buttons unless onPreview is provided', () => {
    renderPanel();

    expect(
      screen.queryByRole('button', { name: /^versionHistory\.preview\b/ })
    ).toBeNull();
  });

  it('previews every revision except the current version', () => {
    const onPreview = vi.fn();
    renderPanel({ onPreview });

    const previewButtons = screen.getAllByRole('button', {
      name: /^versionHistory\.preview\b/,
    });
    expect(previewButtons).toHaveLength(2);

    fireEvent.click(previewButtons[0]);

    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledWith('pub-1');
  });

  it('puts the actions in the top row of each entry', () => {
    renderPanel({ onPreview: vi.fn() });

    const header = screen
      .getByText('versionHistory.state.published')
      .closest('[data-state]')!.parentElement!;

    expect(
      within(header).getByRole('button', { name: /^versionHistory\.preview\b/ })
    ).toHaveClass('MuiIconButton-root');
    expect(
      within(header).getByRole('button', { name: /^versionHistory\.restore\b/ })
    ).toHaveClass('MuiIconButton-root');
  });

  it('names each revision action after the time of its revision', () => {
    renderPanel({ onPreview: vi.fn() });

    expect(
      screen.getByRole('button', {
        name: /^versionHistory\.preview 20 May 2026, \d\d:\d\d$/,
      })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: /^versionHistory\.restore 01 May 2026, \d\d:\d\d$/,
      })
    ).toBeTruthy();
  });

  it('shows the author who made each change', () => {
    renderPanel({
      revisions: [{ ...published, author: { firstName: 'Jane', name: 'Doe' } }],
      publishedId: 'pub-1',
    });

    expect(screen.getByText('Jane Doe')).toBeTruthy();
  });

  it('falls back to an unknown-author label when no author is set', () => {
    renderPanel({ revisions: [published], publishedId: 'pub-1' });

    expect(screen.getByText('versionHistory.unknownAuthor')).toBeTruthy();
  });

  it('does not render a load more control without more pages', () => {
    renderPanel();

    expect(screen.queryByText('versionHistory.loadMore')).toBeNull();
  });

  it('renders a load more control and triggers onLoadMore', () => {
    const onLoadMore = vi.fn();
    renderPanel({ hasMore: true, totalCount: 10, onLoadMore });

    const loadMore = screen.getByText('versionHistory.loadMore');
    fireEvent.click(loadMore);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    // "showing {count} of {total}" — count is the number of loaded revisions
    expect(screen.getByText('versionHistory.showing:3')).toBeTruthy();
    // header subtitle reflects the total, not the loaded count
    expect(screen.getByText('versionHistory.subtitle:10')).toBeTruthy();
  });
});

describe('VersionHistory layout', () => {
  it('closes from a text button in the drawer header', () => {
    const { onClose } = renderPanel();

    const close = screen.getByRole('button', { name: 'versionHistory.close' });

    expect(close).toHaveClass('MuiButton-text');

    fireEvent.click(close);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('groups revisions under a heading per day', () => {
    renderPanel({
      revisions: [
        { ...draft, createdAt: new Date().toISOString() },
        published,
        archived,
      ],
    });

    expect(
      screen.getByRole('heading', { name: 'versionHistory.today' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /20 May 2026/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /1 May 2026/ })
    ).toBeInTheDocument();
  });

  it('shows states in the same pill as the editor header', () => {
    renderPanel();

    expect(
      screen.getByText('versionHistory.state.draft').closest('[data-state]')
    ).toHaveAttribute('data-state', 'draft');
    expect(
      screen.getByText('versionHistory.state.published').closest('[data-state]')
    ).toHaveAttribute('data-state', 'published');
    expect(
      screen.getByText('versionHistory.state.archived').closest('[data-state]')
    ).toHaveAttribute('data-state', 'none');
  });

  it('shows the publication date without a published prefix', () => {
    renderPanel();

    expect(screen.queryByText(/versionHistory\.published/)).toBeNull();
    expect(screen.getByText(/21 May 2026/)).toBeInTheDocument();
  });

  it('only repeats the title when it changed between revisions', () => {
    renderPanel({
      revisions: [
        { ...draft, title: 'Same title' },
        { ...published, title: 'Same title' },
        archived,
      ],
    });

    expect(screen.getAllByText('Same title')).toHaveLength(1);
    expect(screen.getByText('Old archived version')).toBeInTheDocument();
  });
});

describe('getAuthorName', () => {
  it('combines first name and name', () => {
    expect(getAuthorName({ firstName: 'Jane', name: 'Doe' })).toBe('Jane Doe');
  });

  it('returns null when there is no author', () => {
    expect(getAuthorName(null)).toBeNull();
    expect(getAuthorName({})).toBeNull();
  });
});
