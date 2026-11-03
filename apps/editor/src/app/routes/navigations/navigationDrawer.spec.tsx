import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type CreateNavigationMutation,
  type CreateNavigationMutationVariables,
  type FullNavigationFragment,
  type NavigationListQuery,
  type UpdateNavigationMutation,
  type UpdateNavigationMutationVariables,
  CreateNavigationDocument,
  NavigationDocument,
  NavigationListDocument,
  UpdateNavigationDocument,
} from '@wepublish/editor/api';
import {
  articleFixture,
  articleListMock,
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  pageFixture,
  pageListMock,
  queryFieldByLabel,
  renderFormRoutes,
  stubSortableRowRects,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanCreateNavigation,
  CanDeleteNavigation,
  CanGetNavigation,
  CanGetNavigations,
} from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { NavigationList } from './navigationList';

const about = pageFixture('page-about', 'Über uns');
const research = articleFixture('article-research', 'Recherche');

const mainNavigation: FullNavigationFragment = {
  __typename: 'Navigation',
  id: 'nav-1',
  key: 'main',
  name: 'Hauptnavigation',
  links: [
    {
      __typename: 'PageNavigationLink',
      label: 'Über uns',
      pageID: 'page-about',
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Recherche',
      articleID: 'article-research',
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'Shop',
      url: 'https://shop.example.com',
    },
  ],
};

const footerNavigation: FullNavigationFragment = {
  __typename: 'Navigation',
  id: 'nav-2',
  key: 'footer',
  name: 'Fusszeile',
  links: [],
};

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'navigation-editor',
        name: 'navigation-editor',
        description: null,
        systemRole: false,
        permissions: permissions.map(permission => ({
          __typename: 'Permission' as const,
          ...permission,
        })),
      },
    ],
  },
});

const editor = sessionWith([
  CanGetNavigations,
  CanGetNavigation,
  CanCreateNavigation,
  CanDeleteNavigation,
]);

const listRequests = vi.fn();
const created = vi.fn<(variables: CreateNavigationMutationVariables) => void>();
const updated = vi.fn<(variables: UpdateNavigationMutationVariables) => void>();

const slim = ({ id, key, name }: FullNavigationFragment) => ({
  __typename: 'Navigation' as const,
  id,
  key,
  name,
});

const listMock: MockLink.MockedResponse = {
  request: { query: NavigationListDocument, variables: {} },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: NavigationListQuery = {
      __typename: 'Query',
      navigations: [slim(mainNavigation), slim(footerNavigation)],
    };

    return { data };
  },
};

