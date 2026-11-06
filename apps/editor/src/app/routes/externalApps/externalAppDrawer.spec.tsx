import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type ApiTokenListQuery,
  type CreateExternalAppMutation,
  type CreateExternalAppMutationVariables,
  type DeleteExternalAppMutationVariables,
  type ExternalAppApiTokenFragment,
  type ExternalAppFragment,
  type ExternalAppQuery,
  type ExternalAppsQuery,
  type FullApiTokenFragment,
  type UpdateExternalAppMutation,
  type UpdateExternalAppMutationVariables,
  ApiTokenListDocument,
  ApiTokenStatus,
  CreateExternalAppDocument,
  DeleteExternalAppDocument,
  ExternalAppDocument,
  ExternalAppsDocument,
  ExternalAppsTarget,
  UpdateExternalAppDocument,
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
  CanCreateExternalApp,
  CanDeleteExternalApp,
  CanGetApiTokens,
  CanUpdateExternalApp,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { ExternalApps } from './externalAppsEdit';

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        externalAppForm: {
          apiKeyOption: '{{name}} ({{prefix}}…)',
          apiKeyDetails: '{{prefix}}… · {{scopes}} permissions',
        },
        externalApps: {
          apiKey: {
            expiresSoon: 'The API key “{{name}}” expires soon',
            expired: 'The API key “{{name}}” has expired',
          },
        },
      },
    },
  },
});

const NOW = new Date('2026-10-23T10:00:00.000Z');

const apiKey = (
  overrides: Partial<ExternalAppApiTokenFragment> = {}
): ExternalAppApiTokenFragment => ({
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

const listed = (key: ExternalAppApiTokenFragment): FullApiTokenFragment => ({
  ...key,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  createdById: null,
  createdBy: null,
});

const exportKey = apiKey();
const gintoKey = apiKey({ id: 'key-2', name: 'Ginto import' });
const retiringKey = apiKey({
  id: 'key-3',
  name: 'Old export',
  prefix: 'wep_old',
  expiresAt: '2026-11-10T00:00:00.000Z',
});
const expiredKey = apiKey({
  id: 'key-4',
  name: 'Expired export',
  prefix: 'wep_gone',
  expiresAt: '2026-10-01T00:00:00.000Z',
});

const druckliste: ExternalAppFragment = {
  __typename: 'ExternalApp',
  id: 'app-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Druckliste',
  description: 'Exports the print list',
  url: 'https://export.neuewege.ch/',
  target: ExternalAppsTarget.Iframe,
  icon: 'print',
  apiTokenId: exportKey.id,
  apiToken: exportKey,
};

const matomo: ExternalAppFragment = {
  __typename: 'ExternalApp',
  id: 'app-2',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  name: 'Matomo',
  description: null,
  url: 'https://matomo.example.com/',
  target: ExternalAppsTarget.Blank,
  icon: null,
  apiTokenId: retiringKey.id,
  apiToken: retiringKey,
};

const archive: ExternalAppFragment = {
  ...matomo,
  id: 'app-3',
  name: 'Archive',
  url: 'https://archive.example.com/',
  apiTokenId: expiredKey.id,
  apiToken: expiredKey,
};

const created: ExternalAppFragment = {
  ...matomo,
  id: 'app-new',
  name: 'Ginto',
  url: 'https://ginto.example.com/',
  apiTokenId: null,
  apiToken: null,
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
        permissions: permissions.map(granted => ({
          __typename: 'Permission' as const,
          ...granted,
        })),
      },
    ],
  },
});

const editor = sessionWith([
  CanCreateExternalApp,
  CanUpdateExternalApp,
  CanDeleteExternalApp,
  CanGetApiTokens,
]);

const listRequests = vi.fn();
const apiKeyRequests = vi.fn();
const createdWith =
  vi.fn<(variables: CreateExternalAppMutationVariables) => void>();
const updatedWith =
  vi.fn<(variables: UpdateExternalAppMutationVariables) => void>();
const deletedWith =
  vi.fn<(variables: DeleteExternalAppMutationVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: ExternalAppsDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: ExternalAppsQuery = {
      __typename: 'Query',
      externalApps: [druckliste, matomo, archive],
    };

    return { data };
  },
};

