import { InMemoryCache } from '@apollo/client';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type CreateTokenMutation,
  type CreateTokenMutationVariables,
  type TokenListQuery,
  CreateTokenDocument,
  possibleTypes,
  TokenListDocument,
} from '@wepublish/editor/api';
import { drawerClosed, renderFormRoutes } from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanCreateToken,
  CanDeleteToken,
  CanGetTokens,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { TokenList } from './tokenList';

const permission = (granted: Permission) => ({
  __typename: 'Permission' as const,
  ...granted,
});

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
        permissions: [CanCreateToken, CanGetTokens, CanDeleteToken].map(
          permission
        ),
      },
    ],
  },
};

const listRequests = vi.fn();
const created = vi.fn<(variables: CreateTokenMutationVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: TokenListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: TokenListQuery = {
      __typename: 'Query',
      tokens: [{ __typename: 'Token', id: 'token-1', name: 'Partnerverlag' }],
    };

    return { data };
  },
};

const createMock: MockLink.MockedResponse = {
  request: { query: CreateTokenDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateTokenMutationVariables) => {
    created(JSON.parse(JSON.stringify(variables)));

    const data: CreateTokenMutation = {
      __typename: 'Mutation',
      createToken: {
        __typename: 'TokenWithSecret',
        id: 'token-2',
        name: variables.name,
        token: 'peering-secret',
      },
    };

    return { data };
  },
};

const nameTakenMock = {
  request: { query: CreateTokenDocument, variables: () => true },
  result: {
    errors: [
      {
        message:
          '\nInvalid `this.prisma.token.create()` invocation in\n/app/dist/main.js:1:1\n\nUnique constraint failed on the constraint: `tokens_name_key`',
      },
    ],
  },
} as MockLink.MockedResponse;

const failingCreateMock = {
  request: { query: CreateTokenDocument, variables: () => true },
  result: { errors: [{ message: 'Token service offline' }] },
} as MockLink.MockedResponse;

const defaultMocks = () => [listMock, createMock];

const withApi =
  (mocks: MockLink.MockedResponse[]) =>
  ({ children }: { children: ReactNode }) => (
    <MockedProvider
      mocks={mocks}
      cache={
        new InMemoryCache({ possibleTypes: possibleTypes.possibleTypes })
      }
    >
      <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
    </MockedProvider>
  );

const renderTokens = (
  route: string,
  mocks: MockLink.MockedResponse[] = defaultMocks()
) =>
  renderFormRoutes(
    { '/tokens': <TokenList />, '/tokens/generate': <TokenList /> },
    { route, wrapper: withApi(mocks) }
  );

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameInput = () =>
  within(drawer()).getByRole('textbox', { name: 'tokenList.panels.name*' });

const generateButton = () => within(drawer()).getByTestId('saveButton');

const errorUnder = (input: HTMLElement) =>
  document.getElementById(input.getAttribute('aria-describedby') ?? '')
    ?.textContent;

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const generate = async (
  user: ReturnType<typeof renderTokens>['user'],
  name: string
) => {
  await user.type(nameInput(), name);
  await user.click(generateButton());
};

beforeEach(() => {
  listRequests.mockClear();
  created.mockClear();
});

describe('TokenGenerateDrawer', () => {
  it('stays shut on the plain list route', async () => {
    renderTokens('/tokens');

    expect(await screen.findByText('Partnerverlag')).toBeInTheDocument();
    expect(drawer()).toBeNull();
  });

  it('opens on /tokens/generate with an empty name', () => {
    renderTokens('/tokens/generate');

    expect(
      screen.getByRole('dialog', { name: 'tokenList.panels.generateToken' })
    ).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(generateButton()).toHaveTextContent('tokenList.panels.generate');
    expect(generateButton()).toBeEnabled();
    expect(
      within(drawer()).queryByTestId('saveAndCloseButton')
    ).not.toBeInTheDocument();
  });

  it('requires a name', async () => {
    const { user } = renderTokens('/tokens/generate');

    await user.click(generateButton());

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(errorUnder(nameInput())).toBe('form.errors.required');
    expect(created).not.toHaveBeenCalled();
  });

  it('shows a taken name under the name field', async () => {
    const { user, currentPath } = renderTokens('/tokens/generate', [
      listMock,
      nameTakenMock,
    ]);

    await generate(user, 'Partnerverlag');

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(errorUnder(nameInput())).toBe('tokenList.panels.nameTaken');
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(screen.queryByText(/tokens_name_key/)).not.toBeInTheDocument();
    expect(currentPath()).toBe('/tokens/generate');
  });

  it('creates with exact variables, refetches the list and shows the token once', async () => {
    const { user, currentPath } = renderTokens('/tokens/generate');

    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(1));
    await generate(user, 'Partnerverlag Thun');

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Partnerverlag Thun',
    });
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));

    expect(
      await within(drawer()).findByText('tokenList.panels.creationSuccess')
    ).toBeInTheDocument();
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();

    const secret = within(drawer()).getByText('peering-secret');

    expect(secret.closest('[data-sentry-mask]')).not.toBeNull();
    expect(
      within(drawer()).getByText('tokenList.panels.tokenWarning')
    ).toBeInTheDocument();
    expect(within(drawer()).queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(within(drawer()).queryByRole('textbox')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/tokens/generate');
  });

  it('copies the token to the clipboard', async () => {
    const { user } = renderTokens('/tokens/generate');

    await generate(user, 'Partnerverlag Thun');
    await user.click(
      await within(drawer()).findByRole('button', {
        name: 'tokenList.panels.copy',
      })
    );

    expect(await navigator.clipboard.readText()).toBe('peering-secret');
    expect(await screen.findByText('tokenList.panels.copied')).toBeInTheDocument();
  });

  it('opens empty again after the token was shown and the drawer closed', async () => {
    const { user, currentPath } = renderTokens('/tokens/generate');

    await generate(user, 'Partnerverlag Thun');
    await within(drawer()).findByText('peering-secret');
    await user.click(screen.getByRole('button', { name: 'close' }));

    await drawerClosed();
    expect(currentPath()).toBe('/tokens');
    expect(discardPrompt()).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: 'tokenList.overview.generateToken' })
    );

    expect(nameInput()).toHaveValue('');
    expect(screen.queryByText('peering-secret')).not.toBeInTheDocument();
  });

  it('reports a server error and keeps the form', async () => {
    const { user, currentPath } = renderTokens('/tokens/generate', [
      listMock,
      failingCreateMock,
    ]);

    await generate(user, 'Partnerverlag Thun');

    expect(await screen.findByText('Token service offline')).toBeInTheDocument();
    expect(
      within(drawer()).getByText('form.errors.server')
    ).toBeInTheDocument();
    expect(nameInput()).toHaveValue('Partnerverlag Thun');
    expect(currentPath()).toBe('/tokens/generate');
  });

  it('goes back to the list when a clean drawer is closed', async () => {
    const { user, currentPath } = renderTokens('/tokens/generate');

    await user.click(screen.getByRole('button', { name: 'close' }));

    await drawerClosed();
    expect(currentPath()).toBe('/tokens');
  });

  it('asks before closing a drawer with a typed name', async () => {
    const { user, currentPath } = renderTokens('/tokens/generate');

    await user.type(nameInput(), 'Partnerverlag');
    await user.keyboard('{Escape}');

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/tokens/generate');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/tokens');
    expect(created).not.toHaveBeenCalled();
  });
});
