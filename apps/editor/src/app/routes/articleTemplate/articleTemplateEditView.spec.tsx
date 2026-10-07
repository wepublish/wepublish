import '@testing-library/jest-dom/vitest';

import { MockedProvider } from '@apollo/client/testing/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { BlockStylesDocument } from '@wepublish/editor/api';
import {
  CanCreateArticleTemplate,
  CanUpdateArticleTemplate,
} from '@wepublish/permissions';

import { ArticleTemplateEditView } from './articleTemplateEditView';

const useArticleTemplateQuery = vi.fn();
const useArticleQuery = vi.fn();
const createArticleTemplate = vi.fn();
const updateArticleTemplate = vi.fn();
const refetch = vi.fn();
const isAuthorised = vi.fn((permission: string) => true);

const operationName = (document: unknown) =>
  (document as { definitions?: { name?: { value?: string } }[] })
    ?.definitions?.[0]?.name?.value;

vi.mock('@apollo/client/react', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, unknown>;

  return {
    ...actual,
    useQuery: (document: unknown, options?: unknown) => {
      switch (operationName(document)) {
        case 'ArticleTemplate':
          return useArticleTemplateQuery(options);
        case 'Article':
          return useArticleQuery(options);
        case 'SettingsList':
          return { data: undefined };
        case 'BlockTemplateList':
          return {
            data: { blockTemplates: { nodes: [] } },
            loading: false,
            refetch: vi.fn(),
          };
        default:
          return (actual.useQuery as (...args: unknown[]) => unknown)(
            document,
            options
          );
      }
    },
    useMutation: (document: unknown) => {
      switch (operationName(document)) {
        case 'CreateArticleTemplate':
          return [createArticleTemplate, {}];
        case 'UpdateArticleTemplate':
          return [updateArticleTemplate, {}];
        default:
          return [vi.fn(), {}];
      }
    },
  };
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  useAuthorisation: (permission: string) => isAuthorised(permission),
  useUnsavedChangesDialog: () => () => true,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children?: unknown }) => children,
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

const blockStylesMock = [
  {
    request: { query: BlockStylesDocument, variables: {} },
    result: { data: { blockStyles: [] } },
  },
];

const titleBlock = (title: string) => ({
  __typename: 'TitleBlock',
  type: 'title',
  blockStyle: null,
  disabled: false,
  preTitle: null,
  title,
  lead: null,
});

const articleTemplate = ({
  modifiedAt = '2026-01-01T00:00:00.000Z',
  blocks = [titleBlock('Saved Title')],
} = {}) => ({
  __typename: 'ArticleTemplate',
  id: 'article-template-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt,
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt,
    name: 'News Template',
    blocks,
  },
  metadata: {
    __typename: 'ArticleTemplateMetadata',
    preTitle: null,
    title: 'Metadata Title',
    lead: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    breaking: true,
    hideAuthor: false,
    shared: false,
    hidden: false,
    disableComments: true,
    paywallId: 'paywall-1',
    socialMediaTitle: null,
    socialMediaDescription: null,
    tags: [{ __typename: 'Tag', id: 'tag-1', tag: 'Tag' }],
    authors: [],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
});

const mockQuery = (template = articleTemplate()) => {
  useArticleTemplateQuery.mockReturnValue({
    data: { articleTemplate: template },
    refetch,
    loading: false,
  });
};

const view = (path = '/articles/templates/edit/article-template-1') => (
  <MockedProvider mocks={blockStylesMock}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/articles/templates/create"
          element={<ArticleTemplateEditView />}
        />
        <Route
          path="/articles/templates/edit/:id"
          element={<ArticleTemplateEditView />}
        />
      </Routes>
    </MemoryRouter>
  </MockedProvider>
);

const nameInput = () =>
  screen.getByPlaceholderText(
    'articleTemplates.edit.name'
  ) as HTMLTextAreaElement;

beforeEach(() => {
  vi.clearAllMocks();
  isAuthorised.mockImplementation(() => true);
  useArticleQuery.mockReturnValue({ data: undefined, loading: false });
  mockQuery();
  updateArticleTemplate.mockResolvedValue({});
});

