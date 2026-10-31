import { createTheme, ThemeProvider } from '@mui/material';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import i18next from 'i18next';
import { ReactNode, useState } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import {
  RecordFieldRender,
  RecordMultiSelect,
  RecordSelect,
} from './record-select.component';
import { matchesRecordQuery, RecordOption } from './record.field';
import {
  RecordSearchOptions,
  RecordSource,
  recordSources,
  RecordSourcesContext,
} from './record.sources';

const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {},
  initImmediate: false,
  interpolation: { escapeValue: false },
});

const records: RecordOption[] = [
  {
    id: 'a1',
    title: 'Climate report',
    subtitle: 'Anna',
    imageUrl: 'https://cdn.test/a1.jpg',
    status: 'published',
  },
  { id: 'a2', title: 'Budget vote', status: 'draft' },
  { id: 'a3', title: 'Interview', status: 'pending' },
];

const createSource = ({ hasMore = false } = {}) => {
  const loadMore = vi.fn();
  const useSearch = vi.fn(
    (query: string, { skip = false }: RecordSearchOptions = {}) => ({
      options:
        skip ?
          []
        : records.filter(record => matchesRecordQuery(record.title, query)),
      loading: false,
      hasMore,
      loadMore,
    })
  );
  const useRecords = vi.fn((ids: string[]) => ({
    records: Object.fromEntries(
      records
        .filter(record => ids.includes(record.id))
        .map(record => [record.id, record])
    ),
    loading: false,
  }));

  return {
    source: { model: 'article', useSearch, useRecords } satisfies RecordSource,
    useSearch,
    loadMore,
  };
};

const renderWithSource = (ui: ReactNode, source: RecordSource) =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <RecordSourcesContext.Provider
          value={{ ...recordSources, article: source }}
        >
          {ui}
        </RecordSourcesContext.Provider>
      </ThemeProvider>
    </I18nextProvider>
  );

const SingleHarness = ({
  initial,
  onChange,
}: {
  initial?: string;
  onChange: (id: string | undefined) => void;
}) => {
  const [value, setValue] = useState(initial);

  return (
    <RecordSelect
      model="article"
      label="Article"
      value={value}
      onChange={next => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const MultiHarness = ({
  initial,
  onChange,
  min,
  max,
}: {
  initial: string[];
  onChange: (ids: string[]) => void;
  min?: number;
  max?: number;
}) => {
  const [value, setValue] = useState(initial);

  return (
    <RecordMultiSelect
      model="article"
      label="Articles"
      value={value}
      min={min}
      max={max}
      onChange={next => {
        setValue(next);
        onChange(next);
      }}
    />
  );
};

const listedTitles = () =>
  within(screen.getByRole('list', { name: 'Articles' }))
    .getAllByRole('listitem')
    .map(item => item.textContent);

describe('RecordSelect', () => {
  it('searches as you type, debounced, and picks a record', async () => {
    const onChange = vi.fn();
    const { source, useSearch } = createSource();

    renderWithSource(<SingleHarness onChange={onChange} />, source);

    const input = screen.getByRole('combobox', { name: 'Article' });

    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: 'c' } });
    fireEvent.change(input, { target: { value: 'cl' } });
    fireEvent.change(input, { target: { value: 'clim' } });

    fireEvent.click(
      await screen.findByRole('option', { name: /Climate report/ })
    );

    expect(onChange).toHaveBeenCalledWith('a1');
    expect(useSearch.mock.calls.map(([query]) => query)).not.toContain('cl');
    expect(screen.getByText('Climate report')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Remove Climate report' })
    ).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Replace Climate report' })
      )
    );
  });

  it('only searches while the list is open', () => {
    const { source, useSearch } = createSource();

    renderWithSource(<SingleHarness onChange={vi.fn()} />, source);

    expect(useSearch).toHaveBeenCalled();
    expect(
      useSearch.mock.calls.every(([, options]) => options?.skip === true)
    ).toBe(true);
  });

  it('shows the chosen record with its status and clears it', () => {
    const onChange = vi.fn();
    const { source } = createSource();

    renderWithSource(
      <SingleHarness
        initial="a2"
        onChange={onChange}
      />,
      source
    );

    expect(screen.getByText('Budget vote')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Budget vote' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
    expect(document.activeElement).toBe(
      screen.getByRole('combobox', { name: 'Article' })
    );
  });

  it('replaces the chosen record from an opened search', async () => {
    const onChange = vi.fn();
    const { source } = createSource();

    renderWithSource(
      <SingleHarness
        initial="a2"
        onChange={onChange}
      />,
      source
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Replace Budget vote' })
    );
    fireEvent.click(await screen.findByRole('option', { name: /Interview/ }));

    expect(onChange).toHaveBeenCalledWith('a3');
    expect(screen.getByText('Interview')).toBeTruthy();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Replace Interview' })
      )
    );
  });

  it('loads more records when the list is scrolled to its end', async () => {
    const { source, loadMore } = createSource({ hasMore: true });

    renderWithSource(<SingleHarness onChange={vi.fn()} />, source);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Article' }));
    fireEvent.scroll(await screen.findByRole('listbox'));

    expect(loadMore).toHaveBeenCalled();
  });

  it('says when nothing matches', async () => {
    const { source } = createSource();

    renderWithSource(<SingleHarness onChange={vi.fn()} />, source);

    const input = screen.getByRole('combobox', { name: 'Article' });

    fireEvent.mouseDown(input);
    fireEvent.change(input, { target: { value: 'zzz' } });

    expect(await screen.findByText('No articles found')).toBeTruthy();
  });
});

