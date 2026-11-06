import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { VideoEditRoute } from './videoEditRoute';
import { VideoList } from './videoList';
import { VideoUploadRoute } from './videoUploadRoute';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: async () => ({ data: { video } }) }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const video = {
  id: 'video-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  filename: 'rehearsal',
  extension: '.mp4',
  fileSize: 2048,
  title: 'Rehearsal, act two',
  description: null,
  url: 'https://media.test/video/video-1/rehearsal.mp4',
};

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/videos"
            element={<VideoList />}
          >
            <Route
              path="upload"
              element={<VideoUploadRoute />}
            />
            <Route
              path="edit/:id"
              element={<VideoEditRoute />}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  mockedUseQuery.mockImplementation(() => ({
    data: {
      videos: {
        nodes: [video],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
      video,
      videoStorageUsage: { usedBytes: 0, limitBytes: 0 },
    },
    loading: false,
    refetch: vi.fn(),
  }));
});

describe('VideoList', () => {
  it('keeps both drawers shut on the plain list route', () => {
    renderAt('/videos');

    expect(screen.queryByText('videos.panels.uploadVideo')).toBeNull();
    expect(screen.queryByText('videos.panels.editVideo')).toBeNull();
  });

  it('opens the upload drawer straight from the route', async () => {
    renderAt('/videos/upload');

    expect(
      await screen.findByText('videos.panels.uploadVideo')
    ).toBeInTheDocument();
  });

  it('opens the edit drawer for the video named in the route', async () => {
    renderAt('/videos/edit/video-1');

    expect(
      await screen.findByText('videos.panels.editVideo')
    ).toBeInTheDocument();
  });

  it('shuts the drawer again when it is closed', async () => {
    renderAt('/videos/edit/video-1');

    await screen.findByText('videos.panels.editVideo');
    fireEvent.click(
      screen.getByRole('button', { name: 'videos.panels.close' })
    );

    await vi.waitFor(() =>
      expect(screen.queryByText('videos.panels.editVideo')).toBeNull()
    );
  });
});