const apiKeyListMock: MockLink.MockedResponse = {
  request: {
    query: ApiTokenListDocument,
    variables: { status: ApiTokenStatus.Active, take: 100 },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    apiKeyRequests();

    const data: ApiTokenListQuery = {
      __typename: 'Query',
      apiTokens: {
        __typename: 'PaginatedApiTokens',
        totalCount: 2,
        nodes: [listed(exportKey), listed(gintoKey)],
        pageInfo: {
          __typename: 'PageInfo',
          startCursor: null,
          endCursor: null,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    return { data };
  },
};

const appMock = (app: ExternalAppFragment): MockLink.MockedResponse => {
  const data: ExternalAppQuery = { __typename: 'Query', externalApp: app };

  return {
    request: {
      query: ExternalAppDocument,
      variables: { externalAppId: app.id },
    },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: { data },
  };
};

const createMock: MockLink.MockedResponse = {
  request: { query: CreateExternalAppDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateExternalAppMutationVariables) => {
    createdWith(JSON.parse(JSON.stringify(variables)));

    const data: CreateExternalAppMutation = {
      __typename: 'Mutation',
      createExternalApp: created,
    };

    return { data };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdateExternalAppDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateExternalAppMutationVariables) => {
    updatedWith(JSON.parse(JSON.stringify(variables)));

    const data: UpdateExternalAppMutation = {
      __typename: 'Mutation',
      updateExternalApp: {
        ...druckliste,
        name: variables.name ?? druckliste.name,
      },
    };

    return { data };
  },
};

const deleteMock: MockLink.MockedResponse = {
  request: { query: DeleteExternalAppDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: DeleteExternalAppMutationVariables) => {
    deletedWith(JSON.parse(JSON.stringify(variables)));

    return {
      data: { __typename: 'Mutation', deleteExternalApp: matomo },
    };
  },
};

const pageMocks = () => [
  listMock,
  appMock(druckliste),
  appMock(matomo),
  appMock(archive),
  appMock(created),
  createMock,
  updateMock,
  deleteMock,
];

const defaultMocks = () => [...pageMocks(), apiKeyListMock];

const withSession =
  (session: AuthContextState) =>
  ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
    </I18nextProvider>
  );

const renderApps = (
  route: string,
  {
    mocks = defaultMocks(),
    session = editor,
  }: { mocks?: MockLink.MockedResponse[]; session?: AuthContextState } = {}
) =>
  renderFormRoutes(
    {
      '/dashboard/apps': <ExternalApps />,
      '/dashboard/apps/create': <ExternalApps />,
      '/dashboard/apps/edit/:id': <ExternalApps />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

type User = ReturnType<typeof renderApps>['user'];

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameLabel = 'externalAppForm.name*';

const nameInput = () => getFieldByLabel(nameLabel);
const descriptionInput = () => getFieldByLabel('externalAppForm.description');
const urlInput = () => getFieldByLabel('externalAppForm.url*');
const iconInput = () =>
  within(drawer()).getByRole('combobox', { name: 'externalAppForm.icon' });
const targetSelect = () =>
  within(drawer()).getByRole('combobox', { name: /^externalAppForm\.target/ });
const apiKeySelect = () =>
  within(drawer()).getByRole('combobox', { name: /^externalAppForm\.apiKey/ });
const queryApiKeySelect = () =>
  within(drawer()).queryByRole('combobox', {
    name: /^externalAppForm\.apiKey/,
  });

const loaded = (name = 'Druckliste') =>
  waitFor(() => expect(nameInput()).toHaveValue(name));

const drawerHeading = (name: string) =>
  within(drawer()).getByRole('heading', { level: 2, name });

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const pickOption = async (
  user: User,
  select: HTMLElement,
  option: string | RegExp
) => {
  await user.click(select);
  await user.click(await screen.findByRole('option', { name: option }));
};

const pickIcon = async (user: User, name: string) => {
  fireEvent.focus(iconInput());
  fireEvent.change(iconInput(), { target: { value: name } });
  await user.click(await screen.findByRole('option', { name }));
};

const clearIcon = (user: User) => {
  fireEvent.focus(iconInput());

  return user.click(
    within(autocompleteOf(iconInput())).getByRole('button', {
      name: 'form.autocomplete.clear',
      hidden: true,
    })
  );
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  listRequests.mockClear();
  apiKeyRequests.mockClear();
  createdWith.mockClear();
  updatedWith.mockClear();
  deletedWith.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ExternalApps', () => {
  it('lists the apps with their target and links each to its edit drawer', async () => {
    renderApps('/dashboard/apps');

    const link = await screen.findByRole('link', { name: 'Druckliste' });
    const row = within(link.closest('tr') as HTMLElement);

    expect(link).toHaveAttribute('href', '/dashboard/apps/edit/app-1');
    expect(
      row.getByText('externalAppForm.targets.IFRAME')
    ).toBeInTheDocument();
    expect(row.getByText('https://export.neuewege.ch/')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Matomo' })).toHaveAttribute(
      'href',
      '/dashboard/apps/edit/app-2'
    );
    expect(document.querySelectorAll('form')).toHaveLength(0);
  });

  it('opens the create drawer from the list', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps');

    await screen.findByRole('link', { name: 'Druckliste' });
    await user.click(
      screen.getByRole('link', { name: 'externalApps.createNew' })
    );

    expect(currentPath()).toBe('/dashboard/apps/create');
    expect(drawerHeading('externalAppForm.createTitle')).toBeInTheDocument();
  });

  it('hides create and delete without the permissions for them', async () => {
    renderApps('/dashboard/apps', {
      session: sessionWith([CanUpdateExternalApp]),
    });

    await screen.findByRole('link', { name: 'Druckliste' });

    expect(
      screen.queryByRole('link', { name: 'externalApps.createNew' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'delete' })
    ).not.toBeInTheDocument();
  });

  it('lands on cancel, not on the irreversible delete', async () => {
    const { user } = renderApps('/dashboard/apps');

    const link = await screen.findByRole('link', { name: 'Matomo' });
    const row = within(link.closest('tr') as HTMLElement);

    await user.click(row.getByRole('button', { name: 'delete' }));

    const dialog = within(await screen.findByRole('dialog'));

    await waitFor(() =>
      expect(dialog.getByRole('button', { name: 'cancel' })).toHaveFocus()
    );
  });

  it('deletes an app after a confirmation', async () => {
    const { user } = renderApps('/dashboard/apps');

    const link = await screen.findByRole('link', { name: 'Matomo' });
    const row = within(link.closest('tr') as HTMLElement);

    await user.click(row.getByRole('button', { name: 'delete' }));

    const dialog = within(await screen.findByRole('dialog'));

    expect(
      dialog.getByText('externalAppForm.deleteConfirmationText')
    ).toBeInTheDocument();
    expect(dialog.getByText('Matomo')).toBeInTheDocument();

    await user.click(
      dialog.getByRole('button', { name: 'externalAppForm.delete' })
    );

    await waitFor(() =>
      expect(deletedWith).toHaveBeenCalledWith({ deleteExternalAppId: 'app-2' })
    );
    expect(
      await screen.findByText('externalAppForm.successDelete')
    ).toBeInTheDocument();
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));
  });
});

