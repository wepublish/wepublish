import type { MockLink } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type AuthorListQuery,
  type CreateAuthorMutation,
  type CreateAuthorMutationVariables,
  type FullAuthorFragment,
  type UpdateAuthorMutation,
  type UpdateAuthorMutationVariables,
  type WebsiteSettingsQuery,
  AuthorDocument,
  AuthorListDocument,
  CreateAuthorDocument,
  TagType,
  UpdateAuthorDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  drawerClosed,
  formSectionOf,
  getFieldByLabel,
  imageFixture,
  imageListMock,
  imageMock,
  queryFieldByLabel,
  renderFormRoutes,
  stubSortableRowRects,
  tagFixture,
  tagListMock,
  tagMock,
} from '@wepublish/form/editor/testing';
import {
  type Permission,
  CanCreateAuthor,
  CanDeleteAuthor,
  CanGetAuthor,
  CanGetAuthors,
} from '@wepublish/permissions';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthorList } from './authorList';

const portrait = imageFixture('image-portrait', 'Portrait');
const science = tagFixture('tag-science', 'Wissenschaft', TagType.Author);

const paragraph = (text: string): RichtextJSONDocument => ({
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text }],
    },
  ],
});

const ada: FullAuthorFragment = {
  __typename: 'Author',
  id: 'author-1',
  name: 'Ada Lovelace',
  slug: 'ada',
  jobTitle: 'Mathematikerin',
  bio: paragraph('Erste Programmiererin'),
  url: 'https://example.com/author/ada',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  imageID: 'image-portrait',
  image: portrait,
  hideOnArticle: false,
  hideOnTeaser: true,
  hideOnTeam: false,
  peer: null,
  links: [
    {
      __typename: 'AuthorLink',
      title: 'Website',
      url: 'https://ada.example.com',
    },
    {
      __typename: 'AuthorLink',
      title: 'Mastodon',
      url: 'https://mastodon.example/@ada',
    },
  ],
  tags: [science],
};

const grace: FullAuthorFragment = {
  ...ada,
  id: 'author-2',
  name: 'Grace Hopper',
  slug: 'grace-hopper',
  jobTitle: null,
  bio: null,
  imageID: null,
  image: null,
  hideOnTeaser: false,
  links: [],
  tags: [],
};

const createdAuthor: FullAuthorFragment = {
  ...grace,
  id: 'author-new',
  name: 'Hedy Lamarr',
  slug: 'hedy-lamarr',
};

