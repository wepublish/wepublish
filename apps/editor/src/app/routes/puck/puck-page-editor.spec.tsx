import '@testing-library/jest-dom/vitest';

import { act, screen } from '@testing-library/react';
import { FullPageFragment } from '@wepublish/editor/api';
import { RevisionHistoryPlugin } from '@wepublish/puck-content/editor';
import { PuckData, toApiDocument } from '@wepublish/puck-content/website';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import {
  toCreatePageVariables,
  toUpdatePageVariables,
} from './puck-document-mapping';
import type { PuckDocumentEditorProps } from './puck-editor';
import { PuckPageEditor } from './puck-page-editor';

const editor = vi.hoisted(() => ({
  props: undefined as unknown as PuckDocumentEditorProps<'page'>,
  mounts: 0,
}));

const apollo = vi.hoisted(() => ({
  page: vi.fn(),
  revisions: vi.fn(),
  createOptions: undefined as
    | undefined
    | {
        update?: (
          cache: { writeQuery: (options: unknown) => void },
          result: { data?: unknown }
        ) => void;
      },
  createPage: vi.fn(),
  updatePage: vi.fn(),
  publishPage: vi.fn(),
  restorePageRevision: vi.fn(),
}));

const snackbar = vi.hoisted(() => vi.fn());

