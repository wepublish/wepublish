import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ImageList } from './imageList';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  createCheckedPermissionComponent: () => (component: unknown) => component,
  PermissionControl: ({ children }: { children: unknown }) => children,
  ImageUploadAndEditPanel: () => <div data-testid="upload-panel" />,
  ImageEditPanel: ({ id }: { id: string }) => (
    <div data-testid={`edit-panel-${id}`} />
  ),
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

const image = {
  id: 'image-1',
  title: 'Sunset',
  filename: 'sunset',
  extension: '.jpg',
  description: '',
  squareURL: 'https://example.com/square.jpg',
  thumbURL: 'https://example.com/thumb.jpg',
};

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/images"
            element={<ImageList />}
          />
          <Route
            path="/images/upload"
            element={<ImageList />}
          />
          <Route
            path="/images/edit/:id"
            element={<ImageList />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('ImageList accessibility', () => {
  beforeEach(() => {
    mockedUseQuery.mockReturnValue({
      data: { images: { nodes: [image], totalCount: 1 } },
      loading: false,
      refetch: vi.fn(),
    });
  });

  it('reopens the upload drawer after it was closed', async () => {
    renderAt('/images');

    const upload = screen.getByRole('link', {
      name: 'images.overview.uploadImage',
    });

    fireEvent.click(upload);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), {
      timeout: 5000,
    });

    fireEvent.click(upload);
    expect(screen.getByTestId('upload-panel')).toBeTruthy();
  });

  it('reopens the edit drawer for the same image after it was closed', async () => {
    renderAt('/images');

    const tile = screen.getByRole('link', { name: 'Sunset' });

    fireEvent.click(tile);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), {
      timeout: 5000,
    });

    fireEvent.click(tile);
    expect(screen.getByTestId('edit-panel-image-1')).toBeTruthy();
  });

  it('keeps the grid delete button outside the edit link and names it after the image', () => {
    renderAt('/images');

    const tile = screen.getByRole('link', { name: 'Sunset' });
    const remove = screen.getByRole('button', { name: 'delete Sunset' });

    expect(tile.contains(remove)).toBe(false);
  });

  it('names the list view thumbnail link after the image', () => {
    localStorage.setItem('imageListLayout', 'list');
    renderAt('/images');

    const table = screen.getByRole('table');

    expect(
      within(table).getAllByRole('link', { name: 'Sunset' }).length
    ).toBeGreaterThan(0);
  });
});
