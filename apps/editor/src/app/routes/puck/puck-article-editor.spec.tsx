import '@testing-library/jest-dom/vitest';

import { act, screen } from '@testing-library/react';
import { FullArticleFragment } from '@wepublish/editor/api';
import { RevisionHistoryPlugin } from '@wepublish/puck-content/editor';
import { PuckData, toApiDocument } from '@wepublish/puck-content/website';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import { PuckArticleEditor } from './puck-article-editor';
import {
  toCreateArticleVariables,
  toUpdateArticleVariables,
} from './puck-document-mapping';
import type { PuckDocumentEditorProps } from './puck-editor';

const editor = vi.hoisted(() => ({
  props: undefined as unknown as PuckDocumentEditorProps<'article'>,
  mounts: 0,
}));

const apollo = vi.hoisted(() => ({
  article: vi.fn(),
  revisions: vi.fn(),
  createOptions: undefined as
    | undefined
    | {
        update?: (
          cache: { writeQuery: (options: unknown) => void },
          result: { data?: unknown }
        ) => void;
      },
  createArticle: vi.fn(),
  updateArticle: vi.fn(),
  publishArticle: vi.fn(),
  restoreArticleRevision: vi.fn(),
}));

const snackbar = vi.hoisted(() => vi.fn());

vi.mock('./puck-editor', async () => {
  const { useEffect } = await import('react');

  return {
    PuckDocumentEditor: (props: PuckDocumentEditorProps<'article'>) => {
      editor.props = props;

      useEffect(() => {
        editor.mounts++;
      }, []);

      return null;
    },
  };
});

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');
  const actual = await importOriginal<typeof import('@apollo/client/react')>();

  return routeApolloByOperation(actual, {
    queries: {
      Article: options => apollo.article(options),
      ArticleRevisionList: options => apollo.revisions(options),
    },
    mutations: {
      CreateArticle: options => {
        apollo.createOptions = options as typeof apollo.createOptions;

        return [apollo.createArticle, { loading: false }];
      },
      UpdateArticle: () => [apollo.updateArticle, { loading: false }],
      PublishArticle: () => [apollo.publishArticle, { loading: false }],
      RestoreArticleRevision: () => [
        apollo.restoreArticleRevision,
        { loading: false },
      ],
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

const article = {
  __typename: 'Article',
  id: 'article-1',
  slug: 'the-slug',
  url: 'https://example.com/a/the-slug',
  previewUrl: 'https://example.com/a/the-slug?preview',
  publishedAt: null,
  shared: false,
  hidden: false,
  disableComments: false,
  likes: 3,
  paywallId: null,
  tags: [],
  draft: { __typename: 'ArticleRevision', id: 'revision-2' },
  pending: null,
  published: null,
  latest: {
    __typename: 'ArticleRevision',
    id: 'revision-2',
    createdAt: '2026-10-01T08:00:00.000Z',
    publishedAt: null,
    preTitle: null,
    title: 'Title',
    lead: 'Lead',
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    breaking: false,
    hideAuthor: false,
    socialMediaTitle: null,
    socialMediaDescription: null,
    authors: [
      {
        __typename: 'ArticleRevisionAuthor',
        role: 'Text',
        author: author('author-1', 'Ada'),
      },
    ],
    socialMediaAuthors: [],
    image: null,
    socialMediaImage: null,
    properties: [],
    puckBlocks: [],
    blocks: [],
  },
} as unknown as FullArticleFragment;

const revisionNodes = [
  {
    __typename: 'ArticleRevision',
    id: 'revision-1',
    createdAt: '2026-09-01T08:00:00.000Z',
    publishedAt: null,
    archivedAt: null,
    preTitle: null,
    title: 'First draft',
    lead: 'First lead',
    user: { __typename: 'User', id: 'user-1', name: 'Ada', firstName: null },
  },
];

const skipped = { data: undefined, loading: false, refetch: vi.fn() };
const articleResult = {
  data: { article },
  loading: false,
  refetch: vi.fn(async () => undefined),
};
const revisionsResult = {
  data: {
    articleRevisions: {
      nodes: revisionNodes,
      totalCount: 1,
      pageInfo: { hasNextPage: false },
    },
  },
  loading: false,
  refetch: vi.fn(async () => undefined),
  fetchMore: vi.fn(),
};

const editedDocument = {
  root: {
    props: {
      title: 'Edited title',
      slug: 'edited-slug',
      authorIds: ['author-1', 'author-2'],
    },
  },
  content: [],
} as PuckData<'article'>;

function CurrentLocation() {
  const { pathname } = useLocation();

  return <output aria-label="Location">{pathname}</output>;
}

const renderEditor = (path: string) =>
  renderWithTheme(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/puck/articles/create"
          element={<PuckArticleEditor />}
        />
        <Route
          path="/puck/articles/edit/:id"
          element={<PuckArticleEditor />}
        />
      </Routes>
      <CurrentLocation />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  editor.mounts = 0;
  apollo.article.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : articleResult
  );
  apollo.revisions.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : revisionsResult
  );
  apollo.updateArticle.mockResolvedValue({ data: { updateArticle: article } });
  apollo.publishArticle.mockResolvedValue({
    data: { publishArticle: article },
  });
  apollo.restoreArticleRevision.mockResolvedValue({
    data: { restoreArticleRevision: article },
  });
});