vi.mock('./puck-editor', async () => {
  const { useEffect } = await import('react');

  return {
    PuckDocumentEditor: (props: PuckDocumentEditorProps<'page'>) => {
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
      Page: options => apollo.page(options),
      PageRevisionList: options => apollo.revisions(options),
    },
    mutations: {
      CreatePage: options => {
        apollo.createOptions = options as typeof apollo.createOptions;

        return [apollo.createPage, { loading: false }];
      },
      UpdatePage: () => [apollo.updatePage, { loading: false }],
      PublishPage: () => [apollo.publishPage, { loading: false }],
      RestorePageRevision: () => [
        apollo.restorePageRevision,
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

const page = {
  __typename: 'Page',
  id: 'page-1',
  slug: 'about',
  url: 'https://example.com/about',
  previewUrl: 'https://example.com/about?preview',
  publishedAt: '2026-09-01T08:00:00.000Z',
  hidden: false,
  hideHeader: true,
  hideFooter: false,
  tags: [],
  draft: null,
  pending: null,
  published: {
    __typename: 'PageRevision',
    id: 'revision-1',
    publishedAt: '2026-09-01T08:00:00.000Z',
  },
  latest: {
    __typename: 'PageRevision',
    id: 'revision-1',
    createdAt: '2026-09-01T07:00:00.000Z',
    publishedAt: '2026-09-01T08:00:00.000Z',
    title: 'About us',
    description: 'About the team',
    seoTitle: null,
    seoDescription: null,
    socialMediaTitle: null,
    socialMediaDescription: null,
    image: null,
    socialMediaImage: null,
    properties: [],
    puckBlocks: [],
    blocks: [],
  },
} as unknown as FullPageFragment;

const revisionNodes = [
  {
    __typename: 'PageRevision',
    id: 'revision-1',
    createdAt: '2026-09-01T07:00:00.000Z',
    publishedAt: '2026-09-01T08:00:00.000Z',
    archivedAt: null,
    title: 'About us',
    description: 'About the team',
    user: null,
  },
];

const skipped = { data: undefined, loading: false, refetch: vi.fn() };
const pageResult = {
  data: { page },
  loading: false,
  refetch: vi.fn(async () => undefined),
};
const revisionsResult = {
  data: {
    pageRevisions: {
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
    props: { title: 'Team', lead: 'Who we are', showNavigation: true },
  },
  content: [],
} as PuckData<'page'>;

function CurrentLocation() {
  const { pathname } = useLocation();

  return <output aria-label="Location">{pathname}</output>;
}

const renderEditor = (path: string) =>
  renderWithTheme(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/puck/pages/create"
          element={<PuckPageEditor />}
        />
        <Route
          path="/puck/pages/edit/:id"
          element={<PuckPageEditor />}
        />
      </Routes>
      <CurrentLocation />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  editor.mounts = 0;
  apollo.page.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : pageResult
  );
  apollo.revisions.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : revisionsResult
  );
  apollo.updatePage.mockResolvedValue({ data: { updatePage: page } });
  apollo.publishPage.mockResolvedValue({ data: { publishPage: page } });
  apollo.restorePageRevision.mockResolvedValue({
    data: { restorePageRevision: page },
  });
});

describe('PuckPageEditor', () => {
  it('loads the page into the page editor', () => {
    renderEditor('/puck/pages/edit/page-1');

    expect(apollo.page).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'page-1' }, skip: false })
    );
    expect(editor.props.kind).toBe('page');
    expect(editor.props.data).toEqual({
      root: {
        props: expect.objectContaining({
          title: 'About us',
          lead: 'About the team',
          showNavigation: false,
          showFooter: true,
        }),
      },
      content: [],
    });
    expect(editor.props.controller).toEqual(
      expect.objectContaining({
        backTo: '/pages',
        backLabel: 'back',
        status: 'published',
        statusLabel: 'pageEditor.overview.published',
        isNew: false,
        hasUnpublishedChanges: false,
        previewUrl: 'https://example.com/about?preview',
      })
    );
  });

  it('rebuilds nested puck content from the flat puck blocks', () => {
    apollo.page.mockReturnValue({
      ...pageResult,
      data: {
        page: {
          ...page,
          latest: {
            ...page.latest,
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

    renderEditor('/puck/pages/edit/page-1');

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
    renderEditor('/puck/pages/edit/page-1');

    const dialog = editor.props.publishDialogOf?.({ lead: 'Who we are' });

    expect(dialog?.title).toBe('pageEditor.panels.publishPage');
    expect(dialog?.checks[1]).toEqual(
      expect.objectContaining({ value: 'Who we are' })
    );
  });

  it('says so when the page does not exist', () => {
    apollo.page.mockReturnValue({ data: { page: null }, loading: false });

    renderEditor('/puck/pages/edit/page-1');

    expect(
      screen.getByText('pageEditor.overview.pageNotFound')
    ).toBeInTheDocument();
  });

  it('saves the puck blocks and the root props without touching the legacy blocks', async () => {
    renderEditor('/puck/pages/edit/page-1');

    await act(() => editor.props.controller.onSave(editedDocument));

    const { variables } = apollo.updatePage.mock.calls[0][0];

    expect(variables).toEqual(
      toUpdatePageVariables('page-1', toApiDocument('page', editedDocument))
    );
    expect(variables).not.toHaveProperty('blocks');
    expect(variables).toEqual(
      expect.objectContaining({ description: 'Who we are', hideHeader: false })
    );
    expect(snackbar).toHaveBeenCalledWith('', {
      variant: 'success',
      title: 'pageEditor.overview.pageDraftSaved',
      autoHideDuration: 2000,
    });
  });

  it('keeps the unsaved changes when saving fails', async () => {
    apollo.updatePage.mockRejectedValue(new Error('offline'));

    renderEditor('/puck/pages/edit/page-1');

    await expect(
      act(() => editor.props.controller.onSave(editedDocument))
    ).rejects.toThrow('offline');
    expect(snackbar).toHaveBeenCalledWith('offline', {
      variant: 'error',
      autoHideDuration: null,
    });
  });

  it('creates a new page and keeps editing it under its own address', async () => {
    apollo.createPage.mockResolvedValue({
      data: { createPage: { ...page, id: 'page-2' } },
    });

    renderEditor('/puck/pages/create');

    expect(editor.props.controller.isNew).toBe(true);

    await act(() => editor.props.controller.onSave(editedDocument));

    expect(apollo.createPage).toHaveBeenCalledWith({
      variables: toCreatePageVariables(toApiDocument('page', editedDocument)),
    });
    expect(screen.getByRole('status', { name: 'Location' })).toHaveTextContent(
      '/puck/pages/edit/page-2'
    );
  });

  it('remembers a created page so its editor opens without loading it again', () => {
    renderEditor('/puck/pages/create');

    const writeQuery = vi.fn();
    const created = { ...page, id: 'page-2' };

    apollo.createOptions?.update?.(
      { writeQuery },
      { data: { createPage: created } }
    );

    expect(writeQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'page-2' },
        data: { __typename: 'Query', page: created },
      })
    );
  });

  it('saves before it publishes, also without a slug', async () => {
    const publishedAt = new Date('2027-01-01T08:00:00.000Z');

    renderEditor('/puck/pages/edit/page-1');

    await act(() =>
      editor.props.controller.onPublish?.(editedDocument, publishedAt)
    );

    expect(apollo.publishPage).toHaveBeenCalledWith({
      variables: { id: 'page-1', publishedAt: publishedAt.toISOString() },
    });
    expect(apollo.updatePage.mock.invocationCallOrder[0]).toBeLessThan(
      apollo.publishPage.mock.invocationCallOrder[0]
    );
    expect(snackbar).toHaveBeenCalledWith('', {
      variant: 'success',
      title: 'pageEditor.overview.pagePending',
      autoHideDuration: 2000,
    });
  });

  it('loads the version history only once it is opened and restores from it', async () => {
    renderEditor('/puck/pages/edit/page-1');

    expect(apollo.revisions).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: true })
    );

    act(() =>
      editor.props.onPluginChange?.(RevisionHistoryPlugin.name ?? null)
    );

    expect(editor.props.revisionHistory?.revisions).toEqual([
      expect.objectContaining({
        id: 'revision-1',
        title: 'About us',
        subtitle: 'About the team',
      }),
    ]);

    await act(() => editor.props.revisionHistory?.onRestore('revision-1'));

    expect(apollo.restorePageRevision).toHaveBeenCalledWith({
      variables: { id: 'page-1', revisionId: 'revision-1' },
    });
    expect(editor.mounts).toBe(2);
    expect(editor.props.initialPlugin).toBe(RevisionHistoryPlugin.name);
  });
});
