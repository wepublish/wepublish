import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type ApiTokenListQuery,
  type CreateApiTokenMutation,
  type CreateApiTokenMutationVariables,
  type FullApiTokenFragment,
  ApiTokenListDocument,
  CreateApiTokenDocument,
} from '@wepublish/editor/api';
import {
  autocompleteOf,
  drawerClosed,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  AllPermissions,
  CanCreateApiToken,
  CanGetApiTokens,
  CanGetArticle,
  CanRevokeApiToken,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';

import { ApiTokenGenerateRoute } from './apiTokenGenerateRoute';
import { ApiTokenList } from './apiTokenList';

const permission = (granted: Permission) => ({
  __typename: 'Permission' as const,
  ...granted,
});

const held = [CanCreateApiToken, CanGetApiTokens, CanRevokeApiToken, CanGetArticle];

const session: AuthContextState = {
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'role-editor',
        name: 'role-editor',
        description: null,
        systemRole: false,
        permissions: held.map(permission),
      },
    ],
  },
};

const listRequests = vi.fn();
const created = vi.fn<(variables: CreateApiTokenMutationVariables) => void>();

const storedToken: FullApiTokenFragment = {
  __typename: 'ApiToken',
  id: 'api-token-1',
  createdAt: '2026-01-02T10:00:00.000Z',
  modifiedAt: '2026-01-02T10:00:00.000Z',
  name: 'Ginto import',
  prefix: 'wep_abcd1234',
  scopes: ['CAN_GET_ARTICLE'],
  expiresAt: '2027-12-31T10:00:00.000Z',
  revokedAt: null,
  lastUsedAt: null,
  createdById: 'user-1',
  createdBy: { __typename: 'User', id: 'user-1', name: 'Ada Lovelace' },
};

const listMock: MockLink.MockedResponse = {
  request: { query: ApiTokenListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: ApiTokenListQuery = {
      __typename: 'Query',
      apiTokens: {
        __typename: 'PaginatedApiTokens',
        nodes: [storedToken],
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 1,
      },
    };

    return { data };
  },
};

const createMock: MockLink.MockedResponse = {
  request: { query: CreateApiTokenDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateApiTokenMutationVariables) => {
    created(JSON.parse(JSON.stringify(variables)));

    const data: CreateApiTokenMutation = {
      __typename: 'Mutation',
      createApiToken: {
        __typename: 'CreatedApiToken',
        token: 'wep_abcd1234_secret',
        apiToken: { ...storedToken, name: variables.name },
      },
    };

    return { data };
  },
};

const failingCreateMock = {
  request: { query: CreateApiTokenDocument, variables: () => true },
  result: { errors: [{ message: 'Rate limit reached' }] },
} as MockLink.MockedResponse;

const defaultMocks = () => [listMock, createMock];

function ApiTokenRoutes() {
  return (
    <Routes>
      <Route element={<ApiTokenList />}>
        <Route
          index
          element={null}
        />
        <Route
          path="generate"
          element={<ApiTokenGenerateRoute />}
        />
      </Route>
    </Routes>
  );
}

function WithSession({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

const renderApiTokens = (
  route: string,
  mocks: MockLink.MockedResponse[] = defaultMocks()
) =>
  renderFormRoutes(
    { '/api-tokens/*': <ApiTokenRoutes /> },
    { route, mocks, wrapper: WithSession }
  );

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameInput = () =>
  within(drawer()).getByRole('textbox', { name: 'apiTokenList.panels.name*' });

const scopesInput = () =>
  within(drawer()).getByRole('combobox', {
    name: 'apiTokenList.panels.scopes',
  });

const expiryInput = () =>
  within(drawer()).getByRole('textbox', {
    name: /^apiTokenList\.panels\.expiresAt\*/,
  });

const generateButton = () => within(drawer()).getByTestId('saveButton');

const errorUnder = (input: HTMLElement) =>
  document.getElementById(input.getAttribute('aria-describedby') ?? '')
    ?.textContent;

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const asTyped = (date: Date) =>
  [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear(),
  ].join('.');

const daysFromNow = (days: number) => {
  const day = new Date();
  day.setDate(day.getDate() + days);

  return day;
};

const endOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);

  return day;
};

const typeExpiry = async (date: Date) => {
  fireEvent.change(expiryInput(), { target: { value: asTyped(date) } });

  await waitFor(() => expect(expiryInput()).toHaveValue(asTyped(date)));
};

