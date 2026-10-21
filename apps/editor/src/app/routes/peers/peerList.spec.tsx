import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CanCreatePeer,
  CanDeletePeer,
  CanGetPeer,
  CanGetPeerProfile,
  CanGetPeers,
  CanUpdatePeerProfile,
} from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { PeerListDocument, PeerProfileDocument } from '@wepublish/editor/api';

import { PeerList } from './peerList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useApolloClient: () => ({ query: vi.fn(() => new Promise(vi.fn())) }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;
const mockedUseMutation = useMutation as unknown as Mock;

const peer = {
  __typename: 'Peer',
  id: 'peer-1',
  name: 'Hauptstadt',
  slug: 'hauptstadt',
  isDisabled: false,
  hostURL: 'https://api-hauptstadt.example.test/',
  profile: {
    name: 'Hauptstadt',
    websiteURL: 'https://hauptstadt.example.test',
    logo: null,
    squareLogo: null,
  },
};

const listing = (...peers: (typeof peer)[]) => {
  mockedUseQuery.mockImplementation((document: unknown) => {
    if (document === PeerProfileDocument) {
      return {
        data: {
          peerProfile: {
            name: 'We.Publish Demo',
            hostURL: 'https://api-demo.example.test',
            logo: null,
            squareLogo: null,
          },
        },
        loading: false,
      };
    }

    if (document === PeerListDocument) {
      return { data: { peers }, loading: false };
    }

    return { data: undefined, loading: false };
  });
};

const updatePeer = vi.fn();

const renderList = () =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                {
                  id: 'role',
                  permissions: [
                    CanCreatePeer.id,
                    CanDeletePeer.id,
                    CanGetPeer.id,
                    CanGetPeerProfile.id,
                    CanGetPeers.id,
                    CanUpdatePeerProfile.id,
                  ].map(id => ({ id })),
                },
              ],
            },
          } as never
        }
      >
        <MemoryRouter initialEntries={['/peering']}>
          <Routes>
            {['/peering', '/peering/edit/:id'].map(path => (
              <Route
                key={path}
                path={path}
                element={<PeerList />}
              />
            ))}
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  updatePeer.mockReset();
  mockedUseMutation.mockImplementation(() => [updatePeer, { loading: false }]);
  listing(peer);
});

describe('PeerList', () => {
  it('lists peers in a table that leads with their status', async () => {
    renderList();

    const headers = await screen.findAllByRole('columnheader');

    expect(headers[0]).toHaveTextContent('peerList.overview.status');
    expect(screen.getByText('peerList.overview.active')).toBeInTheDocument();
  });

  it('marks a disabled peer as disabled', async () => {
    listing({ ...peer, isDisabled: true });
    renderList();

    expect(
      await screen.findByText('peerList.overview.disabled')
    ).toBeInTheDocument();
  });

  it('shows the peer name as plain text, editing goes through the edit action', async () => {
    renderList();

    expect(await screen.findByText('Hauptstadt')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Hauptstadt' })).toBeNull();
  });

  it('offers an edit action next to disable and delete', async () => {
    renderList();

    expect(
      await screen.findByRole('link', { name: 'peerList.panels.editPeer' })
    ).toHaveAttribute('href', '/peering/edit/peer-1');
  });

  it('keeps the edit action in place, greyed out, for a disabled peer', async () => {
    listing({ ...peer, isDisabled: true });
    renderList();

    expect(
      await screen.findByRole('button', { name: 'peerList.panels.editPeer' })
    ).toBeDisabled();
  });

  it('opens the same peer again after its drawer was closed', async () => {
    renderList();

    fireEvent.click(
      await screen.findByRole('link', { name: 'peerList.panels.editPeer' })
    );
    expect(
      await screen.findByRole('button', { name: 'peerList.panels.close' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'peerList.panels.close' })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'peerList.panels.close' })
      ).toBeNull()
    );

    fireEvent.click(
      screen.getByRole('link', { name: 'peerList.panels.editPeer' })
    );
    expect(
      await screen.findByRole('button', { name: 'peerList.panels.close' })
    ).toBeInTheDocument();
  });

  it('disables an active peer from its row', async () => {
    renderList();

    fireEvent.click(
      await screen.findByRole('button', { name: 'peerList.overview.disable' })
    );

    expect(updatePeer).toHaveBeenCalledWith({
      variables: { id: 'peer-1', isDisabled: true },
    });
  });

  it('labels the profile settings button with words, not just a cog', async () => {
    renderList();

    expect(
      await screen.findByRole('link', { name: 'peerList.overview.editProfile' })
    ).toHaveTextContent('peerList.overview.editProfile');
  });

  it('says so when there are no peers yet', async () => {
    listing();
    renderList();

    expect(
      await screen.findByText('peerList.overview.noPeersFound')
    ).toBeInTheDocument();
  });
});
