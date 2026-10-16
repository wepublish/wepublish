import '@testing-library/jest-dom/vitest';

import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { TagType } from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { TagList } from './tagList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const tag = {
  __typename: 'Tag',
  id: 'tag-1',
  tag: 'Wirtschaft',
  main: false,
  url: 'https://example.com/a/tag/wirtschaft',
};

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { tags: { nodes: [tag], totalCount: 1 } },
    loading: false,
    refetch: vi.fn(),
  });
});

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>
        <TagList type={TagType.Article} />
      </MemoryRouter>
    </ThemeProvider>
  );

const openFilters = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /filterableList.filter.label/ })
  );

describe('TagList', () => {
  it('keeps the search behind the toolbar button', () => {
    renderList();

    expect(
      screen.queryByRole('textbox', { name: 'tags.overview.name' })
    ).not.toBeInTheDocument();

    openFilters();

    expect(
      screen.getByRole('textbox', { name: 'tags.overview.name' })
    ).toBeInTheDocument();
  });

  it('counts the search as a filter, and clears it on the x', () => {
    renderList();
    openFilters();

    fireEvent.change(
      screen.getByRole('textbox', { name: 'tags.overview.name' }),
      { target: { value: 'Wirt' } }
    );

    expect(
      screen.getByRole('button', { name: /filterableList.filter.label/ })
    ).toHaveTextContent('1');

    fireEvent.click(
      screen.getByRole('button', { name: 'filterableList.filter.reset' })
    );

    expect(
      screen.getByRole('textbox', { name: 'tags.overview.name' })
    ).toHaveValue('');
  });
});
