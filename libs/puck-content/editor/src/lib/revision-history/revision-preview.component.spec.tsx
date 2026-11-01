import { createTheme, ThemeProvider } from '@mui/material';
import { Config, createUsePuck, Data, Puck } from '@puckeditor/core';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ReactNode } from 'react';

import { RevisionHistoryPlugin } from './revision-history';
import { RevisionHistory } from './revision-history.component';
import {
  PuckRevisionContent,
  PuckRevisionHistory,
  PuckRevisionHistoryContext,
} from './revision-history.context';
import {
  RevisionPreviewBanner,
  RevisionPreviewFrame,
} from './revision-preview.component';

const snackbar = vi.hoisted(() => vi.fn());

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  enqueueSnackbar: (...args: unknown[]) => snackbar(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}(${Object.keys(opts).sort().join('|')})` : key,
    i18n: { language: 'en' },
  }),
}));

const usePuck = createUsePuck();
const theme = createTheme({ cssVariables: true });

type TextProps = { text: string };

const config: Config<{ Text: TextProps }> = {
  components: {
    Text: {
      fields: { text: { type: 'text' } },
      render: ({ text }) => <p>{text}</p>,
    },
  },
};

const documentWith = (text: string): Data => ({
  root: { props: {} },
  content: [{ type: 'Text', props: { id: 'text-1', text } }],
});

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

function EditorText() {
  const text = usePuck(
    puck => (puck.appState.data.content[0]?.props as TextProps)?.text
  );

  return <output aria-label="Editor text">{text}</output>;
}

function UndoButton() {
  const back = usePuck(puck => puck.history.back);

  return (
    <button
      type="button"
      onClick={back}
    >
      Undo
    </button>
  );
}

const history = (
  overrides: Partial<PuckRevisionHistory> = {}
): PuckRevisionHistory => ({
  revisions: [
    {
      id: 'draft',
      createdAt: '2026-10-29T10:00:00.000Z',
      title: 'Working draft',
    },
    {
      id: 'old',
      createdAt: '2026-10-20T10:00:00.000Z',
      publishedAt: '2026-10-21T10:00:00.000Z',
      title: 'Live version',
      author: { firstName: 'Ada', name: 'Lovelace' },
    },
  ],
  draftId: 'draft',
  publishedId: 'old',
  canRestore: true,
  loadRevision: vi.fn(async () => ({ data: documentWith('Old text') })),
  ...overrides,
});

const renderEditor = (value: PuckRevisionHistory, children?: ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <PuckRevisionHistoryContext.Provider value={value}>
        <Puck
          config={config as Config}
          data={documentWith('Current text')}
          plugins={[RevisionHistoryPlugin]}
          iframe={{ enabled: false }}
        >
          <RevisionHistory />
          <RevisionPreviewBanner />
          <RevisionPreviewFrame document={document}>
            <p>Editable canvas</p>
          </RevisionPreviewFrame>
          <EditorText />
          <UndoButton />
          {children}
        </Puck>
      </PuckRevisionHistoryContext.Provider>
    </ThemeProvider>
  );

const previewButton = () =>
  screen.getByRole('button', { name: 'versionHistory.preview' });

const banner = () =>
  screen.getByRole('region', { name: 'puck.revisionPreview.label' });

const editorText = () =>
  screen.getByRole('status', { name: 'Editor text' }).textContent;

beforeEach(() => {
  snackbar.mockReset();
});

describe('Revision preview', () => {
  it('shows the chosen revision read-only in the canvas', async () => {
    const value = history();
    renderEditor(value);

    expect(
      screen.queryByRole('region', { name: 'puck.revisionPreview.label' })
    ).toBeNull();

    fireEvent.click(previewButton());

    expect(value.loadRevision).toHaveBeenCalledWith('old');
    expect(await screen.findByText('Old text')).toBeInTheDocument();
    expect(screen.queryByText('Editable canvas')).toBeNull();
    expect(
      within(banner()).getByText('puck.revisionPreview.viewing(author|date)')
    ).toBeInTheDocument();
    expect(previewButton()).toHaveAttribute('aria-pressed', 'true');
    expect(editorText()).toBe('Current text');
  });

  it('goes back to the current content without touching it', async () => {
    renderEditor(history());

    fireEvent.click(previewButton());
    await screen.findByText('Old text');

    fireEvent.click(
      within(banner()).getByRole('button', {
        name: 'puck.revisionPreview.back',
      })
    );

    expect(screen.getByText('Editable canvas')).toBeInTheDocument();
    expect(screen.queryByText('Old text')).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'puck.revisionPreview.label' })
    ).toBeNull();
    expect(editorText()).toBe('Current text');
  });

  it('leaves the preview with Escape', async () => {
    renderEditor(history());

    fireEvent.click(previewButton());
    await screen.findByText('Old text');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByText('Editable canvas')).toBeInTheDocument();
  });

  it('restores the previewed revision as undoable editor content', async () => {
    renderEditor(history());

    fireEvent.click(previewButton());
    await screen.findByText('Old text');

    fireEvent.click(
      within(banner()).getByRole('button', {
        name: 'puck.revisionPreview.restore',
      })
    );

    await waitFor(() => expect(editorText()).toBe('Old text'));
    expect(screen.getByText('Editable canvas')).toBeInTheDocument();
    expect(snackbar).toHaveBeenCalledWith(
      'puck.revisionPreview.restoredHint',
      expect.objectContaining({
        variant: 'success',
        title: 'puck.revisionPreview.restored(date)',
      })
    );

    await act(() => new Promise(resolve => setTimeout(resolve, 300)));
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(editorText()).toBe('Current text');
  });

  it('restores from the list without asking for confirmation', async () => {
    const value = history();
    renderEditor(value);

    fireEvent.click(
      screen.getByRole('button', { name: 'versionHistory.restore' })
    );

    await waitFor(() => expect(editorText()).toBe('Old text'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(value.loadRevision).toHaveBeenCalledWith('old');
  });

  it('shows the loading state and keeps restore disabled until loaded', async () => {
    const pending = deferred<PuckRevisionContent>();
    renderEditor(history({ loadRevision: () => pending.promise }));

    fireEvent.click(previewButton());

    expect(
      within(banner()).getByText('puck.revisionPreview.loading')
    ).toBeInTheDocument();
    expect(
      within(banner()).getByRole('button', {
        name: 'puck.revisionPreview.restore',
      })
    ).toBeDisabled();

    await act(async () => pending.resolve({ data: documentWith('Old text') }));

    expect(
      within(banner()).getByRole('button', {
        name: 'puck.revisionPreview.restore',
      })
    ).toBeEnabled();
  });

  it('offers a retry when the revision cannot be loaded', async () => {
    const loadRevision = vi
      .fn<(id: string) => Promise<PuckRevisionContent>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: documentWith('Old text') });
    renderEditor(history({ loadRevision }));

    fireEvent.click(previewButton());

    expect(
      await within(banner()).findByText('puck.revisionPreview.failed')
    ).toBeInTheDocument();
    expect(screen.getByText('Editable canvas')).toBeInTheDocument();

    fireEvent.click(
      within(banner()).getByRole('button', {
        name: 'puck.revisionPreview.retry',
      })
    );

    expect(await screen.findByText('Old text')).toBeInTheDocument();
    expect(loadRevision).toHaveBeenCalledTimes(2);
  });

  it('ignores a slower answer for a revision that is no longer chosen', async () => {
    const slow = deferred<PuckRevisionContent>();
    const loadRevision = vi.fn((id: string) =>
      id === 'old' ?
        slow.promise
      : Promise.resolve({ data: documentWith('Archived text') })
    );
    const value = history({
      revisions: [
        ...history().revisions,
        { id: 'archived', createdAt: '2026-10-10T10:00:00.000Z' },
      ],
      loadRevision,
    });
    renderEditor(value);

    const [oldPreview, archivedPreview] = screen.getAllByRole('button', {
      name: 'versionHistory.preview',
    });
    fireEvent.click(oldPreview);
    fireEvent.click(archivedPreview);

    expect(await screen.findByText('Archived text')).toBeInTheDocument();

    await act(async () => slow.resolve({ data: documentWith('Old text') }));

    expect(screen.getByText('Archived text')).toBeInTheDocument();
    expect(screen.queryByText('Old text')).toBeNull();
  });

  it('cannot preview without a way to load revisions', () => {
    renderEditor(history({ loadRevision: undefined }));

    expect(
      screen.queryByRole('button', { name: 'versionHistory.preview' })
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'versionHistory.restore' })
    ).toBeNull();
  });
});
