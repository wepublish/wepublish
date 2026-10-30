import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Mock } from 'vitest';

import { AuthorCheckPicker } from './authorCheckPicker';

const theme = createTheme({ cssVariables: true });

const apollo = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useApolloClient: () => apollo,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;
const createAuthor = vi.fn();

const ada = { id: 'a1', name: 'Ada Lovelace', peer: null };
const grace = { id: 'a2', name: 'Grace Hopper', peer: null };

const renderPicker = (props = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <AuthorCheckPicker
        list={[]}
        onChange={vi.fn()}
        {...(props as object)}
      />
    </ThemeProvider>
  );

const open = () => fireEvent.mouseDown(screen.getByRole('combobox'));

const type = (value: string) => {
  const combobox = screen.getByRole('combobox');
  combobox.focus();
  fireEvent.mouseDown(combobox);
  fireEvent.change(combobox, { target: { value } });
};

beforeEach(() => {
  apollo.query.mockReset();
  apollo.query.mockResolvedValue({ data: { author: ada } });
  createAuthor.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([createAuthor, { loading: false }]);
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { authors: { nodes: [ada, grace] } },
    loading: false,
  });
});

describe('AuthorCheckPicker', () => {
  it('offers the authors the query returned', async () => {
    renderPicker();

    open();

    await waitFor(() =>
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    );
  });

  it('reports whole authors rather than ids', async () => {
    const onChange = vi.fn();
    renderPicker({ onChange });

    open();
    fireEvent.click(await screen.findByText('Grace Hopper'));

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'a2' }),
    ]);
  });

  it('searches on the server', async () => {
    renderPicker();

    type('grace');

    await waitFor(() =>
      expect(
        mockedUseQuery.mock.calls.some(
          call => call[1]?.variables?.filter === 'grace'
        )
      ).toBe(true)
    );
  });

  it('keeps the search text when the results come back', async () => {
    mockedUseQuery.mockImplementation((_document, { variables }) => ({
      data: {
        authors: {
          nodes: [ada, grace].filter(({ name }) =>
            name.toLowerCase().includes(variables.filter ?? '')
          ),
        },
      },
      loading: false,
    }));
    renderPicker({ list: [ada] });

    type('gra');

    await waitFor(() => expect(screen.getByText('Grace Hopper')).toBeVisible());
    expect(screen.getByRole('combobox')).toHaveValue('gra');
    expect(mockedUseQuery.mock.lastCall?.[1]?.variables?.filter).toBe('gra');
  });

  it('clears the search text once an author is picked', async () => {
    renderPicker();

    type('gra');
    fireEvent.click(await screen.findByText('Grace Hopper'));

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('pages through the authors the search found', async () => {
    mockedUseQuery.mockReturnValue({
      data: { authors: { nodes: [ada, grace], totalCount: 25 } },
      loading: false,
    });
    renderPicker();

    open();
    fireEvent.click(await screen.findByRole('button', { name: /page 2/i }));

    await waitFor(() =>
      expect(mockedUseQuery.mock.lastCall?.[1]?.variables).toMatchObject({
        take: 10,
        skip: 10,
      })
    );
  });

  it('starts a new search on the first page', async () => {
    mockedUseQuery.mockReturnValue({
      data: { authors: { nodes: [ada, grace], totalCount: 25 } },
      loading: false,
    });
    renderPicker();

    open();
    fireEvent.click(await screen.findByRole('button', { name: /page 2/i }));
    type('gra');

    await waitFor(() =>
      expect(mockedUseQuery.mock.lastCall?.[1]?.variables).toMatchObject({
        filter: 'gra',
        skip: 0,
      })
    );
  });

  it('looks up the name of an author it was handed by id alone', async () => {
    mockedUseQuery.mockReturnValue({
      data: { authors: { nodes: [grace] } },
      loading: false,
    });
    renderPicker({ list: [{ id: 'a1' }] });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('takes the name from the authors it already loaded', async () => {
    renderPicker({ list: [{ id: 'a1' }] });

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(apollo.query).not.toHaveBeenCalled();
  });

  it('waits for the author list before asking for a name', () => {
    mockedUseQuery.mockReturnValue({ data: undefined, loading: true });
    renderPicker({ list: [{ id: 'a1' }] });

    expect(apollo.query).not.toHaveBeenCalled();
  });

  it('drops the placeholder once somebody is picked', () => {
    renderPicker({ list: [ada] });

    expect(screen.getByRole('combobox')).not.toHaveAttribute('placeholder');
  });

  it('can be disabled', () => {
    renderPicker({ disabled: true });

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('offers to create the author when the search finds nobody', async () => {
    mockedUseQuery.mockReturnValue({
      data: { authors: { nodes: [] } },
      loading: false,
    });
    renderPicker();

    type('Brand New');

    expect(
      await screen.findByRole('button', {
        name: /articles.panels.createAuthorProfile/,
      })
    ).toBeInTheDocument();
  });

  it('creates the author under the name that was searched for', async () => {
    mockedUseQuery.mockReturnValue({
      data: { authors: { nodes: [] } },
      loading: false,
    });
    renderPicker();

    type('Brand New');
    fireEvent.click(
      await screen.findByRole('button', {
        name: /articles.panels.createAuthorProfile/,
      })
    );

    await waitFor(() =>
      expect(createAuthor).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ name: 'Brand New' }),
        })
      )
    );
  });

  it('does not offer to create when the search found someone', () => {
    renderPicker();

    type('Ada');

    expect(
      screen.queryByRole('button', {
        name: /articles.panels.createAuthorProfile/,
      })
    ).not.toBeInTheDocument();
  });

  it('does not collapse when its container gives it no width', () => {
    renderPicker();

    expect(
      screen.getByRole('combobox').closest('.MuiAutocomplete-root')
    ).toHaveStyle({ minWidth: '200px' });
  });
});
