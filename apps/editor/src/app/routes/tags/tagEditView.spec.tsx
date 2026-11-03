import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import {
  type FullTagFragment,
  type TagQuery,
  type UpdateTagMutation,
  type UpdateTagMutationVariables,
  type WebsiteSettingsQuery,
  TagDocument,
  TagType,
  UpdateTagDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  queryFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanGetTags, CanUpdateTag } from '@wepublish/permissions';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Link } from 'react-router-dom';

import { TagEditView } from './tagEditView';

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        tags: {
          overview: { editTag: 'Edit {{tag}}' },
          form: { uniqueConstraint: 'Tag «{{tag}}» exists' },
        },
      },
    },
  },
});

const takenMessage =
  '\nInvalid `this.prisma.tag.update()` invocation in\n/app/dist/main.js:33987:50\n\n  33984 updateTag(_a) {\n  33985     return __awaiter(this, void 0, void 0, function* () {\n  33986         var { id, description } = _a, input = __rest(_a, ["id", "description"]);\n→ 33987         const result = yield this.prisma.tag.update(\nUnique constraint failed on the constraint: `tags_type_tag_key`';

const keyDisabled = {
  __typename: 'KeyEnabled',
  enabled: false,
  key: null,
} as const;

const websiteSettingsData: WebsiteSettingsQuery = {
  __typename: 'Query',
  websiteSettings: {
    __typename: 'WebsiteSettings',
    theme: {
      palette: {
        primary: { main: '#0e5c56' },
        secondary: { main: '#e9c46a' },
        accent: { main: '#f4a261' },
        info: { main: '#2a9d8f' },
        success: { main: '#2e7d32' },
        error: { main: '#d32f2f' },
        warning: { main: '#ed6c02' },
        text: { primary: '#1d1d1d' },
        background: { default: '#fafafa', paper: '#ffffff' },
      },
    },
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

const storedDescription: RichtextJSONDocument = {
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text: 'Vereinssport' }],
    },
  ],
};

const sport: FullTagFragment = {
  __typename: 'Tag',
  id: 'tag-1',
  tag: 'Sport',
  description: storedDescription,
  type: TagType.Article,
  main: true,
  url: 'https://example.com/a/tag/sport',
  color: '#0e5c56',
};

const theatre: FullTagFragment = {
  __typename: 'Tag',
  id: 'tag-2',
  tag: 'Kleintheater',
  description: null,
  type: TagType.Article,
  main: false,
  url: 'https://example.com/a/tag/kleintheater',
  color: null,
};

const viewer: AuthContextState = {
  session: {
    email: 'viewer@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'tag-viewer',
        name: 'tag-viewer',
        description: null,
        systemRole: false,
        permissions: [{ __typename: 'Permission', ...CanGetTags }],
      },
    ],
  },
};

const updater: AuthContextState = {
  session: {
    email: 'updater@example.com',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'tag-updater',
        name: 'tag-updater',
        description: null,
        systemRole: false,
        permissions: [{ __typename: 'Permission', ...CanUpdateTag }],
      },
    ],
  },
};

const tagListOf: Record<TagType, string> = {
  [TagType.Article]: '/articles/tags',
  [TagType.Page]: '/pages/tags',
  [TagType.Comment]: '/comments/tags',
  [TagType.Event]: '/events/tags',
  [TagType.Author]: '/authors/tags',
};

const requested = vi.fn<(variables: { id: string }) => void>();

