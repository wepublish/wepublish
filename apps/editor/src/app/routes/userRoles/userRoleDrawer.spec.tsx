import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type CreateUserRoleMutation,
  type CreateUserRoleMutationVariables,
  type FullUserRoleFragment,
  type UpdateUserRoleMutation,
  type UpdateUserRoleMutationVariables,
  type UserRoleListQuery,
  CreateUserRoleDocument,
  UpdateUserRoleDocument,
  UserRoleDocument,
  UserRoleListDocument,
} from '@wepublish/editor/api';
import {
  autocompleteOf,
  drawerClosed,
  getFieldByLabel,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  AllPermissions,
  CanCreateArticle,
  CanCreateUserRole,
  CanDeleteUserRole,
  CanGetArticles,
  CanGetUserRole,
  CanGetUserRoles,
  CanPublishArticle,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserRoleList } from './userRoleList';

const permission = (granted: Permission) => ({
  __typename: 'Permission' as const,
  ...granted,
});

const editorRole: FullUserRoleFragment = {
  __typename: 'UserRole',
  id: 'role-1',
  name: 'Redaktion',
  description: 'Schreibt und publiziert Artikel',
  systemRole: false,
  permissions: [permission(CanGetArticles), permission(CanCreateArticle)],
};

const guestRole: FullUserRoleFragment = {
  __typename: 'UserRole',
  id: 'role-2',
  name: 'Gast',
  description: null,
  systemRole: false,
  permissions: [],
};

const adminRole: FullUserRoleFragment = {
  __typename: 'UserRole',
  id: 'role-admin',
  name: 'Admin',
  description: 'Darf alles',
  systemRole: true,
  permissions: [permission(CanGetArticles)],
};

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'user-role-editor',
        name: 'user-role-editor',
        description: null,
        systemRole: false,
        permissions: permissions.map(permission),
      },
    ],
  },
});

const editor = sessionWith([
  CanGetUserRoles,
  CanGetUserRole,
  CanCreateUserRole,
  CanDeleteUserRole,
]);

const listRequests = vi.fn();
const created = vi.fn<(variables: CreateUserRoleMutationVariables) => void>();
const updated = vi.fn<(variables: UpdateUserRoleMutationVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: UserRoleListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: UserRoleListQuery = {
      __typename: 'Query',
      userRoles: {
        __typename: 'PaginatedUserRoles',
        nodes: [editorRole, guestRole, adminRole],
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        totalCount: 3,
      },
    };

    return { data };
  },
};

const userRoleMock = (
  userRole: FullUserRoleFragment
): MockLink.MockedResponse => ({
  request: { query: UserRoleDocument, variables: { id: userRole.id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { userRole } },
});

const createdRole: FullUserRoleFragment = {
  __typename: 'UserRole',
  id: 'role-new',
  name: 'Korrektorat',
  description: 'Liest gegen',
  systemRole: false,
  permissions: [permission(CanPublishArticle)],
};

const createMock: MockLink.MockedResponse = {
  request: { query: CreateUserRoleDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateUserRoleMutationVariables) => {
    created(JSON.parse(JSON.stringify(variables)));

    const data: CreateUserRoleMutation = {
      __typename: 'Mutation',
      createUserRole: createdRole,
    };

    return { data };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdateUserRoleDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateUserRoleMutationVariables) => {
    updated(JSON.parse(JSON.stringify(variables)));

    const data: UpdateUserRoleMutation = {
      __typename: 'Mutation',
      updateUserRole: { ...editorRole, name: variables.name ?? '' },
    };

    return { data };
  },
};

const defaultMocks = () => [
  listMock,
  userRoleMock(editorRole),
  userRoleMock(guestRole),
  userRoleMock(adminRole),
  userRoleMock(createdRole),
  createMock,
  updateMock,
];

const nameTakenMock = {
  request: { query: CreateUserRoleDocument, variables: () => true },
  result: {
    errors: [
      {
        message:
          '\nInvalid `this.prisma.userRole.create()` invocation in\n/app/dist/main.js:1:1\n\nUnique constraint failed on the constraint: `users.roles_name_key`',
      },
    ],
  },
} as MockLink.MockedResponse;

function BrowserBack() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      data-testid="browserBack"
      onClick={() => navigate(-1)}
    />
  );
}

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={session}>
      {children}
      <BrowserBack />
    </AuthContext.Provider>
  );