const pickScope = async (
  user: ReturnType<typeof renderApiTokens>['user'],
  description: string
) => {
  await user.click(scopesInput());
  await user.click(await screen.findByRole('option', { name: description }));
  await user.tab();
};

const fillValidToken = async (
  user: ReturnType<typeof renderApiTokens>['user']
) => {
  await user.type(nameInput(), 'Ginto import');
  await pickScope(user, CanGetArticle.description);
  await typeExpiry(daysFromNow(60));
};

beforeEach(() => {
  listRequests.mockClear();
  created.mockClear();
});

describe('ApiTokenGenerateRoute', () => {
  it('opens on /api-tokens/generate with a name, the permissions and an expiry', async () => {
    renderApiTokens('/api-tokens/generate');

    expect(
      screen.getByRole('dialog', { name: 'apiTokenList.panels.generateToken' })
    ).toBeInTheDocument();
    expect(
      within(drawer()).getByRole('heading', {
        level: 3,
        name: 'apiTokenList.panels.scopes',
      })
    ).toBeInTheDocument();
    expect(generateButton()).toHaveTextContent('apiTokenList.panels.generate');
    expect(generateButton()).toBeEnabled();
    expect(
      within(drawer()).queryByTestId('saveAndCloseButton')
    ).not.toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(scopesInput()).toHaveValue('');
    expect(scopesInput()).toBeRequired();
    expect(expiryInput()).toHaveValue('');
    expect(
      within(drawer()).getByText('apiTokenList.panels.scopesHelp')
    ).toBeInTheDocument();
    expect(
      within(drawer()).getByText('apiTokenList.panels.expiresAtHelp')
    ).toBeInTheDocument();
  });

  it('offers only the permissions its creator holds, by their description', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');

    await user.click(scopesInput());

    await waitFor(async () =>
      expect(
        (await screen.findAllByRole('option')).map(option => option.textContent)
      ).toEqual(
        AllPermissions.filter(granted => held.includes(granted)).map(
          granted => granted.description
        )
      )
    );
  });

  it('creates with exact variables, refetches the list and shows the key once', async () => {
    const { user, currentPath } = renderApiTokens('/api-tokens/generate');

    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(1));
    await fillValidToken(user);
    await user.click(generateButton());

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Ginto import',
      scopes: ['CAN_GET_ARTICLE'],
      expiresAt: endOfDay(daysFromNow(60)).toISOString(),
    });
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));

    expect(
      await within(drawer()).findByText('apiTokenList.panels.creationSuccess')
    ).toBeInTheDocument();
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    expect(
      within(drawer()).getByText('wep_abcd1234_secret')
    ).toBeInTheDocument();
    expect(
      within(drawer()).getByText('apiTokenList.panels.tokenWarning')
    ).toBeInTheDocument();
    expect(within(drawer()).queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(
      within(drawer()).queryByRole('textbox', {
        name: 'apiTokenList.panels.name*',
      })
    ).not.toBeInTheDocument();
    expect(currentPath()).toBe('/api-tokens/generate');
  });

  it('closes after the key is shown without asking to discard', async () => {
    const { user, currentPath } = renderApiTokens('/api-tokens/generate');

    await fillValidToken(user);
    await user.click(generateButton());
    await within(drawer()).findByText('wep_abcd1234_secret');
    await user.click(screen.getByRole('button', { name: 'close' }));

    await waitFor(() => expect(currentPath()).toBe('/api-tokens'));
    expect(discardPrompt()).not.toBeInTheDocument();
    await drawerClosed();
  });

  it('copies the key to the clipboard', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');

    await fillValidToken(user);
    await user.click(generateButton());

    await user.click(
      await within(drawer()).findByRole('button', {
        name: 'apiTokenList.panels.copy',
      })
    );

    expect(await navigator.clipboard.readText()).toBe('wep_abcd1234_secret');
    expect(
      await screen.findByText('apiTokenList.panels.copied')
    ).toBeInTheDocument();
  });

  it('requires a name, a permission and an expiry', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');

    await user.click(generateButton());

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(errorUnder(nameInput())).toBe('form.errors.required');
    expect(scopesInput()).toHaveAttribute('aria-invalid', 'true');
    expect(errorUnder(scopesInput())).toBe('form.errors.required');
    expect(expiryInput()).toHaveAttribute('aria-invalid', 'true');
    expect(errorUnder(expiryInput())).toBe('form.errors.required');
    expect(created).not.toHaveBeenCalled();
  });

  it('refuses an expiry that has already passed', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');

    await user.type(nameInput(), 'Stale');
    await pickScope(user, CanGetArticle.description);
    await typeExpiry(new Date(2020, 0, 1));
    await user.click(generateButton());

    expect(
      await within(drawer()).findByText('apiTokenList.panels.expiresInThePast')
    ).toBeInTheDocument();
    expect(created).not.toHaveBeenCalled();
  });

  it('refuses an expiry more than three years out', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');
    const tooLate = new Date();

    tooLate.setFullYear(tooLate.getFullYear() + 3);
    tooLate.setDate(tooLate.getDate() + 7);

    await user.type(nameInput(), 'Too long');
    await pickScope(user, CanGetArticle.description);
    await typeExpiry(tooLate);
    await user.click(generateButton());

    expect(
      await within(drawer()).findByText('apiTokenList.panels.expiresTooLate')
    ).toBeInTheDocument();
    expect(created).not.toHaveBeenCalled();
  });

  it('keeps its shortcuts inside the calendar and closes it from Done', async () => {
    renderApiTokens('/api-tokens/generate');

    expect(
      screen.queryByRole('button', { name: 'apiTokenList.panels.in90Days' })
    ).not.toBeInTheDocument();

    fireEvent.focus(expiryInput());

    expect(
      screen.getByRole('button', { name: 'apiTokenList.panels.in90Days' })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'dateTimePicker.done' })
    );

    expect(
      screen.queryByRole('button', { name: 'apiTokenList.panels.in90Days' })
    ).not.toBeInTheDocument();
  });

  it('sets the expiry from a shortcut, to the end of that day', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');

    await user.type(nameInput(), 'Ninety days');
    await pickScope(user, CanGetArticle.description);
    fireEvent.focus(expiryInput());
    fireEvent.click(
      screen.getByRole('button', { name: 'apiTokenList.panels.in90Days' })
    );
    await user.click(generateButton());

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0].expiresAt).toBe(
      endOfDay(daysFromNow(90)).toISOString()
    );
  });

  it('warns about a key that outlives a year, and not about a shorter one', async () => {
    renderApiTokens('/api-tokens/generate');

    fireEvent.focus(expiryInput());
    fireEvent.click(
      screen.getByRole('button', { name: 'apiTokenList.panels.in90Days' })
    );

    await waitFor(() => expect(expiryInput()).not.toHaveValue(''));
    expect(
      screen.queryByText('apiTokenList.panels.longLivedWarning')
    ).not.toBeInTheDocument();

    fireEvent.focus(expiryInput());
    fireEvent.click(
      screen.getByRole('button', { name: 'apiTokenList.panels.in3Years' })
    );

    expect(
      await screen.findByText('apiTokenList.panels.longLivedWarning')
    ).toBeInTheDocument();
  });

  it('reports a server error as a toast and an inline alert, and keeps the form', async () => {
    const { user, currentPath } = renderApiTokens('/api-tokens/generate', [
      listMock,
      failingCreateMock,
    ]);

    await fillValidToken(user);
    await user.click(generateButton());

    expect(await screen.findByText('Rate limit reached')).toBeInTheDocument();
    expect(
      within(drawer()).getByText('form.errors.server')
    ).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Ginto import');
    expect(generateButton()).toBeInTheDocument();
    expect(currentPath()).toBe('/api-tokens/generate');
  });

  it('goes back to the list when a clean drawer is closed', async () => {
    const { user, currentPath } = renderApiTokens('/api-tokens/generate');

    await user.click(screen.getByRole('button', { name: 'close' }));

    await waitFor(() => expect(currentPath()).toBe('/api-tokens'));
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before closing a drawer with a typed name', async () => {
    const { user, currentPath } = renderApiTokens('/api-tokens/generate');

    await user.type(nameInput(), 'Ginto import');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/api-tokens/generate');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/api-tokens'));
    expect(created).not.toHaveBeenCalled();
  });

  it('removes a permission with Backspace', async () => {
    const { user } = renderApiTokens('/api-tokens/generate');

    await pickScope(user, CanGetArticle.description);
    await user.click(scopesInput());
    await user.keyboard('{Backspace}');

    expect(
      autocompleteOf(scopesInput()).querySelectorAll('.MuiChip-root')
    ).toHaveLength(0);
  });
});