const sessionWith = (permissions: Permission[]): AuthContextState => ({
  session: {
    email: 'editor@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'author-editor',
        name: 'author-editor',
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
  CanGetAuthors,
  CanGetAuthor,
  CanCreateAuthor,
  CanDeleteAuthor,
]);

const keyDisabled = {
  __typename: 'KeyEnabled',
  enabled: false,
  key: null,
} as const;

const websiteSettingsData: WebsiteSettingsQuery = {
  __typename: 'Query',
  websiteSettings: {
    __typename: 'WebsiteSettings',
    theme: {},
    analytics: {
      __typename: 'WebsiteAnalytics',
      googleAnalytics: keyDisabled,
      googleTagManager: keyDisabled,
      plausible: keyDisabled,
      piwik: keyDisabled,
    },
    mail: { __typename: 'WebsiteMail', mailchimp: null },
    ads: { __typename: 'WebsiteAds', sparkLoop: keyDisabled },
    fonts: [],
  },
};

const websiteSettings: MockLink.MockedResponse = {
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: { data: websiteSettingsData },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const listRequests = vi.fn();
const created = vi.fn<(variables: CreateAuthorMutationVariables) => void>();
const updated = vi.fn<(variables: UpdateAuthorMutationVariables) => void>();

const listMock: MockLink.MockedResponse = {
  request: { query: AuthorListDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: () => {
    listRequests();

    const data: AuthorListQuery = {
      __typename: 'Query',
      authors: {
        __typename: 'PaginatedAuthors',
        totalCount: 2,
        nodes: [ada, grace],
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

const authorMock = (author: FullAuthorFragment): MockLink.MockedResponse => ({
  request: { query: AuthorDocument, variables: { id: author.id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { author } },
});

const createMock: MockLink.MockedResponse = {
  request: { query: CreateAuthorDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateAuthorMutationVariables) => {
    created(JSON.parse(JSON.stringify(variables)));

    const data: CreateAuthorMutation = {
      __typename: 'Mutation',
      createAuthor: createdAuthor,
    };

    return { data };
  },
};

const updateMock: MockLink.MockedResponse = {
  request: { query: UpdateAuthorDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateAuthorMutationVariables) => {
    updated(JSON.parse(JSON.stringify(variables)));

    const data: UpdateAuthorMutation = {
      __typename: 'Mutation',
      updateAuthor: { ...ada, name: variables.name ?? ada.name },
    };

    return { data };
  },
};

const slugTakenMock = {
  request: { query: CreateAuthorDocument, variables: () => true },
  result: {
    errors: [
      {
        message:
          '\nInvalid `this.prisma.author.create()` invocation in\n/app/dist/main.js:1:1\n\nUnique constraint failed on the constraint: `authors_slug_no_peerId`',
      },
    ],
  },
} as MockLink.MockedResponse;

const pickers = () => [
  websiteSettings,
  tagListMock([science]),
  tagMock(science),
  imageListMock([portrait]),
  imageMock(portrait),
];

const defaultMocks = () => [
  listMock,
  authorMock(ada),
  authorMock(grace),
  authorMock(createdAuthor),
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

const renderAuthors = (
  route: string,
  {
    mocks = defaultMocks(),
    session = editor,
  }: { mocks?: MockLink.MockedResponse[]; session?: AuthContextState } = {}
) =>
  renderFormRoutes(
    {
      '/authors': <AuthorList />,
      '/authors/create': <AuthorList />,
      '/authors/edit/:id': <AuthorList />,
    },
    { route, mocks, wrapper: withSession(session) }
  );

const drawer = () =>
  document.querySelector<HTMLElement>('.MuiDrawer-paper') as HTMLElement;

const nameLabel = 'authors.panels.name*';

const nameInput = () => getFieldByLabel(nameLabel);
const jobTitleInput = () => getFieldByLabel('authors.panels.jobTitle');

const fieldsLabelled = (label: string) =>
  screen.queryAllByLabelText<HTMLInputElement>(label, {
    selector: 'input, textarea',
  });

const linkTitles = () =>
  fieldsLabelled('authors.panels.title*').map(input => input.value);

const linkUrls = () =>
  fieldsLabelled('authors.panels.link*').map(input => input.value);

const addLink = () =>
  screen.getByRole('button', { name: 'authors.panels.addLink' });

const checkbox = (name: 'hideOnArticle' | 'hideOnTeaser' | 'hideOnTeam') =>
  screen.getByRole('checkbox', { name: `authorEditPanel.${name}` });

const loaded = (name = 'Ada Lovelace') =>
  waitFor(() => expect(nameInput()).toHaveValue(name));

const discardPrompt = () =>
  screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' });

const listLink = (name: string) => screen.findByRole('link', { name });

const unchangedAda = {
  id: 'author-1',
  name: 'Ada Lovelace',
  slug: 'ada',
  jobTitle: 'Mathematikerin',
  bio: JSON.parse(JSON.stringify(paragraph('Erste Programmiererin'))),
  imageID: 'image-portrait',
  links: [
    { title: 'Website', url: 'https://ada.example.com' },
    { title: 'Mastodon', url: 'https://mastodon.example/@ada' },
  ],
  tagIds: ['tag-science'],
  hideOnArticle: false,
  hideOnTeaser: true,
  hideOnTeam: false,
};

beforeEach(() => {
  listRequests.mockClear();
  created.mockClear();
  updated.mockClear();
});

describe('AuthorDrawer', () => {
  it('opens the create drawer on /authors/create without links', () => {
    renderAuthors('/authors/create');

    expect(
      within(drawer()).getByRole('heading', {
        level: 2,
        name: 'authors.panels.createAuthor',
      })
    ).toBeInTheDocument();
    expect(nameInput()).toHaveValue('');
    expect(jobTitleInput()).toHaveValue('');
    expect(
      formSectionOf('authors.panels.links').getByText('form.array.empty')
    ).toBeInTheDocument();
    expect(checkbox('hideOnArticle')).not.toBeChecked();
    expect(checkbox('hideOnTeaser')).not.toBeChecked();
    expect(checkbox('hideOnTeam')).not.toBeChecked();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
  });

  it('shows no fields while the author loads', () => {
    renderAuthors('/authors/edit/author-1');

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('opens the stored author on /authors/edit/:id', async () => {
    renderAuthors('/authors/edit/author-1');

    await loaded();

    expect(
      within(drawer()).getByRole('heading', {
        level: 2,
        name: 'authors.panels.editAuthor',
      })
    ).toBeInTheDocument();
    expect(
      within(drawer()).getByRole('heading', {
        level: 3,
        name: 'authors.panels.links',
      })
    ).toBeInTheDocument();
    expect(jobTitleInput()).toHaveValue('Mathematikerin');
    expect(
      await within(drawer()).findByText('Erste Programmiererin')
    ).toBeInTheDocument();
    expect(within(drawer()).getByAltText('Portrait')).toBeInTheDocument();
    expect(
      await within(drawer()).findByText('Wissenschaft')
    ).toBeInTheDocument();
    expect(linkTitles()).toEqual(['Website', 'Mastodon']);
    expect(linkUrls()).toEqual([
      'https://ada.example.com',
      'https://mastodon.example/@ada',
    ]);
    expect(checkbox('hideOnArticle')).not.toBeChecked();
    expect(checkbox('hideOnTeaser')).toBeChecked();
    expect(checkbox('hideOnTeam')).not.toBeChecked();
    expect(
      screen.getByRole('group', { name: 'authorEditPanel.hideAuthor' })
    ).toBeInTheDocument();
  });

  it('creates with exact variables, refetches the list and stays on the new author', async () => {
    const { user, currentPath } = renderAuthors('/authors/create');

    await waitFor(() => expect(listRequests).toHaveBeenCalled());
    const listedBefore = listRequests.mock.calls.length;

    await user.type(nameInput(), 'Hedy Lamarr');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Hedy Lamarr',
      slug: 'hedy-lamarr',
      jobTitle: '',
      links: [],
      tagIds: [],
      hideOnArticle: false,
      hideOnTeaser: false,
      hideOnTeam: false,
    });
    await waitFor(() =>
      expect(listRequests.mock.calls.length).toBeGreaterThan(listedBefore)
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
    await waitFor(() => expect(currentPath()).toBe('/authors/edit/author-new'));
    await loaded('Hedy Lamarr');
    expect(
      within(drawer()).getByRole('heading', {
        level: 2,
        name: 'authors.panels.editAuthor',
      })
    ).toBeInTheDocument();
  });

  it('creates with a job title, links and visibility, then closes on save and close', async () => {
    const { user, currentPath } = renderAuthors('/authors/create');

    await user.type(nameInput(), 'Hedy Lamarr');
    await user.type(jobTitleInput(), 'Erfinderin');
    await user.click(addLink());
    await user.type(getFieldByLabel('authors.panels.title*'), 'Website');
    await user.type(getFieldByLabel('authors.panels.link*'), 'https://hedy.ch');
    await user.click(checkbox('hideOnTeam'));
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(created.mock.calls[0][0]).toStrictEqual({
      name: 'Hedy Lamarr',
      slug: 'hedy-lamarr',
      jobTitle: 'Erfinderin',
      links: [{ title: 'Website', url: 'https://hedy.ch' }],
      tagIds: [],
      hideOnArticle: false,
      hideOnTeaser: false,
      hideOnTeam: true,
    });
    await drawerClosed();
    expect(currentPath()).toBe('/authors');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('updates with exact variables and closes after save and close', async () => {
    const { user, currentPath } = renderAuthors('/authors/edit/author-1');

    await loaded();
    await within(drawer()).findByText('Erste Programmiererin');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual(unchangedAda);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await drawerClosed();
    expect(currentPath()).toBe('/authors');
  });

  it('derives a new slug from a changed name', async () => {
    const { user } = renderAuthors('/authors/edit/author-1');

    await loaded();
    await user.clear(nameInput());
    await user.type(nameInput(), 'Ada King');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      ...unchangedAda,
      name: 'Ada King',
      slug: 'ada-king',
    });
  });

  it('saves a cleared job title as an empty string and a removed image as null', async () => {
    const { user } = renderAuthors('/authors/edit/author-1');

    await loaded();
    await user.clear(jobTitleInput());
    await user.click(
      within(drawer()).getByRole('button', {
        name: 'chooseEditImage.removeImage',
      })
    );
    await user.click(checkbox('hideOnTeaser'));
    await user.click(checkbox('hideOnArticle'));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0]).toStrictEqual({
      ...unchangedAda,
      jobTitle: '',
      imageID: null,
      hideOnArticle: true,
      hideOnTeaser: false,
    });
  });

  it('reorders and removes links', async () => {
    const { user } = renderAuthors('/authors/edit/author-1');

    await loaded();
    const rects = stubSortableRowRects();
    const handles = screen.getAllByRole('button', {
      name: 'form.array.dragHandle',
    });
    handles[1].focus();
    await user.keyboard('[Space]');
    await user.keyboard('[ArrowUp]');
    await user.keyboard('[Space]');

    await waitFor(() => expect(linkTitles()).toEqual(['Mastodon', 'Website']));
    rects.mockRestore();

    await user.click(
      screen.getAllByRole('button', { name: 'form.array.remove' })[1]
    );
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(updated.mock.calls[0][0].links).toEqual([
      { title: 'Mastodon', url: 'https://mastodon.example/@ada' },
    ]);
  });

  it('requires a name', async () => {
    const { user } = renderAuthors('/authors/create');

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('form.errors.required')
    ).toBeInTheDocument();
    expect(created).not.toHaveBeenCalled();
  });

  it('requires the title and the address of each link', async () => {
    const { user } = renderAuthors('/authors/create');

    await user.type(nameInput(), 'Hedy Lamarr');
    await user.click(addLink());
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('authors.panels.title*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(getFieldByLabel('authors.panels.link*')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(created).not.toHaveBeenCalled();
  });

  it('shows a taken slug under the name', async () => {
    const { user, currentPath } = renderAuthors('/authors/create', {
      mocks: [listMock, ...pickers(), slugTakenMock],
    });

    await user.type(nameInput(), 'Ada Lovelace');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameInput()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(
      within(drawer()).getByText('authors.panels.slugTaken')
    ).toBeInTheDocument();
    expect(screen.queryByText('form.errors.server')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/authors_slug_no_peerId/)
    ).not.toBeInTheDocument();
    expect(currentPath()).toBe('/authors/create');
  });

  it('closes a clean drawer on Escape without asking', async () => {
    const { user, currentPath } = renderAuthors('/authors/edit/author-1');

    await loaded();
    await user.keyboard('{Escape}');

    await drawerClosed();
    expect(currentPath()).toBe('/authors');
    expect(discardPrompt()).not.toBeInTheDocument();
  });

  it('asks before Escape closes a dirty drawer', async () => {
    const { user, currentPath } = renderAuthors('/authors/edit/author-1');

    await loaded();
    await user.type(nameInput(), ' King');
    await user.keyboard('{Escape}');

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/authors/edit/author-1');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );
    await waitFor(() => expect(discardPrompt()).not.toBeInTheDocument());
    expect(nameInput()).toHaveValue('Ada Lovelace King');

    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/authors');
    expect(updated).not.toHaveBeenCalled();
  });

  it('reopens after a close and never shows the previous author', async () => {
    const { user, currentPath } = renderAuthors('/authors/edit/author-1');

    await loaded();
    await user.keyboard('{Escape}');
    await drawerClosed();

    await user.click(await listLink('Grace Hopper'));

    expect(currentPath()).toBe('/authors/edit/author-2');
    expect(fieldsLabelled(nameLabel).map(input => input.value)).not.toContain(
      'Ada Lovelace'
    );
    await loaded('Grace Hopper');
    expect(jobTitleInput()).toHaveValue('');
    expect(linkTitles()).toEqual([]);
  });

  it('closes on browser Back', async () => {
    const { user, currentPath } = renderAuthors('/authors');

    await user.click(await listLink('Ada Lovelace'));
    await loaded();
    fireEvent.click(screen.getByTestId('browserBack'));

    await waitFor(() => expect(currentPath()).toBe('/authors'));
    await drawerClosed();
  });

  it('is read-only without CanCreateAuthor', async () => {
    renderAuthors('/authors/edit/author-1', {
      session: sessionWith([CanGetAuthors, CanGetAuthor]),
    });

    await loaded();

    expect(
      within(drawer()).getByText('form.view.readOnly')
    ).toBeInTheDocument();
    expect(nameInput()).toBeDisabled();
    expect(jobTitleInput()).toBeDisabled();
    expect(fieldsLabelled('authors.panels.title*')[0]).toBeDisabled();
    expect(checkbox('hideOnTeaser')).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
    expect(addLink()).toBeDisabled();
  });

  it('shows a load error with a retry', async () => {
    const { user } = renderAuthors('/authors/edit/author-1', {
      mocks: [
        listMock,
        ...pickers(),
        {
          request: { query: AuthorDocument, variables: { id: 'author-1' } },
          error: new Error('Author offline'),
        },
        authorMock(ada),
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

  it('shows a load error for an author that does not exist', async () => {
    renderAuthors('/authors/edit/author-gone', {
      mocks: [
        listMock,
        ...pickers(),
        {
          request: { query: AuthorDocument, variables: { id: 'author-gone' } },
          result: { data: { author: null } },
        },
      ],
    });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });
});
