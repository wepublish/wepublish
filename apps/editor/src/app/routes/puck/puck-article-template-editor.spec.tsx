import '@testing-library/jest-dom/vitest';

import { act, screen } from '@testing-library/react';
import {
  FullArticleFragment,
  FullArticleTemplateFragment,
} from '@wepublish/editor/api';
import {
  getPuckConfig,
  PuckData,
  toPuckDocument,
} from '@wepublish/puck-content/editor';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import { PuckArticleTemplateEditor } from './puck-article-template-editor';
import type { PuckDocumentEditorProps } from './puck-editor';
import {
  toCreateArticleTemplateVariables,
  toUpdateArticleTemplateVariables,
} from './puck-template-mapping';

const editor = vi.hoisted(() => ({
  props: undefined as unknown as PuckDocumentEditorProps<'article'>,
}));

const apollo = vi.hoisted(() => ({
  template: vi.fn(),
  article: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}));

const snackbar = vi.hoisted(() => vi.fn());

vi.mock('./puck-editor', () => ({
  PuckDocumentEditor: (props: PuckDocumentEditorProps<'article'>) => {
    editor.props = props;

    return null;
  },
}));

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');
  const actual = await importOriginal<typeof import('@apollo/client/react')>();

  return routeApolloByOperation(actual, {
    queries: {
      ArticleTemplate: options => apollo.template(options),
      Article: options => apollo.article(options),
    },
    mutations: {
      CreateArticleTemplate: () => [apollo.createTemplate, { loading: false }],
      UpdateArticleTemplate: () => [apollo.updateTemplate, { loading: false }],
    },
  });
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  enqueueSnackbar: (...args: unknown[]) => snackbar(...args),
}));

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

const author = (id: string, name: string) => ({
  __typename: 'Author',
  id,
  name,
});

const template = {
  __typename: 'ArticleTemplate',
  id: 'article-template-1',
  createdAt: '2026-10-01T08:00:00.000Z',
  modifiedAt: '2026-10-02T08:00:00.000Z',
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    name: 'News',
    blocks: [],
    puckBlocks: [
      {
        __typename: 'PuckBlock',
        id: 'Heading-1',
        kind: 'puck',
        type: 'Heading',
        parentId: null,
        puckSlot: null,
        position: 0,
        props: { text: 'Hello' },
      },
    ],
    puckRegistry: null,
  },
  metadata: {
    __typename: 'ArticleTemplateMetadata',
    preTitle: null,
    title: 'Template title',
    lead: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    breaking: true,
    hideAuthor: false,
    shared: false,
    hidden: false,
    disableComments: false,
    paywallId: null,
    socialMediaTitle: null,
    socialMediaDescription: null,
    tags: [],
    authors: [
      {
        __typename: 'ArticleRevisionAuthor',
        role: 'Photos',
        author: author('author-1', 'Ada'),
      },
    ],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
} as unknown as FullArticleTemplateFragment;

const article = {
  __typename: 'Article',
  id: 'article-1',
  slug: 'the-slug',
  shared: false,
  hidden: false,
  disableComments: false,
  paywallId: null,
  tags: [],
  latest: {
    __typename: 'ArticleRevision',
    title: 'Article title',
    authors: [
      {
        __typename: 'ArticleRevisionAuthor',
        role: 'Text',
        author: author('author-2', 'Grace'),
      },
    ],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
    puckBlocks: [],
    puckRegistry: null,
  },
} as unknown as FullArticleFragment;

const skipped = { data: undefined, loading: false, refetch: vi.fn() };
const templateResult = {
  data: { articleTemplate: template },
  loading: false,
  refetch: vi.fn(async () => undefined),
};

const editedDocument = (name: string) =>
  ({
    root: {
      props: {
        title: 'Edited title',
        authorIds: ['author-1'],
        templateName: name,
      },
    },
    content: [],
  }) as unknown as PuckData<'article'>;

const apiDocument = (data: PuckData<'article'>) =>
  toPuckDocument('article', data, getPuckConfig('article'));

function CurrentLocation() {
  const { pathname } = useLocation();

  return <output aria-label="Location">{pathname}</output>;
}

const renderEditor = (path: string) =>
  renderWithTheme(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/puck/templates/articles/create"
          element={<PuckArticleTemplateEditor />}
        />
        <Route
          path="/puck/templates/articles/edit/:id"
          element={<PuckArticleTemplateEditor />}
        />
      </Routes>
      <CurrentLocation />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  editor.props = undefined as never;
  apollo.template.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : templateResult
  );
  apollo.article.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : { data: { article }, loading: false }
  );
  apollo.updateTemplate.mockResolvedValue({
    data: { updateArticleTemplate: template },
  });
  apollo.createTemplate.mockResolvedValue({
    data: { createArticleTemplate: { ...template, id: 'new-template' } },
  });
});