describe('RecordMultiSelect', () => {
  it('lists the selected records in their order', () => {
    const { source } = createSource();

    renderWithSource(
      <MultiHarness
        initial={['a2', 'a1']}
        onChange={vi.fn()}
      />,
      source
    );

    expect(listedTitles()).toEqual([
      expect.stringContaining('Budget vote'),
      expect.stringContaining('Climate report'),
    ]);
  });

  it('toggles records from a list that stays open', async () => {
    const onChange = vi.fn();
    const { source } = createSource();

    renderWithSource(
      <MultiHarness
        initial={['a2']}
        onChange={onChange}
      />,
      source
    );

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Add article' }));

    expect(
      (await screen.findByRole('option', { name: /Budget vote/ })).getAttribute(
        'aria-selected'
      )
    ).toBe('true');

    fireEvent.click(screen.getByRole('option', { name: /Interview/ }));

    expect(onChange).toHaveBeenLastCalledWith(['a2', 'a3']);
    expect(screen.getByRole('listbox')).toBeTruthy();

    fireEvent.click(screen.getByRole('option', { name: /Budget vote/ }));

    expect(onChange).toHaveBeenLastCalledWith(['a3']);
  });

  it('removes a record with its button', () => {
    const onChange = vi.fn();
    const { source } = createSource();

    renderWithSource(
      <MultiHarness
        initial={['a1', 'a2']}
        onChange={onChange}
      />,
      source
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove Climate report' })
    );

    expect(onChange).toHaveBeenCalledWith(['a2']);
    expect(listedTitles()).toEqual([expect.stringContaining('Budget vote')]);
    expect(document.activeElement).toBe(
      screen.getByRole('combobox', { name: 'Add article' })
    );
  });

  it('reorders records without dragging', () => {
    const onChange = vi.fn();
    const { source } = createSource();

    renderWithSource(
      <MultiHarness
        initial={['a2', 'a1']}
        onChange={onChange}
      />,
      source
    );

    const firstUp = screen.getByRole('button', { name: 'Move Budget vote up' });

    expect(firstUp.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(firstUp);

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Move Climate report up' })
    );

    expect(onChange).toHaveBeenCalledWith(['a1', 'a2']);
    expect(listedTitles()).toEqual([
      expect.stringContaining('Climate report'),
      expect.stringContaining('Budget vote'),
    ]);
  });

  it.each(['Move Climate report up', 'Move Budget vote down'])(
    'keeps focus on "%s" when the record reaches the end of the list',
    async name => {
      const onChange = vi.fn();
      const { source } = createSource();

      renderWithSource(
        <MultiHarness
          initial={['a2', 'a1']}
          onChange={onChange}
        />,
        source
      );

      const button = screen.getByRole('button', { name });

      await act(async () => button.focus());
      fireEvent.click(button);

      const moved = screen.getByRole('button', { name });

      expect(onChange).toHaveBeenCalledWith(['a1', 'a2']);
      expect(document.activeElement).toBe(moved);
      expect(moved.getAttribute('aria-disabled')).toBe('true');
    }
  );

  it('stops adding at the maximum and shows the bounds', async () => {
    const onChange = vi.fn();
    const { source } = createSource();

    renderWithSource(
      <MultiHarness
        initial={['a1', 'a2']}
        onChange={onChange}
        min={1}
        max={2}
      />,
      source
    );

    expect(screen.getByText('2 / 2')).toBeTruthy();
    expect(screen.getByText('Select at least 1')).toBeTruthy();

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Add article' }));

    const interview = await screen.findByRole('option', { name: /Interview/ });

    expect(interview.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(interview);

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RecordFieldRender', () => {
  it('renders a single or multiple picker from the field', async () => {
    const { source } = createSource();

    const { unmount } = renderWithSource(
      <RecordFieldRender
        name="paywall"
        field={{ type: 'record', model: 'article', label: 'Lead story' }}
        value="a1"
        onChange={vi.fn()}
      />,
      source
    );

    expect(screen.getByText('Lead story')).toBeTruthy();
    expect(screen.getByText('Climate report')).toBeTruthy();

    unmount();

    renderWithSource(
      <RecordFieldRender
        name="related"
        field={{ type: 'record', model: 'article', multiple: true }}
        value={['a1', 'a3']}
        onChange={vi.fn()}
      />,
      source
    );

    await waitFor(() =>
      expect(screen.getByRole('list', { name: 'Articles' })).toBeTruthy()
    );
    expect(screen.getByText('Interview')).toBeTruthy();
  });
});
