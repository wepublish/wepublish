import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { AudioEditRoute } from './audioEditRoute';
import { AudioList } from './audioList';
import { AudioUploadRoute } from './audioUploadRoute';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: async () => ({ data: { audio } }) }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const audio = {
  id: 'audio-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  filename: 'rehearsal',
  extension: '.mp4',
  fileSize: 2048,
  title: 'Rehearsal, act two',
  description: null,
  url: 'https://media.test/audio/audio-1/rehearsal.mp4',
};

const renderAt = (path: string) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/audio"
            element={<AudioList />}
          >
            <Route
              path="upload"
              element={<AudioUploadRoute />}
            />
            <Route
              path="edit/:id"
              element={<AudioEditRoute />}
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
      audios: {
        nodes: [audio],
        totalCount: 1,
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      },
      audio,
      audioStorageUsage: { usedBytes: 0, limitBytes: 0 },
    },
    loading: false,
    refetch: vi.fn(),
  }));
});

describe('AudioList', () => {
  it('keeps both drawers shut on the plain list route', () => {
    renderAt('/audio');

    expect(screen.queryByText('audio.panels.uploadAudio')).toBeNull();
    expect(screen.queryByText('audio.panels.editAudio')).toBeNull();
  });

  it('opens the upload drawer straight from the route', async () => {
    renderAt('/audio/upload');

    expect(
      await screen.findByText('audio.panels.uploadAudio')
    ).toBeInTheDocument();
  });

  it('opens the edit drawer for the audio named in the route', async () => {
    renderAt('/audio/edit/audio-1');

    expect(
      await screen.findByText('audio.panels.editAudio')
    ).toBeInTheDocument();
  });

  it('shuts the drawer again when it is closed', async () => {
    renderAt('/audio/edit/audio-1');

    await screen.findByText('audio.panels.editAudio');
    fireEvent.click(screen.getByRole('button', { name: 'audio.panels.close' }));

    await vi.waitFor(() =>
      expect(screen.queryByText('audio.panels.editAudio')).toBeNull()
    );
  });
});
