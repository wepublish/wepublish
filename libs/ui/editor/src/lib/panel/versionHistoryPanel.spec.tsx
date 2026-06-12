/**
 * @jest-environment jsdom
 */
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import {
  getRevisionState,
  VersionHistory,
  VersionHistoryRevision,
} from './versionHistoryPanel';

const theme = createTheme();

jest.mock('react-i18next', () => ({
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
  const onRestore = jest.fn();
  const onClose = jest.fn();

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

  it('labels the current draft, pending and published revisions', () => {
    expect(getRevisionState(draft, ids)).toBe('draft');
    expect(getRevisionState(published, ids)).toBe('published');
    expect(getRevisionState({ ...archived, id: 'pending-1' }, ids)).toBe(
      'pending'
    );
  });

  it('labels archived revisions', () => {
    expect(getRevisionState(archived, ids)).toBe('archived');
  });

  it('labels a previously published revision as superseded', () => {
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

    expect(screen.getByText('versionHistory.currentVersion')).toBeTruthy();
    expect(screen.getAllByText('versionHistory.restore')).toHaveLength(2);
  });

  it('asks for confirmation and restores the chosen revision', () => {
    const { onRestore } = renderPanel();

    fireEvent.click(screen.getAllByText('versionHistory.restore')[0]);

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

    fireEvent.click(screen.getAllByText('versionHistory.restore')[0]);
    fireEvent.click(screen.getByText('versionHistory.confirm.cancel'));

    expect(onRestore).not.toHaveBeenCalled();
  });

  it('disables restore buttons while a restore is in flight', () => {
    renderPanel({ restoringId: 'pub-1' });

    screen.getAllByText('versionHistory.restore').forEach(label => {
      const button = label.closest('button');
      expect(button?.disabled).toBe(true);
    });
  });

  it('shows an empty state when there are no revisions', () => {
    renderPanel({ revisions: [] });

    expect(screen.getByText('versionHistory.empty')).toBeTruthy();
  });

  it('hides restore actions entirely when canRestore is false', () => {
    renderPanel({ canRestore: false });

    expect(screen.queryByText('versionHistory.restore')).toBeNull();
  });

  it('does not render preview buttons unless onPreview is provided', () => {
    renderPanel();

    expect(screen.queryByText('versionHistory.preview')).toBeNull();
  });

  it('calls onPreview with the revision id when preview is clicked', () => {
    const onPreview = jest.fn();
    renderPanel({ onPreview });

    const previewButtons = screen.getAllByText('versionHistory.preview');
    expect(previewButtons).toHaveLength(3);

    fireEvent.click(previewButtons[0]);

    expect(onPreview).toHaveBeenCalledTimes(1);
    expect(onPreview).toHaveBeenCalledWith('draft-1');
  });
});
