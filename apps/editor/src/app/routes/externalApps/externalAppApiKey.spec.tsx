import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import {
  ExternalAppsDocument,
  ExternalAppsTarget,
} from '@wepublish/editor/api';
import { AuthContext } from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ExternalAppsDashboard } from '../dashboard/externalAppsDashboard';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ?
        `${key}:${Object.entries(options)
          .map(
            ([name, value]) =>
              `${name}=${value instanceof Date ? value.toISOString() : String(value)}`
          )
          .join(',')}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const theme = createTheme({ cssVariables: true });

const NOW = new Date('2026-10-23T10:00:00.000Z');

const linkedKey = (overrides: Record<string, unknown> = {}) => ({
  __typename: 'ApiToken',
  id: 'key-1',
  name: 'nw-one-click-export',
  prefix: 'wep_abcd1234',
  scopes: ['CAN_GET_SUBSCRIPTIONS', 'CAN_GET_USERS'],
  expiresAt: '2027-10-23T00:00:00.000Z',
  revokedAt: null,
  lastUsedAt: '2026-10-22T08:00:00.000Z',
  ...overrides,
});

const app = (apiToken: unknown = null) => ({
  __typename: 'ExternalApp',
  id: 'app-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Druckliste Export',
  description: null,
  url: 'https://export.neuewege.ch/',
  target: ExternalAppsTarget.Iframe,
  icon: null,
  apiTokenId: (apiToken as { id?: string } | null)?.id ?? null,
  apiToken,
});

const withPermissions = (permissions: string[], children: ReactNode) => (
  <ThemeProvider theme={theme}>
    <AuthContext.Provider
      value={
        {
          session: {
            sessionRoles: [
              { id: 'role', permissions: permissions.map(id => ({ id })) },
            ],
          },
        } as never
      }
    >
      <MemoryRouter>{children}</MemoryRouter>
    </AuthContext.Provider>
  </ThemeProvider>
);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the apps dashboard', () => {
  const dashboardWith = (...apps: unknown[]) => {
    mockedUseQuery.mockImplementation((document: unknown) =>
      document === ExternalAppsDocument ?
        { data: { externalApps: apps }, loading: false }
      : { data: undefined, loading: false }
    );

    render(withPermissions([], <ExternalAppsDashboard />));
  };

  it("warns when an app's API key has been revoked", () => {
    dashboardWith(app(linkedKey({ revokedAt: '2026-10-20T00:00:00.000Z' })));

    expect(
      screen.getByText(
        'externalApps.apiKey.revoked:name=nw-one-click-export,expiresAt=2027-10-23T00:00:00.000Z'
      )
    ).toBeTruthy();
  });

  it("warns when an app's API key has expired", () => {
    dashboardWith(app(linkedKey({ expiresAt: '2026-10-01T00:00:00.000Z' })));

    expect(screen.getByText(/^externalApps\.apiKey\.expired:/)).toBeTruthy();
  });

  it('stays quiet for a key valid for longer and for apps without a key', () => {
    dashboardWith(app(linkedKey()), { ...app(), id: 'app-2', name: 'Other' });

    expect(screen.queryByText(/externalApps\.apiKey\./)).toBeNull();
  });
});