const navigationMock = (
  navigation: FullNavigationFragment
): MockLink.MockedResponse => ({
  request: { query: NavigationDocument, variables: { id: navigation.id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { navigation } },
});

const createdNavigation: FullNavigationFragment = {
  __typename: 'Navigation',
  id: 'nav-new',
  key: 'footer',
  name: 'Footer',
  links: [
    {
      __typename: 'ExternalNavigationLink',
      label: 'Impressum',
      url: '/impressum',
    },
  ],
};

const createMock: MockLink.MockedResponse = {
  request: { query: CreateNavigationDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateNavigationMutationVariables) => {
    created(JSON.parse(JSON.stringify(variables)));

    const data: CreateNavigationMutation = {
      __typename: 'Mutation',
      createNavigation: createdNavigation,
    };

    return { data };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdateNavigationDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateNavigationMutationVariables) => {
    updated(JSON.parse(JSON.stringify(variables)));

    const data: UpdateNavigationMutation = {
      __typename: 'Mutation',
      updateNavigation: { ...mainNavigation, name: variables.name },
    };

    return { data };
  },
};

const keyTakenMock = {
  request: { query: CreateNavigationDocument, variables: () => true },
  result: {
    errors: [
      {
        message:
          '\nInvalid `this.prisma.navigation.create()` invocation in\n/app/dist/main.js:1:1\n\nUnique constraint failed on the constraint: `navigations_key_key`',
      },
    ],
  },
} as MockLink.MockedResponse;

const pickers = () => [pageListMock([about]), articleListMock([research])];

const defaultMocks = () => [
  listMock,
  navigationMock(mainNavigation),
  navigationMock(footerNavigation),
  navigationMock(createdNavigation),
  ...pickers(),
  createMock,
  updateMock,
];

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

const renderNavigations = (
  route: string,
  {
    mocks = defaultMocks(),
    session = editor,
  }: { mocks?: MockLink.MockedResponse[]; session?: AuthContextState } = {}
) =>
  renderFormRoutes(
    {
      '/navigations': <NavigationList />,
      '/navigations/create': <NavigationList />,
      '/navigations/edit/:id': <NavigationList />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameLabel = 'navigation.panels.name*';
const keyLabel = 'navigation.panels.key*';

const nameInput = () => getFieldByLabel(nameLabel);
const keyInput = () => getFieldByLabel(keyLabel);

const fieldsLabelled = (label: string) =>
  screen.queryAllByLabelText<HTMLInputElement>(label, {
    selector: 'input, textarea',
  });

const linkLabels = () =>
  fieldsLabelled('navigation.panels.label*').map(input => input.value);

const linkTypes = (type: 'External' | 'Page' | 'Article') =>
  screen.getAllByRole('radio', { name: `navigation.panels.linkTypes.${type}` });

const addLink = () =>
  screen.getByRole('button', { name: 'navigation.panels.addLink' });

const loaded = (name = 'Hauptnavigation') =>
  waitFor(() => expect(nameInput()).toHaveValue(name));

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const listLink = (name: string) => screen.findByRole('link', { name });

beforeEach(() => {
  listRequests.mockClear();
  created.mockClear();
  updated.mockClear();
});

describe('NavigationDrawer', () => {
  it('opens the create drawer on /navigations/create', () => {
    renderNavigations('/navigations/create');

    expect(
      within(drawer()).getByRole('heading', {
        level: 2,
        name: 'navigation.panels.createNavigation',
      })
    ).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(keyInput()).toHaveValue('');
    expect(
      formSectionOf('navigation.panels.links').getByText('form.array.empty')
    ).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
  });

  it('shows no fields while the navigation loads', () => {
    renderNavigations('/navigations/edit/nav-1');

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('opens the stored navigation on /navigations/edit/:id', async () => {
    renderNavigations('/navigations/edit/nav-1');

    await loaded();

    expect(
      within(drawer()).getByRole('heading', {
        level: 2,
        name: 'navigation.panels.editNavigation',
      })
    ).toBeInTheDocument();
    expect(
      within(drawer()).getByRole('heading', {
        level: 3,
        name: 'navigation.panels.links',
      })
    ).toBeInTheDocument();
    expect(keyInput()).toHaveValue('main');
    expect(linkLabels()).toEqual(['Über uns', 'Recherche', 'Shop']);
    expect(linkTypes('Page')[0]).toBeChecked();
    expect(linkTypes('Article')[1]).toBeChecked();
    expect(linkTypes('External')[2]).toBeChecked();
    await waitFor(() =>
      expect(getFieldByLabel('navigation.panels.linkTypePage*')).toHaveValue(
        'Über uns'
      )
    );
    await waitFor(() =>
      expect(getFieldByLabel('navigation.panels.linkTypeArticle*')).toHaveValue(
        'Recherche'
      )
    );
    expect(getFieldByLabel('navigation.panels.url*')).toHaveValue(
      'https://shop.example.com'
    );
  });

  it('creates with exact variables, refetches the list and stays on the new navigation', async () => {
    const { user, currentPath } = renderNavigations('/navigations/create');

    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(1));
    await user.type(nameInput(), 'Footer');
    await user.type(keyInput(), 'footer');
    await user.click(addLink());
    await user.type(getFieldByLabel('navigation.panels.label*'), 'Impressum');
    await user.type(getFieldByLabel('navigation.panels.url*'), '/impressum');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Footer',
      key: 'footer',
      links: [{ type: 'External', label: 'Impressum', url: '/impressum' }],
    });
    await waitFor(() => expect(listRequests).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() =>
      expect(currentPath()).toBe('/navigations/edit/nav-new')
    );
    await loaded('Footer');
    expect(
      within(drawer()).getByRole('heading', {
        level: 2,
        name: 'navigation.panels.editNavigation',
      })
    ).toBeInTheDocument();
  });

  it('closes after save and close on create', async () => {
    const { user, currentPath } = renderNavigations('/navigations/create');

    await user.type(nameInput(), 'Footer');
    await user.type(keyInput(), 'footer');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Footer',
      key: 'footer',
      links: [],
    });
    await drawerClosed();
    expect(currentPath()).toBe('/navigations');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('updates with exact variables per link type and closes after save and close', async () => {
    const { user, currentPath } = renderNavigations('/navigations/edit/nav-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      id: 'nav-1',
      name: 'Hauptnavigation neu',
      key: 'main',
      links: [
        { type: 'Page', label: 'Über uns', pageID: 'page-about' },
        {
          type: 'Article',
          label: 'Recherche',
          articleID: 'article-research',
        },
        { type: 'External', label: 'Shop', url: 'https://shop.example.com' },
      ],
    });
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await drawerClosed();
    expect(currentPath()).toBe('/navigations');
  });

  it('reorders links by keyboard drag', async () => {
    const { user } = renderNavigations('/navigations/edit/nav-1');

    await loaded();
    const rects = stubSortableRowRects();
    const handles = screen.getAllByRole('button', {
      name: 'form.array.dragHandle',
    });
    handles[2].focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowUp]');
    await user.keyboard('[Space]');

    await waitFor(() =>
      expect(linkLabels()).toEqual(['Über uns', 'Shop', 'Recherche'])
    );
    rects.mockRestore();

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(
      [updated.mock.calls[0][0].links].flat().map(link => link.label)
    ).toEqual(['Über uns', 'Shop', 'Recherche']);
  });

  it('starts a new link as an external link', async () => {
    const { user } = renderNavigations('/navigations/create');

    await user.click(addLink());

    expect(linkTypes('External')[0]).toBeChecked();
    expect(getFieldByLabel('navigation.panels.url*')).toHaveValue('');
  });

  it('requires the target of each link type', async () => {
    const { user } = renderNavigations('/navigations/create');

    await user.type(nameInput(), 'Footer');
    await user.type(keyInput(), 'footer');
    await user.click(addLink());
    await user.type(getFieldByLabel('navigation.panels.label*'), 'Über uns');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('navigation.panels.url*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );

    await user.click(linkTypes('Page')[0]);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(
        getFieldByLabel('navigation.panels.linkTypePage*')
      ).toHaveAttribute('aria-invalid', 'true')
    );
    expect(created).not.toHaveBeenCalled();

    await user.click(getFieldByLabel('navigation.panels.linkTypePage*'));
    await user.click(await screen.findByRole('option', { name: 'Über uns' }));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Footer',
      key: 'footer',
      links: [{ type: 'Page', label: 'Über uns', pageID: 'page-about' }],
    });
  });

  it('shows a taken key under the key field', async () => {
    const { user, currentPath } = renderNavigations('/navigations/create', {
      mocks: [listMock, ...pickers(), keyTakenMock],
    });

    await user.type(nameInput(), 'Footer');
    await user.type(keyInput(), 'main');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(keyInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('navigation.panels.keyTaken')
    ).toBeInTheDocument();
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(screen.queryByText(/navigations_key_key/)).not.toBeInTheDocument();
    expect(currentPath()).toBe('/navigations/create');
  });

  it('closes a clean drawer on Escape without asking', async () => {
    const { user, currentPath } = renderNavigations('/navigations/edit/nav-1');

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/navigations');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before Escape closes a dirty drawer', async () => {
    const { user, currentPath } = renderNavigations('/navigations/edit/nav-1');

    await loaded();
    await user.type(nameInput(), ' neu');
    await user.keyboard('{Escape}');

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/navigations/edit/nav-1');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );
    await waitFor(() => expect(discardPrompt()).not.toBeInTheDocument());
    expect(nameInput()).toHaveValue('Hauptnavigation neu');

    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/navigations');
  });

  it('reopens after a close and never shows the previous navigation', async () => {
    const { user, currentPath } = renderNavigations('/navigations/edit/nav-1');

    await loaded();
    await user.keyboard('{Escape}');
    await drawerClosed();

    await user.click(await listLink('Hauptnavigation'));

    expect(currentPath()).toBe('/navigations/edit/nav-1');
    await loaded();

    await user.keyboard('{Escape}');
    await drawerClosed();
    await user.click(await listLink('Fusszeile'));

    expect(fieldsLabelled(nameLabel).map(input => input.value)).not.toContain(
      'Hauptnavigation'
    );
    await loaded('Fusszeile');
    expect(keyInput()).toHaveValue('footer');
  });

  it('closes on browser Back', async () => {
    const { user, currentPath } = renderNavigations('/navigations');

    await user.click(await listLink('Hauptnavigation'));
    await loaded();
    fireEvent.click(screen.getByTestId('browserBack'));

    await waitFor(() => expect(currentPath()).toBe('/navigations'));
    await drawerClosed();
  });

  it('is read-only without CanCreateNavigation', async () => {
    renderNavigations('/navigations/edit/nav-1', {
      session: sessionWith([CanGetNavigations, CanGetNavigation]),
    });

    await loaded();

    expect(
      within(drawer()).getByText('form.view.readOnly')
    ).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(fieldsLabelled('navigation.panels.label*')[0]).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
    expect(addLink()).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'form.array.remove' })[0]
    ).toBeDisabled();
  });

  it('shows a load error with a retry', async () => {
    const { user } = renderNavigations('/navigations/edit/nav-1', {
      mocks: [
        listMock,
        ...pickers(),
        {
          request: { query: NavigationDocument, variables: { id: 'nav-1' } },
          error: new Error('Navigation offline'),
        },
        navigationMock(mainNavigation),
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
});
