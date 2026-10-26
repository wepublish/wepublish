import { useMutation, useQuery } from '@apollo/client/react';
import { createTheme, ThemeProvider } from '@mui/material';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  ApiTokenListDocument,
  ApiTokenStatus,
  ExternalAppsDocument,
  ExternalAppsTarget,
  UpdateExternalAppDocument,
} from '@wepublish/editor/api';
import { CanGetApiTokens } from '@wepublish/permissions';
import { AuthContext } from '@wepublish/ui/editor';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Mock } from 'vitest';

import { ExternalAppsDashboard } from '../dashboard/externalAppsDashboard';
import { ExternalAppForm } from './externalAppForm';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
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
const mockedUseMutation = useMutation as unknown as Mock;

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

const otherKey = linkedKey({ id: 'key-2', name: 'Ginto import' });

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

let update: Mock;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  update = vi.fn(async () => ({ data: {} }));
  mockedUseMutation.mockImplementation((document: unknown) => [
    document === UpdateExternalAppDocument ? update : vi.fn(),
    { loading: false },
  ]);
  mockedUseQuery.mockImplementation((document: unknown) =>
    document === ApiTokenListDocument ?
      {
        data: { apiTokens: { nodes: [linkedKey(), otherKey], totalCount: 2 } },
        loading: false,
      }
    : { data: undefined, loading: false }
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('linking an external app to its API key', () => {
  it('offers the active API keys the editor may see', async () => {
    render(
      withPermissions(
        [CanGetApiTokens.id],
        <ExternalAppForm app={app() as never} />
      )
    );

    expect(mockedUseQuery).toHaveBeenCalledWith(
      ApiTokenListDocument,
      expect.objectContaining({
        variables: expect.objectContaining({ status: ApiTokenStatus.Active }),
      })
    );

    fireEvent.mouseDown(screen.getByLabelText('externalAppForm.apiKey'));
    const options = within(await screen.findByRole('listbox'));

    expect(options.getByText('externalAppForm.noApiKey')).toBeTruthy();
    expect(options.getByText(/nw-one-click-export/)).toBeTruthy();
    expect(options.getByText(/Ginto import/)).toBeTruthy();
  });

  it('saves the chosen API key with the app', async () => {
    render(
      withPermissions(
        [CanGetApiTokens.id],
        <ExternalAppForm app={app() as never} />
      )
    );

    fireEvent.mouseDown(screen.getByLabelText('externalAppForm.apiKey'));
    fireEvent.click(
      within(await screen.findByRole('listbox')).getByText(
        /nw-one-click-export/
      )
    );
    fireEvent.click(screen.getByText('externalAppForm.update'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          updateExternalAppId: 'app-1',
          apiTokenId: 'key-1',
        }),
      })
    );
  });

  it('unlinks the API key', async () => {
    render(
      withPermissions(
        [CanGetApiTokens.id],
        <ExternalAppForm app={app(linkedKey()) as never} />
      )
    );

    fireEvent.mouseDown(screen.getByLabelText('externalAppForm.apiKey'));
    fireEvent.click(
      within(await screen.findByRole('listbox')).getByText(
        'externalAppForm.noApiKey'
      )
    );
    fireEvent.click(screen.getByText('externalAppForm.update'));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({
        variables: expect.objectContaining({ apiTokenId: null }),
      })
    );
  });

  it('shows the linked key with its scopes and expiry', () => {
    render(
      withPermissions(
        [CanGetApiTokens.id],
        <ExternalAppForm app={app(linkedKey()) as never} />
      )
    );

    expect(
      screen.getByText(
        'externalAppForm.apiKeyDetails:prefix=wep_abcd1234,scopes=2,expiresAt=2027-10-23T00:00:00.000Z'
      )
    ).toBeTruthy();
  });

  it('warns on the edit page when the linked key expires soon', () => {
    render(
      withPermissions(
        [CanGetApiTokens.id],
        <ExternalAppForm
          app={
            app(linkedKey({ expiresAt: '2026-11-10T00:00:00.000Z' })) as never
          }
        />
      )
    );

    expect(
      screen.getByText(
        'externalApps.apiKey.expiresSoon:name=nw-one-click-export,expiresAt=2026-11-10T00:00:00.000Z'
      )
    ).toBeTruthy();
  });

  it('keeps the key untouched for editors who may not see API keys', async () => {
    render(withPermissions([], <ExternalAppForm app={app() as never} />));

    expect(screen.queryByLabelText('externalAppForm.apiKey')).toBeNull();
    expect(mockedUseQuery).not.toHaveBeenCalledWith(
      ApiTokenListDocument,
      expect.objectContaining({ skip: false })
    );

    fireEvent.click(screen.getByText('externalAppForm.update'));

    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0][0].variables).not.toHaveProperty('apiTokenId');
  });
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
