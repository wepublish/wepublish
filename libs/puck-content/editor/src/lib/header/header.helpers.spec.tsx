import { Config, createUsePuck, Data, Puck } from '@puckeditor/core';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';

import {
  PUCK_AUTOSAVE_INTERVAL_MS,
  toStateColor,
  usePuckAutosave,
  usePuckDocumentDirty,
  useSaveShortcut,
} from './header.helpers';

const usePuck = createUsePuck();

const config: Config = {
  components: {
    Title: {
      fields: { text: { type: 'text' } },
      resolveData: ({ props }) => ({
        props: { ...props, level: props.level ?? 1 },
      }),
      render: ({ text }) => <h1>{text}</h1>,
    },
  },
  root: { fields: { title: { type: 'text' } } },
};

let documents = 0;

const createDocument = (): Data => ({
  root: { props: { title: 'Home' } },
  content: [
    { type: 'Title', props: { id: `Title-${++documents}`, text: 'Hello' } },
  ],
});

function Probe() {
  const { dirty, markSaved } = usePuckDocumentDirty();
  const dispatch = usePuck(puck => puck.dispatch);
  const current = usePuck(puck => puck.appState.data);
  const history = usePuck(puck => puck.history);

  return (
    <>
      <output aria-label="State">{dirty ? 'dirty' : 'clean'}</output>
      <output aria-label="History">{history.index}</output>
      <output aria-label="Level">
        {String(current.content[0]?.props.level ?? '')}
      </output>

      <button
        onClick={() =>
          dispatch({
            type: 'replace',
            destinationIndex: 0,
            destinationZone: 'root:default-zone',
            data: {
              type: 'Title',
              props: { ...current.content[0].props, text: 'Bye' },
            },
          })
        }
      >
        Edit title
      </button>
      <button
        onClick={() =>
          dispatch({
            type: 'replaceRoot',
            root: { props: { title: 'About' } },
          })
        }
      >
        Rename
      </button>
      <button onClick={() => markSaved(current)}>Mark saved</button>
      <button onClick={() => history.back()}>Undo</button>
    </>
  );
}

const renderProbe = async () => {
  render(
    <Puck
      config={config}
      data={createDocument()}
    >
      <Probe />
    </Puck>
  );

  await waitFor(() =>
    expect(screen.getByRole('status', { name: 'Level' }).textContent).toBe('1')
  );

  fireEvent.pointerDown(document.body);
};

const state = () => screen.getByRole('status', { name: 'State' }).textContent;

describe('usePuckDocumentDirty', () => {
  it('stays clean after Puck normalises the document while loading', async () => {
    await renderProbe();

    expect(state()).toBe('clean');
  });

  it('notices edits to blocks and to the document settings', async () => {
    await renderProbe();

    fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    expect(state()).toBe('dirty');

    fireEvent.click(screen.getByRole('button', { name: 'Mark saved' }));
    expect(state()).toBe('clean');

    fireEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(state()).toBe('dirty');
  });

  it('is clean again when undo returns to the saved document', async () => {
    await renderProbe();

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'History' }).textContent).toBe(
        '1'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit title' }));
    expect(state()).toBe('dirty');

    await waitFor(() =>
      expect(screen.getByRole('status', { name: 'History' }).textContent).toBe(
        '2'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(state()).toBe('clean');
  });
});

describe('usePuckAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves unsaved changes once the interval passed', async () => {
    const onAutosave = vi.fn(async () => undefined);

    renderHook(() =>
      usePuckAutosave({ enabled: true, hasChanged: true, onAutosave })
    );

    await act(() => vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS - 1));
    expect(onAutosave).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(onAutosave).toHaveBeenCalledTimes(1);
  });

  it('does not save a clean or disabled document', async () => {
    const onAutosave = vi.fn(async () => undefined);

    const { rerender } = renderHook(
      ({ enabled, hasChanged }) =>
        usePuckAutosave({ enabled, hasChanged, onAutosave }),
      { initialProps: { enabled: true, hasChanged: false } }
    );

    await act(() => vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS));
    expect(onAutosave).not.toHaveBeenCalled();

    rerender({ enabled: false, hasChanged: true });

    await act(() => vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS * 2));
    expect(onAutosave).not.toHaveBeenCalled();
  });

  it('waits a full interval again after the document was saved', async () => {
    const onAutosave = vi.fn(async () => undefined);

    const { rerender } = renderHook(
      ({ savedAt }: { savedAt?: Date }) =>
        usePuckAutosave({
          enabled: true,
          hasChanged: true,
          onAutosave,
          savedAt,
        }),
      { initialProps: {} }
    );

    await act(() =>
      vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS - 1000)
    );
    rerender({ savedAt: new Date() });

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(onAutosave).not.toHaveBeenCalled();

    await act(() =>
      vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS - 1000)
    );
    expect(onAutosave).toHaveBeenCalledTimes(1);
  });

  it('keeps going after a failed save', async () => {
    const onAutosave = vi.fn(async () => {
      throw new Error('offline');
    });

    renderHook(() =>
      usePuckAutosave({ enabled: true, hasChanged: true, onAutosave })
    );

    await act(() => vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS));
    expect(onAutosave).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(PUCK_AUTOSAVE_INTERVAL_MS));
    expect(onAutosave).toHaveBeenCalledTimes(2);
  });
});

describe('useSaveShortcut', () => {
  it.each([{ metaKey: true }, { ctrlKey: true }])(
    'saves on %o + S instead of saving the web page',
    modifier => {
      const onSave = vi.fn();
      renderHook(() => useSaveShortcut(onSave));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        cancelable: true,
        ...modifier,
      });
      window.dispatchEvent(event);

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(event.defaultPrevented).toBe(true);
    }
  );

  it('ignores S without a modifier', () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));

    fireEvent.keyDown(window, { key: 's' });
    fireEvent.keyDown(window, { key: 'S', shiftKey: true });

    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('toStateColor', () => {
  it('maps every document status onto the state colours of the editor', () => {
    expect(toStateColor('draft')).toBe('var(--wep-state-draft)');
    expect(toStateColor('pending')).toBe('var(--wep-state-pending)');
    expect(toStateColor('published')).toBe('var(--wep-state-published)');
    expect(toStateColor('none')).toBe('var(--wep-state-none)');
  });
});
