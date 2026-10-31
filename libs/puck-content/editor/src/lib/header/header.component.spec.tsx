import { createTheme, ThemeProvider } from '@mui/material';
import { Config, createUsePuck, Data, Puck } from '@puckeditor/core';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { ReactNode } from 'react';
import { MdHistory } from 'react-icons/md';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { documentHeaderPlugin } from './header';
import {
  PuckDocumentHeader,
  PuckDocumentHeaderView,
  PuckDocumentHeaderViewProps,
} from './header.component';
import {
  PuckDocumentController,
  PuckDocumentControllerContext,
} from './header.context';

const usePuck = createUsePuck();

const theme = createTheme({ cssVariables: true });

function Location() {
  const { pathname } = useLocation();

  return <output aria-label="Location">{pathname}</output>;
}

function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={['/pages/edit/1']}>
        {children}
        <Location />
      </MemoryRouter>
    </ThemeProvider>
  );
}

const output = (name: string) =>
  screen.getByRole('status', { name }).textContent;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const createController = (
  overrides: Partial<PuckDocumentController> = {}
): PuckDocumentController => ({
  backTo: '/pages',
  backLabel: 'Back to pages',
  status: 'published',
  statusLabel: 'Published on 1 Sep',
  lastSavedAt: new Date('2026-09-02T10:00:00Z'),
  isNew: false,
  hasUnpublishedChanges: false,
  canSave: true,
  canPublish: true,
  onSave: vi.fn(async () => undefined),
  onPublish: vi.fn(async () => undefined),
  ...overrides,
});

const renderView = (props: Partial<PuckDocumentHeaderViewProps> = {}) => {
  const viewProps: PuckDocumentHeaderViewProps = {
    controller: createController(),
    dirty: false,
    saving: false,
    canUndo: false,
    canRedo: false,
    previewMode: 'edit',
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onTogglePreview: vi.fn(),
    onSave: vi.fn(),
    onPublish: vi.fn(),
    ...props,
  };

  render(
    <Providers>
      <PuckDocumentHeaderView {...viewProps} />
    </Providers>
  );

  return viewProps;
};

const dotOf = (button: HTMLElement) =>
  button.closest('.MuiBadge-root')?.querySelector('.MuiBadge-dot');