const tagQuery = (
  tag: FullTagFragment = sport,
  delay?: number
): MockLink.MockedResponse => ({
  request: { query: TagDocument, variables: { id: tag.id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  delay,
  result: (variables: { id: string }) => {
    requested(variables);

    const data: TagQuery = { __typename: 'Query', tag };

    return { data };
  },
});

const failingTagQuery: MockLink.MockedResponse = {
  request: { query: TagDocument, variables: { id: 'tag-1' } },
  error: new Error('Server down'),
};

const sent = vi.fn<(variables: UpdateTagMutationVariables) => void>();

const savedTag = (variables: UpdateTagMutationVariables): object => {
  const data: UpdateTagMutation = {
    __typename: 'Mutation',
    updateTag: {
      ...sport,
      tag: variables.tag ?? null,
      main: variables.main ?? false,
      color: variables.color ?? null,
    },
  };

  return { data };
};

const updateTag = (
  result: (variables: UpdateTagMutationVariables) => object = savedTag
): MockLink.MockedResponse => ({
  request: { query: UpdateTagDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: UpdateTagMutationVariables) => {
    sent(variables);

    return result(variables);
  },
});

const failingOnce = (message: string) => {
  let calls = 0;

  return updateTag(variables => {
    calls += 1;

    return calls === 1 ? { errors: [{ message }] } : savedTag(variables);
  });
};

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

function AsViewer({ children }: { children: ReactNode }) {
  return (
    <Translated>
      <AuthContext.Provider value={viewer}>{children}</AuthContext.Provider>
    </Translated>
  );
}

function AsUpdater({ children }: { children: ReactNode }) {
  return (
    <Translated>
      <AuthContext.Provider value={updater}>{children}</AuthContext.Provider>
    </Translated>
  );
}

const renderTypedEditView = (type: TagType) =>
  renderFormRoutes(
    {
      '/articles/tags/edit/:id': <TagEditView type={TagType.Article} />,
      '/pages/tags/edit/:id': <TagEditView type={TagType.Page} />,
      '/comments/tags/edit/:id': <TagEditView type={TagType.Comment} />,
      '/events/tags/edit/:id': <TagEditView type={TagType.Event} />,
      '/authors/tags/edit/:id': <TagEditView type={TagType.Author} />,
    },
    {
      route: `${tagListOf[type]}/edit/tag-1`,
      mocks: [websiteSettings, tagQuery({ ...sport, type }), updateTag()],
      wrapper: Translated,
    }
  );

const renderEditView = (
  mocks: MockLink.MockedResponse[] = [tagQuery(), updateTag()],
  wrapper = Translated
) =>
  renderFormRoutes(
    {
      '/articles/tags/edit/:id': (
        <>
          <TagEditView type={TagType.Article} />
          <Link
            to="/articles/tags/edit/tag-2"
            data-testid="other-tag"
          />
        </>
      ),
    },
    {
      route: '/articles/tags/edit/tag-1',
      mocks: [websiteSettings, ...mocks],
      wrapper,
    }
  );

const nameField = () => getFieldByLabel(/^tags\.overview\.name/);

const colorField = () => getFieldByLabel(/^tags\.overview\.color/);

const mainCheckbox = () =>
  screen.getByRole('checkbox', { name: /^tags\.overview\.markAsMain/ });

const loaded = (name = 'Sport') =>
  waitFor(() => expect(nameField()).toHaveValue(name));

const sentVariables = () => sent.mock.calls.map(([variables]) => variables);

beforeEach(() => {
  sent.mockReset();
  requested.mockReset();
});

describe('TagEditView', () => {
  it('opens on the tag it was asked for', async () => {
    renderEditView();

    await loaded();

    expect(colorField()).toHaveValue('#0e5c56');
    expect(mainCheckbox()).toBeChecked();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/articles/tags'
    );
  });

  it('shows the header and a progress indicator while the tag loads', async () => {
    renderEditView([tagQuery(sport, 100), updateTag()]);

    expect(screen.getByText('Edit …')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(/^tags\.overview\.name/)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();

    await loaded();

    expect(screen.getByText('Edit Sport')).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeEnabled();
  });

  it('reports a failed load and loads again on retry', async () => {
    const { user } = renderEditView([failingTagQuery, tagQuery()]);

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(queryFieldByLabel(/^tags\.overview\.name/)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'form.loadError.retry' })
    );

    await loaded();
  });

  it('names the tag in the title while it is renamed', async () => {
    const { user } = renderEditView();

    await loaded();

    expect(screen.getByText('Edit Sport')).toBeInTheDocument();

    await user.type(nameField(), 's');

    expect(screen.getByText('Edit Sports')).toBeInTheDocument();
  });

  it('asks for the tag once', async () => {
    renderEditView();

    await loaded();

    expect(requested).toHaveBeenCalledTimes(1);
    expect(requested).toHaveBeenCalledWith({ id: 'tag-1' });
  });

  it('renders its sections as regions', async () => {
    renderEditView();

    await loaded();

    expect(
      formSectionOf('tags.form.sections.details').getByLabelText(
        /^tags\.overview\.name/,
        { selector: 'input' }
      )
    ).toHaveValue('Sport');
    expect(
      await formSectionOf('tags.form.sections.details').findByText(
        'Vereinssport'
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('tags.form.sections.display').getByRole('checkbox', {
        name: /^tags\.overview\.markAsMain/,
      })
    ).toBeChecked();
  });

  it('saves what was edited and stays on the tag', async () => {
    const { user, currentPath } = renderEditView();

    await loaded();
    await user.type(nameField(), 's');
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(sentVariables()).toStrictEqual([
      {
        id: 'tag-1',
        tag: 'Sports',
        description: storedDescription,
        main: true,
        color: '#0e5c56',
      },
    ]);
    expect(currentPath()).toBe('/articles/tags/edit/tag-1');
    expect(nameField()).toHaveValue('Sports');
  });

  it('goes back to the tag list after save and close', async () => {
    const { user, currentPath } = renderEditView();

    await loaded();
    await user.click(mainCheckbox());
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/articles/tags'));
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tag-1', main: false })
    );
  });

  it('removes the colour when the field is cleared', async () => {
    const { user } = renderEditView();

    await loaded();
    await user.clear(colorField());
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sentVariables()[0]).toStrictEqual({
      id: 'tag-1',
      tag: 'Sport',
      description: storedDescription,
      main: true,
      color: null,
    });
  });

  it('offers the colours of the website theme', async () => {
    const { user } = renderEditView();

    await loaded();
    await user.click(
      await screen.findByRole('button', { name: 'form.color.pick' })
    );

    expect(await screen.findByTitle('#e9c46a')).toBeInTheDocument();
  });

  it.each(Object.values(TagType))(
    'edits %s tags and goes back to their own list',
    async type => {
      const list = tagListOf[type];
      const { user, currentPath } = renderTypedEditView(type);

      await loaded();

      expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
        'href',
        list
      );

      await user.click(mainCheckbox());
      await user.click(screen.getByTestId('saveAndCloseButton'));

      await waitFor(() => expect(currentPath()).toBe(list));
      expect(sent).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'tag-1', main: false })
      );
    }
  );

  it('stays on the tag when a plain save follows a failed save and close', async () => {
    const { user, currentPath } = renderEditView([
      tagQuery(),
      failingOnce('Server down'),
    ]);

    await loaded();
    await user.type(nameField(), 's');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(currentPath()).toBe('/articles/tags/edit/tag-1');

    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(sent).toHaveBeenCalledTimes(2);
    expect(currentPath()).toBe('/articles/tags/edit/tag-1');
  });

  it('shows a taken name at the name field and stays on the tag', async () => {
    const { user, currentPath } = renderEditView([
      tagQuery(),
      failingOnce(takenMessage),
    ]);

    await loaded();
    await user.clear(nameField());
    await user.type(nameField(), 'Kleintheater');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription(
        'Tag «Kleintheater» exists'
      )
    );
    expect(currentPath()).toBe('/articles/tags/edit/tag-1');
    expect(screen.queryByText('toast.updatedSuccess')).not.toBeInTheDocument();
  });

  it('loads the other tag when the route switches to it', async () => {
    const { user } = renderEditView([tagQuery(), tagQuery(theatre)]);

    await loaded();
    await user.click(screen.getByTestId('other-tag'));

    await loaded('Kleintheater');
    expect(mainCheckbox()).not.toBeChecked();
    expect(colorField()).toHaveValue('');
    expect(screen.getByText('Edit Kleintheater')).toBeInTheDocument();
  });

  it('shows the tag read only to people who may only view tags', async () => {
    renderEditView([tagQuery()], AsViewer);

    await loaded();

    expect(screen.getByText('form.view.readOnly')).toBeInTheDocument();
    expect(nameField()).toBeDisabled();
    expect(mainCheckbox()).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
  });

  it('lets people who may update but not list tags edit them', async () => {
    const { user } = renderEditView([tagQuery(), updateTag()], AsUpdater);

    await loaded();

    expect(screen.queryByText('form.view.readOnly')).not.toBeInTheDocument();
    expect(screen.queryByText('permissions.noAccess')).not.toBeInTheDocument();
    expect(nameField()).toBeEnabled();

    await user.type(nameField(), 's');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'tag-1', tag: 'Sports' })
    );
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderEditView();

    await loaded();
    await user.click(mainCheckbox());
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', {
          name: 'form.view.discardChanges.title',
        })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/articles/tags/edit/tag-1');
    expect(mainCheckbox()).not.toBeChecked();
    expect(sent).not.toHaveBeenCalled();
  });
});
