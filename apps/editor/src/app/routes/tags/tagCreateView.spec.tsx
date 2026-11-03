import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  type CreateTagMutation,
  type CreateTagMutationVariables,
  type FullTagFragment,
  type WebsiteSettingsQuery,
  CreateTagDocument,
  TagType,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import { CanGetTags } from '@wepublish/permissions';
import { type AuthContextState, AuthContext } from '@wepublish/ui/editor';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { TagCreateView } from './tagCreateView';

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        tags: { form: { uniqueConstraint: 'Tag «{{tag}}» exists' } },
      },
    },
  },
});

const takenMessage =
  '\nInvalid `this.prisma.tag.create()` invocation in\n/app/dist/main.js:34000:50\n\n  33997 createTag(_a) {\n  33998     return __awaiter(this, void 0, void 0, function* () {\n  33999         var { description } = _a, input = __rest(_a, ["description"]);\n→ 34000         const result = yield this.prisma.tag.create(\nUnique constraint failed on the constraint: `tags_type_tag_key`';

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

const storedTag = (
  variables: CreateTagMutationVariables,
  id = 'tag-1'
): FullTagFragment => ({
  __typename: 'Tag',
  id,
  tag: variables.tag ?? null,
  description: variables.description ?? null,
  type: variables.type,
  main: variables.main ?? false,
  url: `https://example.com/a/tag/${variables.tag}`,
  color: variables.color ?? null,
});

const sent = vi.fn<(variables: CreateTagMutationVariables) => void>();

const createTag = (
  result?: (variables: CreateTagMutationVariables) => object
): MockLink.MockedResponse => ({
  request: { query: CreateTagDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: CreateTagMutationVariables) => {
    sent(variables);

    if (result) {
      return result(variables);
    }

    const data: CreateTagMutation = {
      __typename: 'Mutation',
      createTag: storedTag(variables),
    };

    return { data };
  },
});