describe('PuckDocumentHeaderView', () => {
  it('shows the status of the document together with when it was saved', () => {
    renderView();

    const status = screen.getByRole('group', { name: 'Published on 1 Sep' });

    expect(within(status).getByText(/Last saved/)).toBeInTheDocument();
  });

  it('links back to the overview', () => {
    renderView();

    expect(screen.getByRole('link', { name: 'Back to pages' })).toHaveAttribute(
      'href',
      '/pages'
    );
  });

  it('marks Save while there are unsaved changes', () => {
    renderView({ dirty: true });

    const save = screen.getByRole('button', { name: 'Save' });

    expect(save).toHaveAccessibleDescription('Unsaved changes');
    expect(dotOf(save)).not.toHaveClass('MuiBadge-invisible');
  });

  it('leaves Save unmarked once everything is saved', () => {
    renderView({ dirty: false });

    const save = screen.getByRole('button', { name: 'Save' });

    expect(save).not.toHaveAccessibleDescription('Unsaved changes');
    expect(dotOf(save)).toHaveClass('MuiBadge-invisible');
  });

  it.each<[Partial<PuckDocumentController>, boolean]>([
    [{ status: 'draft', hasUnpublishedChanges: false }, true],
    [{ status: 'none', hasUnpublishedChanges: true }, true],
    [{ status: 'published', hasUnpublishedChanges: true }, true],
    [{ status: 'pending', hasUnpublishedChanges: true }, true],
    [{ status: 'published', hasUnpublishedChanges: false }, false],
    [{ status: 'pending', hasUnpublishedChanges: false }, false],
  ])('marks Publish for %o: %s', (state, marked) => {
    renderView({ controller: createController(state) });

    const publish = screen.getByRole('button', { name: 'Publish' });

    if (marked) {
      expect(publish).toHaveAccessibleDescription('Unpublished changes');
      expect(dotOf(publish)).not.toHaveClass('MuiBadge-invisible');
    } else {
      expect(publish).not.toHaveAccessibleDescription('Unpublished changes');
      expect(dotOf(publish)).toHaveClass('MuiBadge-invisible');
    }
  });

  it('cuts the dots out of the header with a ring in its background colour', () => {
    renderView({ dirty: true });

    const dot = dotOf(screen.getByRole('button', { name: 'Save' }));
    const header = screen.getByRole('banner');

    const background = getComputedStyle(header).backgroundColor;

    if (!(dot instanceof HTMLElement)) {
      throw new Error('Save has no dot');
    }

    expect(background).not.toBe('');
    expect(getComputedStyle(dot).boxShadow).toBe(`0 0 0 2px ${background}`);
  });

  it('offers to create a new document instead of saving or publishing it', () => {
    const { onSave } = renderView({
      controller: createController({ isNew: true, status: 'none' }),
    });

    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('hides what the user is not allowed to do', () => {
    renderView({
      controller: createController({ canSave: false, canPublish: false }),
    });

    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Publish' })).toBeNull();
  });

  it('disables saving and publishing while busy', () => {
    renderView({ controller: createController({ busy: true }) });

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  it('asks before leaving with unsaved changes', () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    renderView({ dirty: true });

    fireEvent.click(screen.getByRole('link', { name: 'Back to pages' }));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(output('Location')).toBe('/pages/edit/1');
  });

  it('leaves without asking when everything is saved', () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    renderView({ dirty: false });

    fireEvent.click(screen.getByRole('link', { name: 'Back to pages' }));

    expect(confirm).not.toHaveBeenCalled();
    expect(output('Location')).toBe('/pages');
  });

  it('shows the checklist before publishing', () => {
    const { onPublish } = renderView({
      controller: createController({
        publishDialog: {
          title: 'Publish page',
          dateLabel: 'Publish at',
          checks: [{ label: 'Title', value: 'Home' }],
        },
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    const dialog = screen.getByRole('dialog', { name: 'Publish page' });

    expect(within(dialog).getByText('Title')).toBeInTheDocument();
    expect(onPublish).not.toHaveBeenCalled();

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'publishDialog.publish' })
    );

    expect(onPublish).toHaveBeenCalledWith(expect.any(Date));
  });

  it('publishes right away when there is no checklist', () => {
    const { onPublish } = renderView();

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onPublish).toHaveBeenCalledWith(expect.any(Date));
  });

  it('undoes and redoes as far as the history goes', () => {
    const { onUndo, onRedo } = renderView({ canUndo: true, canRedo: false });

    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('leaves the sidebar toggles to the bottom bar', () => {
    renderView();

    expect(screen.queryByRole('button', { name: 'Left sidebar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Right sidebar' })).toBeNull();
  });

  it('switches between editing and previewing', () => {
    const { onTogglePreview } = renderView({ previewMode: 'edit' });

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    expect(onTogglePreview).toHaveBeenCalledTimes(1);
  });

  it('offers the way back to editing while previewing', () => {
    renderView({ previewMode: 'interactive' });

    expect(screen.getByRole('button', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Preview' })).toBeNull();
  });

  it('offers the actions of the route without a document settings button', () => {
    const onHistory = vi.fn();
    renderView({
      controller: createController({
        menuActions: [
          { label: 'History', icon: <MdHistory />, onClick: onHistory },
        ],
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'History' }));

    expect(onHistory).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole('button', { name: 'Document settings' })
    ).toBeNull();
  });

  it('opens the preview of the saved document in a new tab', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    renderView({
      controller: createController({ previewUrl: 'https://example.com/p' }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open preview' }));

    expect(open).toHaveBeenCalledWith(
      'https://example.com/p',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not preview a document with unsaved changes', () => {
    renderView({
      dirty: true,
      controller: createController({ previewUrl: 'https://example.com/p' }),
    });

    expect(screen.getByRole('button', { name: 'Open preview' })).toBeDisabled();
  });

  it('turns autosave on and off', () => {
    const onToggle = vi.fn();
    renderView({
      controller: createController({
        autosave: { enabled: true, onToggle },
      }),
    });

    const autosave = screen.getByRole('switch', { name: 'Autosave' });

    expect(autosave).toBeChecked();

    fireEvent.click(autosave);

    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('has no autosave for a document that was never saved', () => {
    renderView({
      controller: createController({
        isNew: true,
        autosave: { enabled: true, onToggle: vi.fn() },
      }),
    });

    expect(screen.getByRole('switch', { name: 'Autosave' })).toBeDisabled();
  });
});

const config: Config = {
  components: {
    Title: {
      fields: { text: { type: 'text' } },
      render: ({ text }) => <h1>{text}</h1>,
    },
  },
  root: { fields: { title: { type: 'text' } } },
};

let documents = 0;

const createDocument = (): Data => ({
  root: { props: { title: 'Home' } },
  content: [
    { type: 'Title', props: { id: `Heading-${++documents}`, text: 'Hello' } },
  ],
});

function Workspace() {
  const dispatch = usePuck(puck => puck.dispatch);
  const ui = usePuck(puck => puck.appState.ui);
  const title = usePuck(puck => puck.appState.data.root.props?.title);

  return (
    <>
      <button
        onClick={() =>
          dispatch({ type: 'replaceRoot', root: { props: { title: 'About' } } })
        }
      >
        Rename
      </button>
      <output aria-label="Title">{title}</output>
      <output aria-label="Selection">
        {ui.itemSelector ? 'block' : 'document'}
      </output>
      <output aria-label="Fields">
        {ui.rightSideBarVisible ? 'open' : 'closed'}
      </output>
      <output aria-label="Mode">{ui.previewMode}</output>
    </>
  );
}

const renderEditor = (controller: PuckDocumentController) => {
  render(
    <Providers>
      <PuckDocumentControllerContext.Provider value={controller}>
        <Puck
          config={config}
          data={createDocument()}
          ui={{
            itemSelector: { index: 0, zone: 'root:default-zone' },
            rightSideBarVisible: false,
          }}
        >
          <PuckDocumentHeader />
          <Workspace />
        </Puck>
      </PuckDocumentControllerContext.Provider>
    </Providers>
  );

  fireEvent.pointerDown(document.body);
};

const rename = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Rename' }));

describe('PuckDocumentHeader', () => {
  it('saves the current document and then drops the unsaved mark', async () => {
    const controller = createController();
    renderEditor(controller);

    rename();

    const save = screen.getByRole('button', { name: 'Save' });

    expect(save).toHaveAccessibleDescription('Unsaved changes');

    fireEvent.click(save);

    expect(controller.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ root: { props: { title: 'About' } } })
    );
    await waitFor(() =>
      expect(save).not.toHaveAccessibleDescription('Unsaved changes')
    );
  });

  it('keeps the unsaved mark when saving fails', async () => {
    const controller = createController({
      onSave: vi.fn(async () => {
        throw new Error('offline');
      }),
    });
    renderEditor(controller);

    rename();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    );
    expect(
      screen.getByRole('button', { name: 'Save' })
    ).toHaveAccessibleDescription('Unsaved changes');
  });

  it('saves on Cmd+S', () => {
    const controller = createController();
    renderEditor(controller);

    rename();
    fireEvent.keyDown(window, { key: 's', metaKey: true });

    expect(controller.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ root: { props: { title: 'About' } } })
    );
  });

  it('publishes the current document, which also saves it', async () => {
    const controller = createController();
    renderEditor(controller);

    rename();
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));

    expect(controller.onPublish).toHaveBeenCalledWith(
      expect.objectContaining({ root: { props: { title: 'About' } } }),
      expect.any(Date)
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save' })
      ).not.toHaveAccessibleDescription('Unsaved changes')
    );
  });

  it('switches the canvas into the interactive preview and back', () => {
    renderEditor(createController());

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(output('Mode')).toBe('interactive');

    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    expect(output('Mode')).toBe('edit');
  });

  it('undoes the last edit', async () => {
    renderEditor(createController());

    rename();
    expect(output('Title')).toBe('About');

    const undo = screen.getByRole('button', { name: 'Undo' });

    await waitFor(() => expect(undo).toBeEnabled());
    fireEvent.click(undo);

    expect(output('Title')).toBe('Home');
    expect(
      screen.getByRole('button', { name: 'Save' })
    ).not.toHaveAccessibleDescription('Unsaved changes');
  });
});

describe('documentHeaderPlugin', () => {
  it('replaces the header of Puck', () => {
    render(
      <Providers>
        <PuckDocumentControllerContext.Provider value={createController()}>
          <Puck
            config={config}
            data={createDocument()}
            plugins={[documentHeaderPlugin]}
            iframe={{ enabled: false }}
          />
        </PuckDocumentControllerContext.Provider>
      </Providers>
    );

    expect(
      screen.getByRole('link', { name: 'Back to pages' })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Publish' })).toHaveLength(1);
    expect(screen.queryByRole('heading', { name: 'Home' })).toBeNull();
  });

  it('also saves on Cmd+S while the canvas frame has the focus', () => {
    const controller = createController();
    const frameDocument = document.implementation.createHTMLDocument('frame');
    const Shell = documentHeaderPlugin.overrides?.puck;
    const Frame = documentHeaderPlugin.overrides?.iframe;

    if (!Shell || !Frame) {
      throw new Error('The plugin needs to override the layout and the frame');
    }

    render(
      <Providers>
        <PuckDocumentControllerContext.Provider value={controller}>
          <Puck
            config={config}
            data={createDocument()}
          >
            <Shell>
              <PuckDocumentHeader />
              <Workspace />
              <Frame document={frameDocument}>
                <p>Canvas</p>
              </Frame>
            </Shell>
          </Puck>
        </PuckDocumentControllerContext.Provider>
      </Providers>
    );

    frameDocument.body.dispatchEvent(
      new Event('pointerdown', { bubbles: true })
    );
    rename();

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      cancelable: true,
    });
    frameDocument.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(controller.onSave).toHaveBeenCalledTimes(1);
  });
});
