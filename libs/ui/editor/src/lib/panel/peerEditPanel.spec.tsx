import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';

import { PeerEditPanel } from './peerEditPanel';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false, refetch: vi.fn() }),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: async () => ({ data: { peer } }) }),
}));

const peer = {
  id: 'peer-1',
  name: 'Partner',
  slug: 'partner',
  hostURL: 'https://partner.example/',
  token: 'secret-token',
  information: null,
  profile: {
    __typename: 'RemotePeerProfile',
    name: 'Partner profile',
    themeColor: '#ffffff',
    themeFontColor: '#000000',
    callToActionText: null,
    callToActionURL: '',
    callToActionImage: null,
    callToActionImageURL: '',
  },
};

const renderPanel = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <PeerEditPanel
        id="peer-1"
        hostURL="https://partner.example/"
      />
    </ThemeProvider>
  );

describe('PeerEditPanel', () => {
  it('shows the stored profile as soon as the peer loads', async () => {
    renderPanel();

    expect(await screen.findByText('Partner profile')).toBeInTheDocument();
  });

  it('fills the URL and token from the peer', async () => {
    renderPanel();

    expect(await screen.findByRole('textbox', { name: /URL/i })).toHaveValue(
      'https://partner.example/'
    );
  });

  it('drops the profile when the URL is edited', async () => {
    renderPanel();

    await screen.findByText('Partner profile');
    fireEvent.change(screen.getByRole('textbox', { name: /URL/i }), {
      target: { value: 'https://other.example/' },
    });

    expect(screen.queryByText('Partner profile')).not.toBeInTheDocument();
  });

  it('drops the profile when the token is edited', async () => {
    renderPanel();

    await screen.findByText('Partner profile');
    const token = screen.getByRole('textbox', { name: /token/i });
    fireEvent.change(token, { target: { value: 'another-token' } });

    expect(screen.queryByText('Partner profile')).not.toBeInTheDocument();
  });
});
