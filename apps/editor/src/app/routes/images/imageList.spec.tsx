import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ImageList } from './imageList';

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

const lastVariables = () => mockedUseQuery.mock.calls.at(-1)?.[1]?.variables;

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { images: { nodes: [], totalCount: 0 } },
    loading: false,
    refetch: vi.fn(),
  });
});

describe('ImageList', () => {
  it('loads enough images to fill the page by default', () => {
    render(
      <ThemeProvider theme={createTheme({ cssVariables: true })}>
        <MemoryRouter initialEntries={['/images']}>
          <ImageList />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(lastVariables()).toEqual(expect.objectContaining({ take: 50 }));
  });

  it('searches from either layout', () => {
    const searchIn = (layout: 'grid' | 'list') => {
      localStorage.setItem('imageListLayout', layout);

      const { getByRole, unmount } = render(
        <ThemeProvider theme={createTheme({ cssVariables: true })}>
          <MemoryRouter>
            <ImageList />
          </MemoryRouter>
        </ThemeProvider>
      );

      const search = getByRole('textbox', { name: 'search' });
      unmount();

      return search;
    };

    expect(searchIn('grid')).toBeTruthy();
    expect(searchIn('list')).toBeTruthy();
  });
});