describe('PuckArticleEditor', () => {
  it('loads the article into the article editor', () => {
    renderEditor('/puck/articles/edit/article-1');

    expect(apollo.article).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'article-1' }, skip: false })
    );
    expect(editor.props.kind).toBe('article');
    expect(editor.props.data).toEqual({
      root: {
        props: expect.objectContaining({
          title: 'Title',
          lead: 'Lead',
          slug: 'the-slug',
          authorIds: ['author-1'],
        }),
      },
      content: [],
    });
    expect(editor.props.controller).toEqual(
      expect.objectContaining({
        backTo: '/articles',
        backLabel: 'articleEditor.overview.back',
        status: 'draft',
        statusLabel: 'articleEditor.overview.unpublished',
        isNew: false,
        hasUnpublishedChanges: true,
        canSave: true,
        canPublish: true,
        lastSavedAt: new Date('2026-10-01T08:00:00.000Z'),
        previewUrl: 'https://example.com/a/the-slug?preview',
        autosave: expect.objectContaining({ enabled: true }),
      })
    );
  });

  it('rebuilds nested puck content from the flat puck blocks', () => {
    apollo.article.mockReturnValue({
      ...articleResult,
      data: {
        article: {
          ...article,
          latest: {
            ...article.latest,
            puckBlocks: [
              {
                __typename: 'PuckBlock',
                id: 'Title-2',
                type: 'Title',
                parentId: 'Grid-1',
                slot: 'content',
                position: 0,
                locked: null,
                visibility: null,
                styling: null,
                datasources: null,
                data: { title: 'Nested' },
              },
              {
                __typename: 'PuckBlock',
                id: 'Grid-1',
                type: 'Grid',
                parentId: null,
                slot: null,
                position: 0,
                locked: null,
                visibility: null,
                styling: null,
                datasources: null,
                data: { content: [] },
              },
            ],
          },
        },
      },
    });

    renderEditor('/puck/articles/edit/article-1');

    expect(editor.props.data.content).toEqual([
      {
        type: 'Grid',
        props: {
          id: 'Grid-1',
          content: [
            { type: 'Title', props: { id: 'Title-2', title: 'Nested' } },
          ],
        },
      },
    ]);
  });

  it('builds the publish dialog from the root props being edited', () => {
    renderEditor('/puck/articles/edit/article-1');

    const dialog = editor.props.publishDialogOf?.({ slug: 'edited-slug' });

    expect(dialog?.title).toBe('articleEditor.panels.publishArticle');
    expect(dialog?.checks[0]).toEqual(
      expect.objectContaining({ value: 'edited-slug', required: true })
    );
  });

  it('starts a new article without loading one', () => {
    renderEditor('/puck/articles/create');

    expect(apollo.article).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(editor.props.data).toEqual({ root: { props: {} }, content: [] });
    expect(editor.props.controller).toEqual(
      expect.objectContaining({ isNew: true, status: 'draft' })
    );
  });

  it('shows that the article is loading', () => {
    apollo.article.mockReturnValue({ data: undefined, loading: true });

    renderEditor('/puck/articles/edit/article-1');

    expect(
      screen.getByRole('progressbar', { name: 'loading' })
    ).toBeInTheDocument();
  });

  it('says so when the article does not exist', () => {
    apollo.article.mockReturnValue({ data: { article: null }, loading: false });

    renderEditor('/puck/articles/edit/article-1');

    expect(
      screen.getByText('articleEditor.overview.notFound')
    ).toBeInTheDocument();
  });

  it('says so when the saved puck blocks cannot be loaded', () => {
    apollo.article.mockReturnValue({
      ...articleResult,
      data: {
        article: {
          ...article,
          latest: { ...article.latest, puckBlocks: [{ nonsense: true }] },
        },
      },
    });

    renderEditor('/puck/articles/edit/article-1');

    expect(screen.getByText('puck.loadFailed')).toBeInTheDocument();
  });

  it('saves the puck blocks and the root props without touching the legacy blocks', async () => {
    renderEditor('/puck/articles/edit/article-1');

    await act(() => editor.props.controller.onSave(editedDocument));

    const { variables } = apollo.updateArticle.mock.calls[0][0];

    expect(variables).toEqual(
      toUpdateArticleVariables(
        'article-1',
        toApiDocument('article', editedDocument),
        article
      )
    );
    expect(variables).not.toHaveProperty('blocks');
    expect(variables.authors).toEqual([
      { authorId: 'author-1', role: 'Text' },
      { authorId: 'author-2', role: undefined },
    ]);
    expect(snackbar).toHaveBeenCalledWith('', {
      variant: 'success',
      title: 'articleEditor.overview.draftSaved',
      autoHideDuration: 2000,
    });
    expect(articleResult.refetch).toHaveBeenCalled();
  });

  it('keeps the unsaved changes when saving fails', async () => {
    apollo.updateArticle.mockRejectedValue(new Error('offline'));

    renderEditor('/puck/articles/edit/article-1');

    await expect(
      act(() => editor.props.controller.onSave(editedDocument))
    ).rejects.toThrow('offline');
    expect(snackbar).toHaveBeenCalledWith('offline', {
      variant: 'error',
      autoHideDuration: null,
    });
  });

  it('creates a new article and keeps editing it under its own address', async () => {
    apollo.createArticle.mockResolvedValue({
      data: { createArticle: { ...article, id: 'article-2' } },
    });

    renderEditor('/puck/articles/create');

    await act(() => editor.props.controller.onSave(editedDocument));

    expect(apollo.createArticle).toHaveBeenCalledWith({
      variables: toCreateArticleVariables(
        toApiDocument('article', editedDocument)
      ),
    });
    expect(screen.getByRole('status', { name: 'Location' })).toHaveTextContent(
      '/puck/articles/edit/article-2'
    );
    expect(snackbar).toHaveBeenCalledWith('', {
      variant: 'success',
      title: 'articleEditor.overview.draftCreated',
      autoHideDuration: 2000,
    });
  });

  it('remembers a created article so its editor opens without loading it again', () => {
    renderEditor('/puck/articles/create');

    const writeQuery = vi.fn();
    const created = { ...article, id: 'article-2' };

    apollo.createOptions?.update?.(
      { writeQuery },
      { data: { createArticle: created } }
    );

    expect(writeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'article-2' },
        data: { __typename: 'Query', article: created },
      })
    );
  });

  it('saves before it publishes', async () => {
    const publishedAt = new Date('2026-10-02T08:00:00.000Z');

    renderEditor('/puck/articles/edit/article-1');

    await act(() =>
      editor.props.controller.onPublish?.(editedDocument, publishedAt)
    );

    expect(apollo.publishArticle).toHaveBeenCalledWith({
      variables: { id: 'article-1', publishedAt: publishedAt.toISOString() },
    });
    expect(apollo.updateArticle.mock.invocationCallOrder[0]).toBeLessThan(
      apollo.publishArticle.mock.invocationCallOrder[0]
    );
    expect(snackbar).toHaveBeenCalledWith('', {
      variant: 'success',
      title: 'articleEditor.overview.articlePublished',
      autoHideDuration: 2000,
    });
  });

  it('refuses to publish an article without a slug', async () => {
    renderEditor('/puck/articles/edit/article-1');

    await expect(
      act(() =>
        editor.props.controller.onPublish?.(
          { root: { props: { title: 'No slug' } }, content: [] },
          new Date()
        )
      )
    ).rejects.toThrow('articleEditor.overview.noSlug');
    expect(apollo.publishArticle).not.toHaveBeenCalled();
    expect(snackbar).toHaveBeenCalledWith('articleEditor.overview.noSlug', {
      variant: 'error',
      autoHideDuration: null,
    });
  });

  it('loads the version history only once it is opened', () => {
    renderEditor('/puck/articles/edit/article-1');

    expect(apollo.revisions).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: true })
    );

    act(() =>
      editor.props.onPluginChange?.(RevisionHistoryPlugin.name ?? null)
    );

    expect(apollo.revisions).toHaveBeenLastCalledWith(
      expect.objectContaining({
        variables: { id: 'article-1', take: 20, skip: 0 },
        skip: false,
      })
    );
    expect(editor.props.revisionHistory).toEqual(
      expect.objectContaining({
        revisions: [
          {
            id: 'revision-1',
            createdAt: '2026-09-01T08:00:00.000Z',
            publishedAt: null,
            archivedAt: null,
            title: 'First draft',
            subtitle: 'First lead',
            author: revisionNodes[0].user,
          },
        ],
        draftId: 'revision-2',
        totalCount: 1,
        hasMore: false,
        canRestore: true,
      })
    );
  });

  it('reopens the editor with the restored version and its history', async () => {
    renderEditor('/puck/articles/edit/article-1');
    act(() =>
      editor.props.onPluginChange?.(RevisionHistoryPlugin.name ?? null)
    );

    await act(() => editor.props.revisionHistory?.onRestore('revision-1'));

    expect(apollo.restoreArticleRevision).toHaveBeenCalledWith({
      variables: { id: 'article-1', revisionId: 'revision-1' },
    });
    expect(editor.mounts).toBe(2);
    expect(editor.props.initialPlugin).toBe(RevisionHistoryPlugin.name);
    expect(snackbar).toHaveBeenCalledWith('', {
      variant: 'success',
      title: 'versionHistory.restored',
      autoHideDuration: 2000,
    });
  });
});