const takenOnce = () => {
  let calls = 0;

  return createTag(variables => {
    calls += 1;

    return calls === 1 ?
        { errors: [{ message: takenMessage }] }
      : {
          data: {
            __typename: 'Mutation',
            createTag: storedTag(variables, 'tag-2'),
          },
        };
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

const tagListOf: Record<TagType, string> = {
  [TagType.Article]: '/articles/tags',
  [TagType.Page]: '/pages/tags',
  [TagType.Comment]: '/comments/tags',
  [TagType.Event]: '/events/tags',
  [TagType.Author]: '/authors/tags',
};

const renderCreateView = (
  mocks: MockLink.MockedResponse[] = [createTag()],
  route = '/articles/tags/create',
  wrapper = Translated
) =>
  renderFormRoutes(
    {
      '/articles/tags/create': <TagCreateView type={TagType.Article} />,
      '/pages/tags/create': <TagCreateView type={TagType.Page} />,
      '/comments/tags/create': <TagCreateView type={TagType.Comment} />,
      '/events/tags/create': <TagCreateView type={TagType.Event} />,
      '/authors/tags/create': <TagCreateView type={TagType.Author} />,
    },
    { route, mocks: [websiteSettings, ...mocks], wrapper }
  );

const typeDescription = async (user: UserEvent, text: string) => {
  const editable = await waitFor(() => {
    const found = screen
      .getByRole('region', { name: 'tags.form.sections.details' })
      .querySelector<HTMLElement>('.tiptap');

    if (!found) {
      throw new Error('The rich text editor has not mounted yet');
    }

    return found;
  });

  await user.click(editable.querySelector('p') ?? editable);
  await user.keyboard(text);
};

const nameField = () => getFieldByLabel(/^tags\.overview\.name/);

const colorField = () => getFieldByLabel(/^tags\.overview\.color/);

const mainCheckbox = () =>
  screen.getByRole('checkbox', { name: /^tags\.overview\.markAsMain/ });

const sentVariables = () => sent.mock.calls.map(([variables]) => variables);

beforeEach(() => {
  sent.mockReset();
});

describe('TagCreateView', () => {
  it('shows the header with the back link to the tag list', () => {
    renderCreateView();

    expect(screen.getByText('tags.form.titleCreate')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/articles/tags'
    );
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
    expect(screen.getByTestId('saveAndCloseButton')).toBeInTheDocument();
  });

  it('renders its sections as regions', () => {
    renderCreateView();

    expect(
      formSectionOf('tags.form.sections.details').getByLabelText(
        /^tags\.overview\.name/,
        { selector: 'input' }
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('tags.form.sections.details').getAllByText(
        /^tags\.overview\.description/
      ).length
    ).toBeGreaterThan(0);
    expect(
      formSectionOf('tags.form.sections.display').getByRole('checkbox', {
        name: /^tags\.overview\.markAsMain/,
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('tags.form.sections.display').getByLabelText(
        /^tags\.overview\.color/,
        { selector: 'input' }
      )
    ).toBeInTheDocument();
  });

  it('will not create a tag without a name', async () => {
    const { user } = renderCreateView();

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameField()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(nameField()).toHaveAccessibleDescription('form.errors.required');
    expect(sent).not.toHaveBeenCalled();
  });

  it('will not create a tag whose name is only blanks', async () => {
    const { user } = renderCreateView();

    await user.type(nameField(), '   ');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(nameField()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('creates the tag of its section and opens it', async () => {
    const { user, currentPath } = renderCreateView();

    await user.type(nameField(), 'Politics');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(currentPath()).toBe('/articles/tags/edit/tag-1')
    );
    expect(sentVariables()).toStrictEqual([
      {
        tag: 'Politics',
        description: null,
        main: false,
        color: null,
        type: TagType.Article,
      },
    ]);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('goes back to the tag list after save and close', async () => {
    const { user, currentPath } = renderCreateView();

    await user.type(nameField(), 'Politics');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/articles/tags'));
    expect(sent).toHaveBeenCalledTimes(1);
  });

  it('carries the main flag and the colour through', async () => {
    const { user } = renderCreateView();

    await user.type(nameField(), 'Politics');
    await user.click(mainCheckbox());
    await user.type(colorField(), '#0e5c56');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sentVariables()).toStrictEqual([
      {
        tag: 'Politics',
        description: null,
        main: true,
        color: '#0e5c56',
        type: TagType.Article,
      },
    ]);
  });

  it('sends the description that was typed', async () => {
    const { user } = renderCreateView();

    await user.type(nameField(), 'Politics');
    await typeDescription(user, 'Alles zur Politik');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(sent).toHaveBeenCalledTimes(1));
    expect(sentVariables()).toEqual([
      {
        tag: 'Politics',
        description: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              attrs: { textAlign: null },
              content: [{ type: 'text', text: 'Alles zur Politik' }],
            },
          ],
        },
        main: false,
        color: null,
        type: TagType.Article,
      },
    ]);
  });

  it('accepts only opaque colours, since the API stores #rrggbb', async () => {
    const { user } = renderCreateView();

    await user.type(nameField(), 'Politics');
    await user.type(colorField(), '#0e5c56ff');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(colorField()).toHaveAccessibleDescription(
        expect.stringContaining('form.color.invalid')
      )
    );
    expect(sent).not.toHaveBeenCalled();
  });

  it('offers the colours of the website theme', async () => {
    const { user } = renderCreateView();

    await user.click(
      await screen.findByRole('button', { name: 'form.color.pick' })
    );

    expect(await screen.findByTitle('#e9c46a')).toBeInTheDocument();
  });

  it.each(Object.values(TagType))(
    'creates %s tags from their own list and opens them there',
    async type => {
      const list = tagListOf[type];
      const { user, currentPath } = renderCreateView(
        [createTag()],
        `${list}/create`
      );

      expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
        'href',
        list
      );

      await user.type(nameField(), 'Service');
      await user.click(screen.getByTestId('saveButton'));

      await waitFor(() => expect(currentPath()).toBe(`${list}/edit/tag-1`));
      expect(sent).toHaveBeenCalledWith(
        expect.objectContaining({ tag: 'Service', type })
      );
    }
  );

  it('shows a taken name at the name field and stays on the page', async () => {
    const { user, currentPath } = renderCreateView([takenOnce()]);

    await user.type(nameField(), 'Kleintheater');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(nameField()).toHaveAccessibleDescription(
        'Tag «Kleintheater» exists'
      )
    );
    expect(screen.getAllByText('Tag «Kleintheater» exists')).toHaveLength(1);
    expect(currentPath()).toBe('/articles/tags/create');
    expect(nameField()).toHaveValue('Kleintheater');

    await user.type(nameField(), ' Bern');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(currentPath()).toBe('/articles/tags/edit/tag-2')
    );
    expect(sentVariables().map(({ tag }) => tag)).toEqual([
      'Kleintheater',
      'Kleintheater Bern',
    ]);
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderCreateView();

    await user.type(nameField(), 'Politics');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/articles/tags/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/articles/tags'));
    expect(sent).not.toHaveBeenCalled();
  });

  it('refuses people who may not create tags', () => {
    renderCreateView([createTag()], '/articles/tags/create', AsViewer);

    expect(screen.getByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
  });
});