describe('ExternalAppDrawer', () => {
  it('opens the create drawer on /dashboard/apps/create', () => {
    renderApps('/dashboard/apps/create');

    expect(drawerHeading('externalAppForm.createTitle')).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(descriptionInput()).toHaveValue('');
    expect(descriptionInput().tagName).toBe('TEXTAREA');
    expect(urlInput()).toHaveValue('');
    expect(targetSelect()).toHaveTextContent('externalAppForm.targets.BLANK');
    expect(iconInput()).toHaveValue('');
    expect(apiKeySelect()).not.toHaveTextContent(/wep_/);
    expect(
      within(drawer()).getByText('externalAppForm.apiKeyHelp')
    ).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
  });

  it('offers both targets and no empty one', async () => {
    const { user } = renderApps('/dashboard/apps/create');

    await user.click(targetSelect());

    const options = await screen.findAllByRole('option');

    expect(options.map(option => option.textContent)).toEqual([
      'externalAppForm.targets.BLANK',
      'externalAppForm.targets.IFRAME',
    ]);
  });

  it('requires a name and a valid URL', async () => {
    const { user } = renderApps('/dashboard/apps/create');

    await user.type(urlInput(), 'export');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('form.errors.required')
    ).toBeInTheDocument();
    expect(urlInput()).toHaveAttribute('aria-invalid', 'true');
    expect(
      within(drawer()).getByText('form.errors.invalid_format.url')
    ).toBeInTheDocument();
    expect(createdWith).not.toHaveBeenCalled();
  });

  it('creates with exact variables, refetches the list and stays on the new app', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps/create');

    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(1));
    await user.type(nameInput(), 'Ginto');
    await user.type(descriptionInput(), 'Imports members');
    await pickOption(user, targetSelect(), 'externalAppForm.targets.IFRAME');
    await user.type(urlInput(), 'https://ginto.example.com/');
    await pickIcon(user, 'Home');
    await pickOption(user, apiKeySelect(), 'Ginto import (wep_abcd1234…)');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(createdWith).toHaveBeenCalledTimes(1));
    expect(createdWith.mock.calls[0][0]).toStrictEqual({
      input: {
        name: 'Ginto',
        description: 'Imports members',
        url: 'https://ginto.example.com/',
        target: ExternalAppsTarget.Iframe,
        icon: 'home',
        apiTokenId: 'key-2',
      },
    });
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() =>
      expect(currentPath()).toBe('/dashboard/apps/edit/app-new')
    );
    await loaded('Ginto');
    expect(drawerHeading('externalAppForm.editTitle')).toBeInTheDocument();
  });

  it('closes after save and close on create', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps/create');

    await user.type(nameInput(), 'Ginto');
    await user.type(urlInput(), 'https://ginto.example.com/');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(createdWith).toHaveBeenCalledTimes(1));
    expect(createdWith.mock.calls[0][0]).toStrictEqual({
      input: {
        name: 'Ginto',
        description: '',
        url: 'https://ginto.example.com/',
        target: ExternalAppsTarget.Blank,
        icon: '',
        apiTokenId: null,
      },
    });
    await drawerClosed();
    expect(currentPath()).toBe('/dashboard/apps');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('opens the stored app on /dashboard/apps/edit/:id', async () => {
    renderApps('/dashboard/apps/edit/app-1');

    await loaded();

    expect(drawerHeading('externalAppForm.editTitle')).toBeInTheDocument();
    expect(descriptionInput()).toHaveValue('Exports the print list');
    expect(urlInput()).toHaveValue('https://export.neuewege.ch/');
    expect(targetSelect()).toHaveTextContent('externalAppForm.targets.IFRAME');
    expect(iconInput()).toHaveValue('Print');
    expect(
      autocompleteOf(iconInput()).querySelector('[data-icon-preview] svg')
    ).toBeInTheDocument();
    expect(apiKeySelect()).toHaveTextContent(
      'nw-one-click-export (wep_abcd1234…)'
    );
    expect(
      within(drawer()).getByText('wep_abcd1234… · 2 permissions')
    ).toBeInTheDocument();
    expect(within(drawer()).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('updates with exact variables and closes after save and close', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await pickOption(user, targetSelect(), 'externalAppForm.targets.BLANK');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toStrictEqual({
      updateExternalAppId: 'app-1',
      name: 'Druckliste neu',
      description: 'Exports the print list',
      url: 'https://export.neuewege.ch/',
      target: ExternalAppsTarget.Blank,
      icon: 'print',
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await drawerClosed();
    expect(currentPath()).toBe('/dashboard/apps');
    expect(
      await screen.findByRole('link', { name: 'Druckliste neu' })
    ).toBeInTheDocument();
  });

  it('stays open after save on edit', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(currentPath()).toBe('/dashboard/apps/edit/app-1');
    expect(nameInput()).toHaveValue('Druckliste neu');
  });

  it('clears the stored icon once it was removed', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await clearIcon(user);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toMatchObject({ icon: '' });
  });

  it('links another API key', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await pickOption(user, apiKeySelect(), 'Ginto import (wep_abcd1234…)');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toMatchObject({
      apiTokenId: 'key-2',
    });
  });

  it('unlinks the API key', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await pickOption(user, apiKeySelect(), 'form.select.empty');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toMatchObject({ apiTokenId: null });
  });

  it('offers the active API keys and keeps the linked one selectable once it is no longer active', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-2');

    await loaded('Matomo');
    await waitFor(() => expect(apiKeyRequests).toHaveBeenCalled());
    await user.click(apiKeySelect());

    const options = await screen.findAllByRole('option');

    expect(options.map(option => option.textContent)).toEqual([
      'form.select.empty',
      'Old export (wep_old…)',
      'nw-one-click-export (wep_abcd1234…)',
      'Ginto import (wep_abcd1234…)',
    ]);
  });

  it('warns while the linked key that expires soon stays selected', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-2');

    await loaded('Matomo');

    expect(
      within(drawer()).getByText('The API key “Old export” expires soon')
    ).toBeInTheDocument();

    await pickOption(user, apiKeySelect(), 'Ginto import (wep_abcd1234…)');

    expect(
      within(drawer()).queryByText('The API key “Old export” expires soon')
    ).not.toBeInTheDocument();
  });

  it('saves an app whose linked key has expired without linking that key again', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-3');

    await loaded('Archive');

    expect(
      within(drawer()).getByText('The API key “Expired export” has expired')
    ).toBeInTheDocument();

    await user.type(nameInput(), ' 2');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).toStrictEqual({
      updateExternalAppId: 'app-3',
      name: 'Archive 2',
      description: '',
      url: 'https://archive.example.com/',
      target: ExternalAppsTarget.Blank,
      icon: '',
    });
  });

  it('keeps the key untouched for editors who may not see API keys', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-1', {
      session: sessionWith([CanCreateExternalApp, CanUpdateExternalApp]),
    });

    await loaded();

    expect(queryApiKeySelect()).not.toBeInTheDocument();

    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updatedWith).toHaveBeenCalledTimes(1));
    expect(updatedWith.mock.calls[0][0]).not.toHaveProperty('apiTokenId');
    expect(apiKeyRequests).not.toHaveBeenCalled();
  });

  it('creates without an API key for editors who may not see API keys', async () => {
    const { user } = renderApps('/dashboard/apps/create', {
      session: sessionWith([CanCreateExternalApp, CanUpdateExternalApp]),
    });

    expect(queryApiKeySelect()).not.toBeInTheDocument();

    await user.type(nameInput(), 'Ginto');
    await user.type(urlInput(), 'https://ginto.example.com/');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(createdWith).toHaveBeenCalledTimes(1));
    expect(createdWith.mock.calls[0][0].input).not.toHaveProperty(
      'apiTokenId'
    );
  });

  it('is read-only without CanUpdateExternalApp', async () => {
    renderApps('/dashboard/apps/edit/app-1', {
      session: sessionWith([CanCreateExternalApp, CanGetApiTokens]),
    });

    await loaded();

    expect(
      within(drawer()).getByText('form.view.readOnly')
    ).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(urlInput()).toBeDisabled();
    expect(iconInput()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('shows no fields while the app loads', () => {
    renderApps('/dashboard/apps/edit/app-1');

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('shows a load error with a retry', async () => {
    const { user } = renderApps('/dashboard/apps/edit/app-1', {
      mocks: [
        listMock,
        apiKeyListMock,
        {
          request: {
            query: ExternalAppDocument,
            variables: { externalAppId: 'app-1' },
          },
          error: new Error('App offline'),
        },
        appMock(druckliste),
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
    const { user, currentPath } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/dashboard/apps');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before the close button discards changes', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/dashboard/apps/edit/app-1');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/dashboard/apps');
    expect(updatedWith).not.toHaveBeenCalled();
  });

  it('reopens after a close and never shows the previous app', async () => {
    const { user, currentPath } = renderApps('/dashboard/apps/edit/app-1');

    await loaded();
    await user.keyboard('{Escape}');
    await drawerClosed();

    await user.click(await screen.findByRole('link', { name: 'Matomo' }));

    expect(currentPath()).toBe('/dashboard/apps/edit/app-2');
    expect(
      screen
        .queryAllByLabelText<HTMLInputElement>(nameLabel, {
          selector: 'input',
        })
        .map(input => input.value)
    ).not.toContain('Druckliste');
    await loaded('Matomo');
    expect(targetSelect()).toHaveTextContent('externalAppForm.targets.BLANK');
  });
});