describe('ArticleTemplateEditView', () => {
  it('should take over the loaded article template', () => {
    render(view());

    expect(useArticleTemplateQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'article-template-1' },
        skip: false,
      })
    );
    expect(nameInput().value).toBe('News Template');
    expect(screen.getByDisplayValue('Saved Title')).toBeInTheDocument();
  });

  it('should show the metadata of the article template', async () => {
    render(view());

    fireEvent.click(
      screen.getByRole('button', { name: /articleTemplates.edit.metadata/ })
    );

    expect(
      await screen.findByDisplayValue('Metadata Title')
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('articleEditor.panels.slug')
    ).not.toBeInTheDocument();
  });

  it('should save the content and the metadata of the article template', async () => {
    render(view());

    fireEvent.change(nameInput(), { target: { value: 'Renamed Template' } });
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(updateArticleTemplate).toHaveBeenCalled());

    expect(updateArticleTemplate).toHaveBeenCalledWith({
      variables: {
        id: 'article-template-1',
        name: 'Renamed Template',
        blocks: [
          {
            title: expect.objectContaining({ title: 'Saved Title' }),
          },
        ],
        metadata: expect.objectContaining({
          title: 'Metadata Title',
          breaking: true,
          disableComments: true,
          paywallId: 'paywall-1',
          tagIds: ['tag-1'],
        }),
      },
    });
  });

  it('should keep unsaved changes when the query result changes without a new revision', () => {
    const { rerender } = render(view());

    fireEvent.change(nameInput(), { target: { value: 'Renamed Template' } });

    mockQuery(articleTemplate());
    rerender(view());

    expect(nameInput().value).toBe('Renamed Template');
  });

  it('should create a new article template and open it', async () => {
    useArticleTemplateQuery.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });
    createArticleTemplate.mockResolvedValue({
      data: { createArticleTemplate: { id: 'new-template' } },
    });

    render(view('/articles/templates/create'));

    expect(useArticleTemplateQuery).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );

    fireEvent.change(nameInput(), { target: { value: 'New Template' } });
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(createArticleTemplate).toHaveBeenCalledWith({
        variables: expect.objectContaining({
          name: 'New Template',
          metadata: expect.objectContaining({ title: '' }),
        }),
      })
    );

    expect(
      createArticleTemplate.mock.calls[0][0].variables.blocks
    ).toHaveLength(2);
  });

  it('should create a copy of an existing article template', async () => {
    useArticleTemplateQuery.mockImplementation(
      ({ variables, skip }: { variables: { id: string }; skip: boolean }) =>
        !skip && variables.id === 'article-template-1' ?
          {
            data: { articleTemplate: articleTemplate() },
            loading: false,
            refetch,
          }
        : { data: undefined, loading: false, refetch }
    );
    createArticleTemplate.mockResolvedValue({
      data: { createArticleTemplate: { id: 'copied-template' } },
    });

    render(view('/articles/templates/create?copyFrom=article-template-1'));

    expect(nameInput().value).toBe(
      'articleTemplates.edit.copyName:News Template'
    );
    expect(screen.getByDisplayValue('Saved Title')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^create$/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(createArticleTemplate).toHaveBeenCalledWith({
        variables: {
          name: 'articleTemplates.edit.copyName:News Template',
          blocks: [
            {
              title: expect.objectContaining({ title: 'Saved Title' }),
            },
          ],
          metadata: expect.objectContaining({
            title: 'Metadata Title',
            paywallId: 'paywall-1',
            tagIds: ['tag-1'],
          }),
        },
      })
    );
    expect(updateArticleTemplate).not.toHaveBeenCalled();
  });

  it('should create an article template from an article', async () => {
    useArticleTemplateQuery.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });
    useArticleQuery.mockImplementation(
      ({ variables, skip }: { variables: { id: string }; skip: boolean }) =>
        !skip && variables.id === 'article-1' ?
          {
            data: {
              article: {
                __typename: 'Article',
                id: 'article-1',
                slug: 'slug',
                url: 'https://example.com/a/slug',
                shared: false,
                hidden: true,
                disableComments: false,
                likes: 5,
                paywallId: null,
                tags: [{ __typename: 'Tag', id: 'tag-2', tag: 'Other' }],
                trackingPixels: [],
                latest: {
                  __typename: 'ArticleRevision',
                  preTitle: null,
                  title: 'Article Title',
                  lead: 'Article Lead',
                  seoTitle: null,
                  seoDescription: null,
                  breaking: false,
                  hideAuthor: false,
                  canonicalUrl: null,
                  socialMediaTitle: null,
                  socialMediaDescription: null,
                  authors: [],
                  socialMediaAuthors: [],
                  image: null,
                  socialMediaImage: null,
                  properties: [],
                  blocks: [titleBlock('Article Block Title')],
                },
              },
            },
            loading: false,
          }
        : { data: undefined, loading: false }
    );
    createArticleTemplate.mockResolvedValue({
      data: { createArticleTemplate: { id: 'new-template' } },
    });

    render(view('/articles/templates/create?fromArticle=article-1'));

    expect(nameInput().value).toBe('Article Title');
    expect(screen.getByDisplayValue('Article Block Title')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^create$/i }));

    await waitFor(() =>
      expect(createArticleTemplate).toHaveBeenCalledWith({
        variables: {
          name: 'Article Title',
          blocks: [
            {
              title: expect.objectContaining({ title: 'Article Block Title' }),
            },
          ],
          metadata: expect.objectContaining({
            title: 'Article Title',
            lead: 'Article Lead',
            hidden: true,
            tagIds: ['tag-2'],
          }),
        },
      })
    );
  });

  it('should show that the template to copy is loading', () => {
    useArticleTemplateQuery.mockImplementation(({ skip }: { skip: boolean }) =>
      skip ?
        { data: undefined, loading: false, refetch }
      : { data: undefined, loading: true, refetch }
    );

    render(view('/articles/templates/create?copyFrom=article-template-1'));

    expect(
      screen.getByText('articleTemplates.edit.loadingTemplate')
    ).toBeInTheDocument();
  });

  it('should show that the article is loading', () => {
    useArticleTemplateQuery.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });
    useArticleQuery.mockReturnValue({ data: undefined, loading: true });

    render(view('/articles/templates/create?fromArticle=article-1'));

    expect(
      screen.getByText('articleTemplates.edit.loadingArticle')
    ).toBeInTheDocument();
  });

  it('should not show a loader for a new empty template', () => {
    useArticleTemplateQuery.mockReturnValue({
      data: undefined,
      refetch,
      loading: false,
    });

    render(view('/articles/templates/create'));

    expect(
      screen.queryByText('articleTemplates.edit.loadingTemplate')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('articleTemplates.edit.loadingArticle')
    ).not.toBeInTheDocument();
  });

  describe('permissions', () => {
    const onlyPermitted = (permitted: string) =>
      isAuthorised.mockImplementation(permission => permission === permitted);

    it('should allow saving an existing template with the update permission', () => {
      onlyPermitted(CanUpdateArticleTemplate.id);
      render(view());

      expect(nameInput()).toBeEnabled();
      expect(screen.getByRole('button', { name: /^save$/i })).toBeEnabled();
    });

    it('should not allow saving an existing template with the create permission only', () => {
      onlyPermitted(CanCreateArticleTemplate.id);
      render(view());

      expect(screen.getByRole('button', { name: /^save$/i })).toBeDisabled();
    });

    it('should allow creating a template with the create permission', () => {
      useArticleTemplateQuery.mockReturnValue({
        data: undefined,
        refetch,
        loading: false,
      });
      onlyPermitted(CanCreateArticleTemplate.id);
      render(view('/articles/templates/create'));

      expect(screen.getByRole('button', { name: /^create$/i })).toBeEnabled();
    });

    it('should not allow creating a template with the update permission only', () => {
      useArticleTemplateQuery.mockReturnValue({
        data: undefined,
        refetch,
        loading: false,
      });
      onlyPermitted(CanUpdateArticleTemplate.id);
      render(view('/articles/templates/create'));

      expect(screen.getByRole('button', { name: /^create$/i })).toBeDisabled();
    });
  });
});
