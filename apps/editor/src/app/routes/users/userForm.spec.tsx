import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import {
  type CreateUserMutationVariables,
  type FullUserFragment,
  type FullUserRoleFragment,
  type UpdateUserMutationVariables,
  AccountCreationMailDocument,
  CreateUserDocument,
  MailLogsDocument,
  MailTemplateDocument,
  UpdateUserDocument,
  UserDocument,
  UserEvent,
  UserRoleListDocument,
  UserSubscriptionListDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
  userFixture,
} from '@wepublish/form/editor/testing';
import { AllPermissions } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';

import { UserCreateView } from './userCreateView';
import { UserEditView } from './userEditView';

type Mock = MockLink.MockedResponse;

const anyVariables = () => true;

const role = (id: string, name: string): FullUserRoleFragment => ({
  __typename: 'UserRole',
  id,
  name,
  description: null,
  systemRole: false,
  permissions: [],
});

const editorRole = role('role-editor', 'Editor');
const adminRole = role('role-admin', 'Admin');

const admin: AuthContextState = {
  session: {
    email: 'admin@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        ...role('admin', 'admin'),
        permissions: AllPermissions.map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
};

function Admin({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={admin}>{children}</AuthContext.Provider>;
}

const stored: FullUserFragment = {
  ...userFixture('user-1', 'Max', 'Muster', 'max@example.com'),
  birthday: '1990-05-01T00:00:00.000Z',
  emailVerifiedAt: '2024-01-01T00:00:00.000Z',
  address: {
    __typename: 'UserAddress',
    company: null,
    streetAddress: 'Hauptstrasse',
    streetAddressNumber: '1',
    streetAddress2: null,
    streetAddress2Number: null,
    zipCode: '8000',
    city: 'Zürich',
    country: 'Schweiz',
  },
  properties: [
    { __typename: 'Property', key: 'source', value: 'import', public: false },
  ],
  roles: [editorRole],
};

const updated = vi.fn<(variables: UpdateUserMutationVariables) => void>();
const created = vi.fn<(variables: CreateUserMutationVariables) => void>();

const userMock = (user: FullUserFragment): Mock => ({
  request: { query: UserDocument, variables: anyVariables },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { __typename: 'Query', user } },
});

const panelMocks: Mock[] = [
  {
    request: { query: UserRoleListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        __typename: 'Query',
        userRoles: {
          __typename: 'PaginatedUserRoles',
          nodes: [editorRole, adminRole],
          pageInfo: {
            __typename: 'PageInfo',
            startCursor: null,
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          totalCount: 2,
        },
      },
    },
  },
  {
    request: { query: UserSubscriptionListDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        __typename: 'Query',
        subscriptions: { __typename: 'PaginatedSubscriptions', nodes: [] },
      },
    },
  },
  {
    request: { query: MailTemplateDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data: { __typename: 'Query', mailTemplates: [] } },
  },
  {
    request: { query: MailLogsDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        __typename: 'Query',
        mailLogs: {
          __typename: 'PaginatedMailLogs',
          nodes: [],
          pageInfo: {
            __typename: 'PageInfo',
            startCursor: null,
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: false,
          },
          totalCount: 0,
        },
      },
    },
  },
  {
    request: { query: AccountCreationMailDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        __typename: 'Query',
        accountCreationMail: {
          __typename: 'ActionMail',
          event: UserEvent.AccountCreation,
          recipientEmail: null,
          mailTemplateId: 'template-1',
          mailTemplateName: 'Willkommen',
          noMailReason: null,
        },
      },
    },
  },
  {
    request: { query: UpdateUserDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: UpdateUserMutationVariables) => {
      updated(JSON.parse(JSON.stringify(variables)));

      return {
        data: { __typename: 'Mutation', updateUser: stored },
      };
    },
  },
  {
    request: { query: CreateUserDocument, variables: anyVariables },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: CreateUserMutationVariables) => {
      created(JSON.parse(JSON.stringify(variables)));

      return {
        data: {
          __typename: 'Mutation',
          createUser: { ...stored, id: 'user-new' },
        },
      };
    },
  },
];

