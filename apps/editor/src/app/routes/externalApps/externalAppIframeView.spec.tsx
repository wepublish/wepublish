// @vitest-environment-options {"settings":{"disableIframePageLoading":true}}
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { CreateExternalAppTokenDocument } from '@wepublish/editor/api';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ExternalAppIframeView } from './externalAppIframeView';

const { mutationFor } = vi.hoisted(() => {
  const mutations = new Map<unknown, Mock>();

  return {
    mutationFor: (document: unknown) => {
      if (!mutations.has(document)) {
        mutations.set(document, vi.fn());
      }

      return mutations.get(document) as Mock;
    },
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
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const { useQuery } = await import('@apollo/client/react');
const mockedUseQuery = useQuery as unknown as Mock;
const mint = mutationFor(CreateExternalAppTokenDocument);

const externalApp = {
  id: 'app-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Tool',
  description: null,
  url: 'https://tool.example.com/path',
  target: 'IFRAME',
  icon: null,
};

const renderView = () =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <MemoryRouter initialEntries={['/external-app/app-1']}>
        <Routes>
          <Route
            path="/external-app/:id"
            element={<ExternalAppIframeView />}
          />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  mockedUseQuery.mockReset();
  mockedUseQuery.mockReturnValue({
    data: { externalApp },
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
});

describe('ExternalAppIframeView', () => {
  it('renders the iframe with the token in the fragment', async () => {
    renderView();

    const iframe = await screen.findByTitle('Tool');

    expect(iframe.getAttribute('src')).toBe(
      'https://tool.example.com/path#token=jwt.a.b'
    );
    expect(mint).toHaveBeenCalledTimes(1);
    expect(mint).toHaveBeenCalledWith({
      variables: { externalAppId: 'app-1' },
    });
  });

  it('keeps the spinner and shows no iframe until the token arrives', () => {
    mint.mockReturnValue(new Promise(() => undefined));

    renderView();

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByTitle('Tool')).toBeNull();
  });

  it('shows the error instead of an app without a token', async () => {
    mint.mockRejectedValue(new Error('boom'));

    renderView();

    expect(await screen.findByText('boom')).toBeTruthy();
    expect(screen.queryByTitle('Tool')).toBeNull();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('titles the page after the app it shows', async () => {
    renderView();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tool' })
    ).toBeInTheDocument();
  });

  it('explains a missing app in words instead of a database error', () => {
    mockedUseQuery.mockReturnValue({
      loading: false,
      data: undefined,
      error: new Error(
        'Invalid `this.prisma.externalApps.findMany()` invocation'
      ),
    });
    renderView();

    expect(
      screen.getByRole('heading', { level: 1, name: 'externalApps.notFound' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/prisma/)).toBeNull();
  });
});