describe('PuckArticleTemplateEditor', () => {
  it('loads the template into the article editor with its name', () => {
    renderEditor('/puck/templates/articles/edit/article-template-1');

    expect(apollo.template).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'article-template-1' },
        skip: false,
      })
    );
    expect(editor.props.kind).toBe('article');
    expect(editor.props.templateNameLabel).toBe('puck.templates.name');
    expect(editor.props.data.root.props).toEqual(
      expect.objectContaining({
        title: 'Template title',
        breaking: true,
        authorIds: ['author-1'],
        templateName: 'News',
      })
    );
    expect(editor.props.data.content).toEqual([
      expect.objectContaining({ type: 'Heading' }),
    ]);
  });

  it('only saves a template, without publishing, previewing or autosaving it', () => {
    renderEditor('/puck/templates/articles/edit/article-template-1');

    expect(editor.props.controller).toEqual(
      expect.objectContaining({
        backTo: '/articles/templates',
        backLabel: 'articleTemplates.edit.backToList',
        status: 'none',
        statusLabel: 'puck.templates.status',
        isNew: false,
        hasUnpublishedChanges: false,
        canSave: true,
        canPublish: false,
        lastSavedAt: new Date('2026-10-02T08:00:00.000Z'),
      })
    );
    expect(editor.props.controller.onPublish).toBeUndefined();
    expect(editor.props.controller.previewUrl).toBeUndefined();
    expect(editor.props.controller.autosave).toBeUndefined();
    expect(editor.props.revisionHistory).toBeUndefined();
  });

  it('saves the puck document, the metadata and the name of the template', async () => {
    renderEditor('/puck/templates/articles/edit/article-template-1');

    const document = editedDocument('Renamed');

    await act(() => editor.props.controller.onSave(document));

    expect(apollo.updateTemplate).toHaveBeenCalledWith({
      variables: toUpdateArticleTemplateVariables(
        'article-template-1',
        apiDocument(document),
        template.metadata
      ),
    });
    expect(apollo.updateTemplate.mock.calls[0][0].variables).toEqual(
      expect.objectContaining({
        name: 'Renamed',
        metadata: expect.objectContaining({
          authors: [{ authorId: 'author-1', role: 'Photos' }],
        }),
      })
    );
    expect(templateResult.refetch).toHaveBeenCalled();
  });

  it('refuses to save a template without a name', async () => {
    renderEditor('/puck/templates/articles/edit/article-template-1');

    await expect(
      act(() => editor.props.controller.onSave(editedDocument('  ')))
    ).rejects.toThrow('puck.templates.nameRequired');

    expect(apollo.updateTemplate).not.toHaveBeenCalled();
    expect(snackbar).toHaveBeenCalledWith(
      'puck.templates.nameRequired',
      expect.objectContaining({ variant: 'error' })
    );
  });

  it('creates a new template and keeps editing it under its own address', async () => {
    renderEditor('/puck/templates/articles/create');

    expect(apollo.template).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(editor.props.controller.isNew).toBe(true);
    expect(editor.props.data).toEqual({
      root: { props: { templateName: '' } },
      content: [],
    });

    const document = editedDocument('Fresh');

    await act(() => editor.props.controller.onSave(document));

    expect(apollo.createTemplate).toHaveBeenCalledWith({
      variables: toCreateArticleTemplateVariables(apiDocument(document)),
    });
    expect(screen.getByRole('status', { name: 'Location' })).toHaveTextContent(
      '/puck/templates/articles/edit/new-template'
    );
  });

  it('starts a copy of a template under a new name', async () => {
    renderEditor('/puck/templates/articles/create?copyFrom=article-template-1');

    expect(apollo.template).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'article-template-1' },
        skip: false,
      })
    );
    expect(editor.props.controller.isNew).toBe(true);
    expect(editor.props.data.root.props).toEqual(
      expect.objectContaining({
        title: 'Template title',
        templateName: 'articleTemplates.edit.copyName:News',
      })
    );

    const document = editedDocument('Copy');

    await act(() => editor.props.controller.onSave(document));

    expect(apollo.createTemplate).toHaveBeenCalledWith({
      variables: toCreateArticleTemplateVariables(
        apiDocument(document),
        template.metadata
      ),
    });
    expect(apollo.updateTemplate).not.toHaveBeenCalled();
  });

  it('starts a template from the saved content of an article', async () => {
    renderEditor('/puck/templates/articles/create?fromArticle=article-1');

    expect(apollo.article).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'article-1' }, skip: false })
    );
    expect(editor.props.data.root.props).toEqual(
      expect.objectContaining({
        title: 'Article title',
        authorIds: ['author-2'],
        templateName: 'Article title',
      })
    );
    expect(editor.props.data.root.props).not.toHaveProperty('slug');

    const document = {
      root: { props: { authorIds: ['author-2'], templateName: 'From' } },
      content: [],
    } as unknown as PuckData<'article'>;

    await act(() => editor.props.controller.onSave(document));

    expect(
      apollo.createTemplate.mock.calls[0][0].variables.metadata.authors
    ).toEqual([{ authorId: 'author-2', role: 'Text' }]);
  });

  it('shows that the template is loading', () => {
    apollo.template.mockReturnValue({ ...skipped, loading: true });

    renderEditor('/puck/templates/articles/edit/article-template-1');

    expect(editor.props).toBeUndefined();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('says so when the template does not exist', () => {
    apollo.template.mockReturnValue({
      ...skipped,
      data: { articleTemplate: null },
    });

    renderEditor('/puck/templates/articles/edit/missing');

    expect(editor.props).toBeUndefined();
    expect(screen.getByText('puck.templates.notFound')).toBeInTheDocument();
  });
});