const routes = {
  '/users/create': <UserCreateView />,
  '/users/edit/:id': <UserEditView />,
};

const renderEdit = (user: FullUserFragment = stored) =>
  renderFormRoutes(routes, {
    route: `/users/edit/${user.id}`,
    wrapper: Admin,
    mocks: [userMock(user), ...panelMocks],
  });

const renderCreate = () =>
  renderFormRoutes(routes, {
    route: '/users/create',
    wrapper: Admin,
    mocks: panelMocks,
  });

const field = (label: RegExp) => getFieldByLabel(label);
const save = () => screen.getByTestId('saveButton');
const saveAndClose = () => screen.getByTestId('saveAndCloseButton');
const name = () => field(/^userCreateOrEditView\.name/);
const email = () => field(/^userCreateOrEditView\.email/);
const password = () => field(/^userCreateOrEditView\.password/);
const country = () => field(/^userCreateOrEditView\.country/);
const roles = () => field(/^userCreateOrEditView\.userRoles/);

const emptyAddress = {
  company: '',
  streetAddress: '',
  streetAddressNumber: '',
  streetAddress2: '',
  streetAddress2Number: '',
  zipCode: '',
  city: '',
  country: '',
};

const storedVariables = {
  id: 'user-1',
  name: 'Muster',
  firstName: 'Max',
  note: '',
  flair: '',
  birthday: '1990-05-01T00:00:00.000Z',
  email: 'max@example.com',
  emailVerifiedAt: '2024-01-01T00:00:00.000Z',
  active: true,
  userImageID: null,
  roleIDs: ['role-editor'],
  properties: [{ key: 'source', public: false, value: 'import' }],
  address: {
    ...emptyAddress,
    streetAddress: 'Hauptstrasse',
    streetAddressNumber: '1',
    zipCode: '8000',
    city: 'Zürich',
    country: 'Schweiz',
  },
};

const fillCreate = async (user: ReturnType<typeof renderCreate>['user']) => {
  await user.type(name(), 'Muster');
  await user.type(email(), 'max@example.com');
  await user.type(password(), 'a-long-password');
};

beforeEach(() => {
  updated.mockClear();
  created.mockClear();
});

