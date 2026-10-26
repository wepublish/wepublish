import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { ListViewFilters, ListViewFiltersProps } from './list-view-filters';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', () => ({
  useLazyQuery: () => [vi.fn(), { data: undefined }],
  useQuery: () => ({ data: undefined, loading: false, refetch: vi.fn() }),
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const renderFilters = (props: Partial<ListViewFiltersProps> = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <ListViewFilters
        fields={['draft', 'pending', 'published']}
        filter={{}}
        isLoading={false}
        onSetFilter={() => undefined}
        {...props}
      />
    </ThemeProvider>
  );

const openStates = () => {
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: 'filterableList.filter.states' })
  );

  return screen.getByRole('listbox');
};

describe('ListViewFilters publication states', () => {
  it('offers the publication states as a single multi select', () => {
    renderFilters();

    const listbox = openStates();

    expect(
      within(listbox).getByText('filterableList.filter.isDraft')
    ).toBeInTheDocument();
    expect(
      within(listbox).getByText('filterableList.filter.isPending')
    ).toBeInTheDocument();
    expect(
      within(listbox).getByText('filterableList.filter.isPublished')
    ).toBeInTheDocument();
  });

  it('only offers the states the caller asked for', () => {
    renderFilters({ fields: ['draft', 'published'] });

    const listbox = openStates();

    expect(
      within(listbox).queryByText('filterableList.filter.isPending')
    ).not.toBeInTheDocument();
  });

  it('turns a picked state into its filter flag', () => {
    const onSetFilter = vi.fn();
    renderFilters({ filter: { published: true }, onSetFilter });

    fireEvent.click(
      within(openStates()).getByText('filterableList.filter.isDraft')
    );

    expect(onSetFilter).toHaveBeenCalledWith(
      expect.objectContaining({ draft: true, published: true })
    );
  });

  it('clears the flag of a state that is deselected, keeping the others', () => {
    const onSetFilter = vi.fn();
    renderFilters({ filter: { draft: true, published: true }, onSetFilter });

    fireEvent.click(
      within(openStates()).getByText('filterableList.filter.isDraft')
    );

    expect(onSetFilter).toHaveBeenCalledWith(
      expect.objectContaining({ draft: null, published: true })
    );
  });

  it('shows the states already set in the filter as tags', () => {
    renderFilters({ filter: { pending: true } });

    expect(
      screen.getByText('filterableList.filter.isPending')
    ).toBeInTheDocument();
  });

  it('leaves the states out entirely when no state field was asked for', () => {
    renderFilters({ fields: ['title'] });

    expect(
      screen.queryByRole('combobox', { name: 'filterableList.filter.states' })
    ).not.toBeInTheDocument();
  });
});

describe('ListViewFilters publication states default', () => {
  it('shows every state as picked when the filter sets none', () => {
    renderFilters({ filter: {} });

    expect(
      screen.getByText('filterableList.filter.isDraft')
    ).toBeInTheDocument();
    expect(
      screen.getByText('filterableList.filter.isPending')
    ).toBeInTheDocument();
    expect(
      screen.getByText('filterableList.filter.isPublished')
    ).toBeInTheDocument();
  });

  it('only shows the states the caller asked for as picked', () => {
    renderFilters({ fields: ['draft', 'published'], filter: {} });

    expect(
      screen.queryByText('filterableList.filter.isPending')
    ).not.toBeInTheDocument();
  });

  it('narrows to one state when the others are deselected from the default', () => {
    const onSetFilter = vi.fn();
    renderFilters({ filter: {}, onSetFilter });

    fireEvent.click(
      within(openStates()).getByText('filterableList.filter.isDraft')
    );

    expect(onSetFilter).toHaveBeenCalledWith(
      expect.objectContaining({ draft: null, pending: true, published: true })
    );
  });

  it('falls back to every state when the last one is deselected', () => {
    const onSetFilter = vi.fn();
    renderFilters({ filter: { draft: true }, onSetFilter });

    fireEvent.click(
      within(openStates()).getByText('filterableList.filter.isDraft')
    );

    expect(onSetFilter).toHaveBeenCalledWith(
      expect.objectContaining({ draft: null, pending: null, published: null })
    );
  });
});

describe('ListViewFilters sizing', () => {
  const dense = createTheme({
    components: {
      MuiTextField: { defaultProps: { size: 'small' } },
      MuiAutocomplete: { defaultProps: { size: 'small' } },
      MuiFormControl: { defaultProps: { size: 'small' } },
    },
  });

  it('lets every field take the size from the theme', () => {
    const { container } = render(
      <ThemeProvider theme={dense}>
        <ListViewFilters
          fields={['text', 'title', 'draft', 'pending', 'published']}
          filter={{}}
          isLoading={false}
          onSetFilter={() => undefined}
        />
      </ThemeProvider>
    );

    const fields = [...container.querySelectorAll('.MuiInputBase-root')];

    expect(fields.length).toBeGreaterThan(1);
    fields.forEach(field => {
      expect(field).toHaveClass('MuiInputBase-sizeSmall');
    });
  });
});

describe('ListViewFilters reset', () => {
  it('leaves the reset to the toolbar', () => {
    renderFilters({ filter: { title: 'Hello' }, fields: ['title'] });

    expect(
      screen.queryByRole('button', { name: /filterableList.filter.reset/ })
    ).not.toBeInTheDocument();
  });
});
