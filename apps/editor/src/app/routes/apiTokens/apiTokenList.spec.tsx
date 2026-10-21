import { useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  CanCreateApiToken,
  CanGetAllApiTokens,
  CanGetApiTokens,
  CanRevokeApiToken,
} from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ApiTokenStatus, UserListDocument } from '@wepublish/editor/api';

import { ApiTokenGenerateRoute } from './apiTokenGenerateRoute';
import { ApiTokenList } from './apiTokenList';

const theme = createTheme({ cssVariables: true });

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: () => [vi.fn(), { loading: false }],
  useApolloClient: () => ({ query: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ?
        `${key}:${Object.values(options)
          .map(value =>
            value instanceof Date ? value.toISOString() : String(value)
          )
          .join(',')}`
      : key,
    i18n: { language: 'en' },
  }),
}));

const mockedUseQuery = useQuery as unknown as Mock;

const apiToken = {
  id: 'token-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  name: 'Ginto import',
  prefix: 'wep_abcd1234',
  scopes: ['CAN_GET_ARTICLE'],
  expiresAt: '2027-12-31T10:00:00.000Z',
  revokedAt: null,
  lastUsedAt: null,
  createdById: 'user-1',
  createdBy: { id: 'user-1', name: 'Ada Lovelace' },
};

const users = [
  {
    id: 'user-1',
    name: 'Lovelace',
    firstName: 'Ada',
    email: 'ada@example.test',
  },
  {
    id: 'user-2',
    name: 'Hopper',
    firstName: 'Grace',
    email: 'grace@example.test',
  },
];

const listing = (...nodes: (typeof apiToken)[]) => {
  mockedUseQuery.mockImplementation((document: unknown) => {
    if (document === UserListDocument) {
      return { data: { users: { nodes: users } }, loading: false };
    }

    return {
      data: {
        apiTokens: {
          nodes,
          totalCount: nodes.length,
          pageInfo: { hasNextPage: false, hasPreviousPage: false },
        },
      },
      loading: false,
      refetch: vi.fn(),
    };
  });
};

const tokenVariables = () =>
  mockedUseQuery.mock.calls.findLast(call => call[0] !== UserListDocument)?.[1]
    ?.variables;

const REQUIRED = [
  CanCreateApiToken.id,
  CanGetApiTokens.id,
  CanRevokeApiToken.id,
];

const renderAt = (path: string, ...extraPermissions: string[]) =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider
        value={
          {
            session: {
              sessionRoles: [
                {
                  id: 'role',
                  permissions: [...REQUIRED, ...extraPermissions].map(id => ({
                    id,
                  })),
                },
              ],
            },
          } as never
        }
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/api-tokens"
              element={<ApiTokenList />}
            >
              <Route
                path="generate"
                element={<ApiTokenGenerateRoute />}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

const renderList = (...extraPermissions: string[]) =>
  renderAt('/api-tokens', ...extraPermissions);

beforeEach(() => {
  localStorage.clear();
  mockedUseQuery.mockReset();
  listing(apiToken);
});

describe('ApiTokenList', () => {
  it('keeps the create drawer shut on the plain list route', () => {
    renderList();

    expect(screen.queryByText('apiTokenList.panels.generateToken')).toBeNull();
  });

  it('opens the create drawer straight from the route', async () => {
    renderAt('/api-tokens/generate');

    expect(
      await screen.findByText('apiTokenList.panels.generateToken')
    ).toBeInTheDocument();
  });

  it('leads with the status, so a dead key is seen before it is read', async () => {
    renderList();

    const headers = await screen.findAllByRole('columnheader');

    expect(headers[0]).toHaveTextContent('apiTokenList.overview.status');
  });

  it('shows the date a key expires on', async () => {
    renderList();

    expect(
      await screen.findByText(
        'apiTokenList.overview.expiresDate:2027-12-31T10:00:00.000Z'
      )
    ).toBeTruthy();
  });

  it('marks a key whose expiry has passed as expired, not active', async () => {
    listing({ ...apiToken, expiresAt: '2020-01-01T10:00:00.000Z' });
    renderList();

    expect(
      await screen.findByText('apiTokenList.overview.expired')
    ).toBeTruthy();
    expect(screen.queryByText('apiTokenList.overview.active')).toBeNull();
  });

  it('shows who a key belongs to when the reader may see everyone\u2019s', async () => {
    renderList(CanGetAllApiTokens.id);

    expect(await screen.findByText('Ada Lovelace')).toBeTruthy();
  });

  it('leaves the owner out when the reader only ever sees their own', async () => {
    renderList();

    await screen.findByText('Ginto import');

    expect(screen.queryByText('Ada Lovelace')).toBeNull();
    expect(screen.queryByText('apiTokenList.overview.owner')).toBeNull();
  });

  it('asks the api for only the keys of one status', async () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));
    fireEvent.mouseDown(
      screen.getByRole('combobox', { name: /overview.status/ })
    );
    fireEvent.click(await screen.findByText('apiTokenList.overview.revoked'));

    await waitFor(() =>
      expect(tokenVariables().status).toBe(ApiTokenStatus.Revoked)
    );
  });

  it('offers no creator filter to a reader who only sees their own', () => {
    renderList();

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));

    expect(
      screen.getByRole('combobox', { name: /overview.status/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('apiTokenList.overview.filterByOwner')
    ).toBeNull();
  });

  it('asks the api for one creator‘s keys', async () => {
    renderList(CanGetAllApiTokens.id);

    fireEvent.click(screen.getByRole('button', { name: /filter/i }));

    const picker = await screen.findByPlaceholderText(
      'apiTokenList.overview.filterByOwner'
    );

    fireEvent.mouseDown(picker);
    fireEvent.click(await screen.findByText(/Grace/));

    await waitFor(() => expect(tokenVariables().createdById).toBe('user-2'));
  });

  it('keeps a revoked key revoked even once it has expired', async () => {
    listing({
      ...apiToken,
      expiresAt: '2020-01-01T10:00:00.000Z',
      revokedAt: '2026-05-05T10:00:00.000Z',
    });
    renderList();

    expect(
      await screen.findByText('apiTokenList.overview.revoked')
    ).toBeTruthy();
    expect(screen.queryByText('apiTokenList.overview.expired')).toBeNull();
  });
});