describe('user form', () => {
  it('loads the user and saves the exact update variables', async () => {
    const { user } = renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    await user.clear(name());
    await user.type(name(), 'Muster-Neu');
    await user.click(save());

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      ...storedVariables,
      name: 'Muster-Neu',
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
  });

  it('shows the full name in the edit title', async () => {
    renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    expect(
      screen.getByRole('heading', { name: 'userCreateOrEditView.editTitle' })
    ).toBeInTheDocument();
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    await user.click(saveAndClose());

    await waitFor(() => expect(currentPath()).toBe('/users'));
    expect(updated).toHaveBeenCalledTimes(1);
  });

  it('saves a user without an address', async () => {
    const { user } = renderEdit({ ...stored, address: null });

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    await user.click(save());

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0].address).toStrictEqual(emptyAddress);
  });

  it('adds a role by id and keeps the assigned ones', async () => {
    const { user } = renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    expect(
      within(roles().closest('.MuiAutocomplete-root') as HTMLElement).getByText(
        'Editor'
      )
    ).toBeInTheDocument();

    await user.click(roles());
    await user.click(await screen.findByRole('option', { name: 'Admin' }));
    await user.click(save());

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0].roleIDs).toStrictEqual([
      'role-editor',
      'role-admin',
    ]);
  });

  it('adds a public property row', async () => {
    const { user } = renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    await user.click(
      screen.getByRole('button', { name: 'userCreateOrEditView.addProperty' })
    );

    const keys = screen.getAllByLabelText<HTMLInputElement>(
      /^articleEditor\.panels\.key/,
      { selector: 'input' }
    );
    const values = screen.getAllByLabelText<HTMLInputElement>(
      /^articleEditor\.panels\.value/,
      { selector: 'input' }
    );

    await user.type(keys[1], 'newsletter');
    await user.type(values[1], 'yes');
    await user.click(save());

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0].properties).toStrictEqual([
      { key: 'source', public: false, value: 'import' },
      { key: 'newsletter', public: true, value: 'yes' },
    ]);
  });

  it('puts the record panels in their own sections on edit', async () => {
    renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    expect(
      screen.getByRole('region', {
        name: 'userCreateOrEditView.subscriptionsHeader',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('userMail.title').getByRole('combobox', {
        name: 'userMail.selectTemplate',
      })
    ).toBeInTheDocument();

    const access = formSectionOf('userCreateOrEditView.passwordHeader');

    expect(
      access.getByRole('checkbox', { name: /^userCreateOrEditView\.active/ })
    ).toBeChecked();
    expect(
      await access.findByRole('button', {
        name: 'userCreateOrEditView.resetPassword',
      })
    ).toBeInTheDocument();
    expect(
      access.getByRole('heading', { name: 'userCreateOrEditView.totpHeader' })
    ).toBeInTheDocument();
    expect(
      access.queryByLabelText(/^userCreateOrEditView\.password/)
    ).not.toBeInTheDocument();
  });

  it('asks before leaving a dirty edit page through the back link', async () => {
    const { user } = renderEdit();

    await waitFor(() => expect(name()).toHaveValue('Muster'));
    await user.type(name(), 'x');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
  });

  it('starts an active user with a required password and no record panels', () => {
    renderCreate();

    expect(
      screen.getByRole('heading', { name: 'userCreateOrEditView.createNewUser' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^userCreateOrEditView\.active/ })
    ).toBeChecked();
    expect(password()).toHaveAttribute('type', 'password');
    expect(
      screen.queryByRole('region', {
        name: 'userCreateOrEditView.subscriptionsHeader',
      })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'userMail.title' })
    ).not.toBeInTheDocument();
  });

  it('shows required and length errors on create', async () => {
    const { user } = renderCreate();

    await user.type(password(), 'short');
    await user.click(save());

    expect(
      await screen.findByText('errorMessages.passwordTooShortErrorMessage')
    ).toBeInTheDocument();
    expect(name()).toHaveAccessibleDescription('form.errors.required');
    expect(email()).toHaveAccessibleDescription('form.errors.required');
    expect(created).not.toHaveBeenCalled();
  });

  it('creates a user without a country after the mail question', async () => {
    const { user, currentPath } = renderCreate();

    await fillCreate(user);
    await user.click(save());
    await user.click(
      await screen.findByRole('button', { name: 'actionMail.skip' })
    );

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Muster',
      firstName: '',
      note: '',
      flair: '',
      email: 'max@example.com',
      emailVerifiedAt: null,
      active: true,
      properties: [],
      roleIDs: [],
      address: emptyAddress,
      userImageID: null,
      password: 'a-long-password',
      skipMail: true,
    });
    await waitFor(() => expect(currentPath()).toBe('/users/edit/user-new'));
  });

  it('picks the country from a searchable list', async () => {
    const { user } = renderCreate();

    await fillCreate(user);
    await user.type(country(), 'Schwei');
    await user.click(await screen.findByRole('option', { name: 'Schweiz' }));
    await user.click(save());
    await user.click(
      await screen.findByRole('button', { name: 'actionMail.skip' })
    );

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0].address).toStrictEqual({
      ...emptyAddress,
      country: 'Schweiz',
    });
  });

  it('creates nothing and stays when the mail question is cancelled', async () => {
    const { user, currentPath } = renderCreate();

    await fillCreate(user);
    await user.click(save());
    await screen.findByRole('button', { name: 'actionMail.skip' });
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByText('actionMail.title')).not.toBeInTheDocument()
    );
    expect(created).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/users/create');
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(name()).toHaveValue('Muster');
  });
});