const renderUserRoles = (
  route: string,
  {
    mocks = defaultMocks(),
    session = editor,
  }: { mocks?: MockLink.MockedResponse[]; session?: AuthContextState } = {}
) =>
  renderFormRoutes(
    {
      '/userroles': <UserRoleList />,
      '/userroles/create': <UserRoleList />,
      '/userroles/edit/:id': <UserRoleList />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameLabel = 'userRoles.panels.name*';
const descriptionLabel = 'userRoles.panels.description';
const permissionsLabel = 'userRoles.panels.permissions';

const nameInput = () => getFieldByLabel(nameLabel);
const descriptionInput = () => getFieldByLabel(descriptionLabel);
const permissionsInput = () => getFieldByLabel(permissionsLabel);

const chips = () =>
  [
    ...autocompleteOf(permissionsInput()).querySelectorAll('.MuiChip-label'),
  ].map(chip => chip.textContent);

const loaded = (name = 'Redaktion') =>
  waitFor(() => expect(nameInput()).toHaveValue(name));

const drawerHeading = (name: string) =>
  within(drawer()).getByRole('heading', { level: 2, name });

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const listLink = (name: string) => screen.findByRole('link', { name });

const pickPermission = async (
  user: ReturnType<typeof renderUserRoles>['user'],
  description: string
) => {
  await user.click(permissionsInput());
  await user.type(permissionsInput(), description);
  await user.click(await screen.findByRole('option', { name: description }));
};

beforeEach(() => {
  listRequests.mockClear();
  created.mockClear();
  updated.mockClear();
});

describe('UserRoleDrawer', () => {
  it('opens the create drawer on /userroles/create', () => {
    renderUserRoles('/userroles/create');

    expect(drawerHeading('userRoles.panels.createUserRole')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(descriptionInput()).toHaveValue('');
    expect(
      within(drawer()).getByRole('heading', {
        level: 3,
        name: 'userRoles.panels.permissions',
      })
    ).toBeInTheDocument();
    expect(chips()).toEqual([]);
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
    expect(
      screen.queryByText('userRoles.panels.systemRole')
    ).not.toBeInTheDocument();
  });

  it('offers every permission by its description', async () => {
    const { user } = renderUserRoles('/userroles/create');

    await user.click(permissionsInput());

    const options = await screen.findAllByRole('option');

    expect(options).toHaveLength(AllPermissions.length);
    expect(options[0]).toHaveTextContent(AllPermissions[0].description);
  });

  it('creates with exact variables, refetches the list and stays on the new user role', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/create');

    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(1));
    await user.type(nameInput(), 'Korrektorat');
    await user.type(descriptionInput(), 'Liest gegen');
    await pickPermission(user, 'Allows to publish articles');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Korrektorat',
      description: 'Liest gegen',
      permissionIDs: ['CAN_PUBLISH_ARTICLE'],
    });
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() => expect(currentPath()).toBe('/userroles/edit/role-new'));
    await loaded('Korrektorat');
    expect(drawerHeading('userRoles.panels.editUserRole')).toBeInTheDocument();
    expect(chips()).toEqual(['Allows to publish articles']);
  });

  it('closes after save and close on create', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/create');

    await user.type(nameInput(), 'Korrektorat');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Korrektorat',
      description: '',
      permissionIDs: [],
    });
    await drawerClosed();
    expect(currentPath()).toBe('/userroles');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('requires a name', async () => {
    const { user } = renderUserRoles('/userroles/create');

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('form.errors.required')
    ).toBeInTheDocument();
    expect(created).not.toHaveBeenCalled();
  });

  it('shows a taken name under the name field', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/create', {
      mocks: [listMock, nameTakenMock],
    });

    await user.type(nameInput(), 'Redaktion');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('userRoles.panels.nameTaken')
    ).toBeInTheDocument();
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(screen.queryByText(/users\.roles_name_key/)).not.toBeInTheDocument();
    expect(currentPath()).toBe('/userroles/create');
  });

  it('opens the stored user role on /userroles/edit/:id', async () => {
    renderUserRoles('/userroles/edit/role-1');

    await loaded();

    expect(drawerHeading('userRoles.panels.editUserRole')).toBeInTheDocument();
    expect(descriptionInput()).toHaveValue('Schreibt und publiziert Artikel');
    expect(chips()).toEqual([
      'Allows to get all articles',
      'Allows to create articles',
    ]);
    expect(
      screen.queryByText('userRoles.panels.systemRole')
    ).not.toBeInTheDocument();
  });

  it('updates with exact variables, keeping the permission order, and closes after save and close', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/edit/role-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await pickPermission(user, 'Allows to delete articles');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      id: 'role-1',
      name: 'Redaktion neu',
      description: 'Schreibt und publiziert Artikel',
      permissionIDs: [
        'CAN_GET_ARTICLES',
        'CAN_CREATE_ARTICLE',
        'CAN_DELETE_ARTICLE',
      ],
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await drawerClosed();
    expect(currentPath()).toBe('/userroles');
  });

  it('stays open after save on edit', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/edit/role-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/userroles/edit/role-1');
    expect(nameInput()).toHaveValue('Redaktion neu');
  });

  it('removes a permission with Backspace', async () => {
    const { user } = renderUserRoles('/userroles/edit/role-1');

    await loaded();
    await user.click(permissionsInput());
    await user.keyboard('{Backspace}');
    await user.keyboard('{Escape}');

    expect(chips()).toEqual(['Allows to get all articles']);
  });

  it('sends an empty description for a role without one', async () => {
    const { user } = renderUserRoles('/userroles/edit/role-2');

    await loaded('Gast');
    expect(descriptionInput()).toHaveValue('');
    await user.type(nameInput(), 'e');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      id: 'role-2',
      name: 'Gaste',
      description: '',
      permissionIDs: [],
    });
  });

  it('keeps a system role read-only and says why', async () => {
    renderUserRoles('/userroles/edit/role-admin');

    await loaded('Admin');

    expect(
      within(drawer()).getByText('userRoles.panels.systemRole')
    ).toBeInTheDocument();
    expect(
      within(drawer()).getByText('form.view.readOnly')
    ).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(descriptionInput()).toBeDisabled();
    expect(permissionsInput()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('is read-only without CanCreateUserRole', async () => {
    renderUserRoles('/userroles/edit/role-1', {
      session: sessionWith([CanGetUserRoles, CanGetUserRole]),
    });

    await loaded();

    expect(
      within(drawer()).getByText('form.view.readOnly')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('userRoles.panels.systemRole')
    ).not.toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(permissionsInput()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('shows no fields while the user role loads', () => {
    renderUserRoles('/userroles/edit/role-1');

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('shows a load error with a retry', async () => {
    const { user } = renderUserRoles('/userroles/edit/role-1', {
      mocks: [
        listMock,
        {
          request: { query: UserRoleDocument, variables: { id: 'role-1' } },
          error: new Error('User role offline'),
        },
        userRoleMock(editorRole),
      ],
    });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'form.loadError.retry' })
    );

    await loaded();
  });

  it('closes a clean drawer on Escape without asking', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/edit/role-1');

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/userroles');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before the close button discards changes', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/edit/role-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/userroles/edit/role-1');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/userroles');
    expect(updated).not.toHaveBeenCalled();
  });

  it('reopens after a close and never shows the previous user role', async () => {
    const { user, currentPath } = renderUserRoles('/userroles/edit/role-admin');

    await loaded('Admin');
    await user.keyboard('{Escape}');
    await drawerClosed();

    await user.click(await listLink('Redaktion'));

    expect(currentPath()).toBe('/userroles/edit/role-1');
    expect(
      screen
        .queryAllByLabelText<HTMLInputElement>(nameLabel, {
          selector: 'input',
        })
        .map(input => input.value)
    ).not.toContain('Admin');
    await loaded();
    expect(nameInput()).toBeEnabled();
    expect(
      screen.queryByText('userRoles.panels.systemRole')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
  });

  it('closes on browser Back', async () => {
    const { user, currentPath } = renderUserRoles('/userroles');

    await user.click(await listLink('Redaktion'));
    await loaded();
    fireEvent.click(screen.getByTestId('browserBack'));

    await waitFor(() => expect(currentPath()).toBe('/userroles'));
    await drawerClosed();
  });
});
