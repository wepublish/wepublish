import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CreateExternalAppTokenDocument,
  ExternalAppsTarget,
} from '@wepublish/editor/api';
import type { Mock } from 'vitest';

import { ExternalAppsDashboard } from './externalAppsDashboard';

const { mutationFor, navigate, showSnackbar } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as Mock;
    },
    navigate: vi.fn(),
    showSnackbar: vi.fn(),
  };
});

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: (document: unknown) => [
    mutationFor(document),
    { loading: false },
  ],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', async importOriginal => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  enqueueSnackbar: showSnackbar,
}));

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;
const mint = mutationFor(CreateExternalAppTokenDocument);

const app = (
  id: string,
  name: string,
  url: string,
  target: ExternalAppsTarget
) => ({
  id,
  name,
  url,
  target,
  icon: null,
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
});

const apps = [
  app(
    'app-1',
    'Tab app',
    'https://tool.example.com/',
    ExternalAppsTarget.Blank
  ),
  app(
    'app-2',
    'Frame app',
    'https://frame.example.com/',
    ExternalAppsTarget.Iframe
  ),
];

const popup = () => ({
  opener: {} as unknown,
  close: vi.fn(),
  location: { replace: vi.fn() },
});

// the dashboard styles read theme.spacing, which only a provider supplies
const renderDashboard = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <ExternalAppsDashboard />
    </ThemeProvider>
  );

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { externalApps: apps },
    loading: false,
    error: undefined,
  });
  mint.mockReset();
  mint.mockResolvedValue({
    data: {
      createExternalAppToken: {
        token: 'jwt.a.b',
        expiresAt: '2026-10-13T16:00:00.000Z',
      },
    },
  });
  navigate.mockReset();
  showSnackbar.mockReset();
});

afterEach(() => vi.restoreAllMocks());

describe('ExternalAppsDashboard', () => {
  it('opens an iframe app inside the editor', () => {
    vi.spyOn(window, 'open');
    renderDashboard();

    fireEvent.click(screen.getByText('Frame app'));

    expect(navigate).toHaveBeenCalledWith('/external-app/app-2');
    expect(window.open).not.toHaveBeenCalled();
    expect(mint).not.toHaveBeenCalled();
  });

  it('opens a new-tab app with a token in the fragment', async () => {
    const tab = popup();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    renderDashboard();

    fireEvent.click(screen.getByText('Tab app'));

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    await waitFor(() =>
      expect(tab.location.replace).toHaveBeenCalledWith(
        'https://tool.example.com/#token=jwt.a.b'
      )
    );
    expect(mint).toHaveBeenCalledWith({
      variables: { externalAppId: 'app-1' },
    });
  });

  it('tells the user when no token can be minted', async () => {
    mint.mockRejectedValue(new Error('boom'));
    const tab = popup();
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    renderDashboard();

    fireEvent.click(screen.getByText('Tab app'));

    await waitFor(() => expect(tab.close).toHaveBeenCalled());
    expect(showSnackbar).toHaveBeenCalledTimes(1);
    expect(tab.location.replace).not.toHaveBeenCalled();
  });
});
