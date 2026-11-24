import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { PageListDocument, TagType } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { TagEditView } from './tagEditView';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useMutation: vi.fn(),
  useApolloClient: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useParams: () => ({ id: 'tag-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(',')}` : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  RichTextBlock: ({ onChange }: { onChange?: (value: unknown) => void }) => (
    <button
      type="button"
      data-testid="rich-text"
      onClick={() => onChange?.([])}
    />
  ),
}));

const mockedUseMutation = useMutation as unknown as Mock;
const mockedUseApolloClient = useApolloClient as unknown as Mock;
const mockedUseQuery = useQuery as unknown as Mock;
const updateTag = vi.fn();
const query = vi.fn();

// Results keep their identity between renders, as Apollo's do.
const pageList = {
  data: {
    pages: {
      nodes: [
        { __typename: 'Page', id: 'page-1', latest: { title: 'Dossier' } },
        { __typename: 'Page', id: 'page-2', latest: { title: 'Landingpage' } },
      ],
      totalCount: 2,
    },
  },
  loading: false,
  refetch: vi.fn(),
};
const noData = { data: undefined, loading: false, refetch: vi.fn() };

const tag = {
  id: 'tag-1',
  tag: 'Sport',
  type: TagType.Article,
  color: '#0e5c56',
  description: null,
  main: true,
  pageId: null as string | null,
};

const loadTag = (overrides: Partial<typeof tag> = {}) =>
  query.mockResolvedValue({ data: { tag: { ...tag, ...overrides } } });

const renderView = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TagEditView />
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  updateTag.mockReset();
  mockedUseMutation.mockReset();
  mockedUseMutation.mockReturnValue([updateTag, { loading: false }]);

  query.mockReset();
  loadTag();
  mockedUseApolloClient.mockReturnValue({ query });

  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation((document: unknown) =>
    document === PageListDocument ? pageList : noData
  );
});

const pagePicker = () =>
  screen.findByRole('combobox', { name: 'tags.overview.page' });

const save = () => fireEvent.click(screen.getByTestId('saveButton'));

const savedVariables = async () => {
  await waitFor(() => expect(updateTag).toHaveBeenCalled());

  return updateTag.mock.lastCall?.[0].variables;
};

describe('TagEditView', () => {
  it('opens on the tag it was asked for', async () => {
    renderView();

    expect(await screen.findByDisplayValue('Sport')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#0e5c56')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('saves what was edited', async () => {
    renderView();

    fireEvent.change(await screen.findByDisplayValue('Sport'), {
      target: { value: 'Sports' },
    });
    fireEvent.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(updateTag).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ id: 'tag-1', tag: 'Sports' }),
        })
      )
    );
  });

  it('asks for the tag once', async () => {
    renderView();

    await screen.findByDisplayValue('Sport');

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'tag-1' } })
    );
  });

  describe('tag page', () => {
    it('shows the page shown instead of the article list', async () => {
      loadTag({ pageId: 'page-1' });
      renderView();

      expect(await pagePicker()).toHaveValue('Dossier');
    });

    it('saves the page picked for the tag', async () => {
      renderView();

      fireEvent.mouseDown(await pagePicker());
      fireEvent.click(
        within(screen.getByRole('listbox')).getByRole('option', {
          name: 'Landingpage',
        })
      );
      save();

      expect(await savedVariables()).toMatchObject({
        id: 'tag-1',
        pageId: 'page-2',
      });
    });

    it('goes back to the article list when the page is cleared', async () => {
      loadTag({ pageId: 'page-1' });
      renderView();

      const picker = await pagePicker();

      // MUI shows the clear button while the field has focus.
      fireEvent.focus(picker);
      fireEvent.click(
        within(picker.parentElement!).getByRole('button', { name: 'Clear' })
      );
      save();

      expect(await savedVariables()).toMatchObject({
        id: 'tag-1',
        pageId: null,
      });
    });

    it('is only offered for article tags, which have a tag page', async () => {
      loadTag({ type: TagType.Page });
      renderView();

      await screen.findByDisplayValue('Sport');

      expect(
        screen.queryByRole('combobox', { name: 'tags.overview.page' })
      ).not.toBeInTheDocument();
    });
  });
});
