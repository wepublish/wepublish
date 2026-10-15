import '@testing-library/jest-dom/vitest';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { PageEditor } from './pageEditor';

const queries = vi.hoisted(() => ({
  page: vi.fn(),
  pageTemplate: vi.fn(),
}));

const captured = vi.hoisted(() => ({
  blocks: [] as unknown[],
  metadataPanel: undefined as
    | undefined
    | {
        value: { slug?: string; title?: string; description?: string };
        onCreateTemplate?: () => void;
      },
}));

const titleBlock = (title: string) => ({
  __typename: 'TitleBlock',
  type: 'title',
  blockStyle: null,
  disabled: false,
  preTitle: null,
  title,
  lead: null,
});

const page = {
  __typename: 'Page',
  id: 'page-1',
  slug: 'about',
  url: 'https://example.com/about',
  previewUrl: 'https://example.com/about?preview',
  hidden: false,
  tags: [],
  draft: { id: 'rev-1' },
  published: null,
  pending: null,
  latest: {
    __typename: 'PageRevision',
    id: 'rev-1',
    createdAt: '2026-09-30T10:00:00.000Z',
    publishedAt: null,
    title: 'About us',
    description: 'About the team',
    seoTitle: null,
    seoDescription: null,
    image: null,
    socialMediaTitle: null,
    socialMediaDescription: null,
    socialMediaImage: null,
    properties: [],
    blocks: [titleBlock('Page Block')],
  },
};

const pageTemplate = {
  __typename: 'PageTemplate',
  id: 'template-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-1',
    name: 'Landing',
    createdAt: '2026-01-01T00:00:00.000Z',
    modifiedAt: '2026-01-01T00:00:00.000Z',
    blocks: [titleBlock('Template Block')],
  },
  metadata: {
    __typename: 'PageTemplateMetadata',
    title: 'Template Title',
    description: 'Template Description',
    seoTitle: null,
    seoDescription: null,
    hidden: false,
    socialMediaTitle: null,
    socialMediaDescription: null,
    tags: [],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
};

const revisionList = vi.hoisted(() => ({
  data: undefined,
  loading: false,
  refetch: () => undefined,
  fetchMore: () => undefined,
}));

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');
  const actual = await importOriginal<typeof import('@apollo/client/react')>();

  return {
    ...routeApolloByOperation(actual, {
      queries: {
        Page: options => queries.page(options),
        PageTemplate: options => queries.pageTemplate(options),
        PageRevisionList: () => revisionList,
      },
    }),
    useLazyQuery: () => [vi.fn(), { data: undefined }],
    useMutation: () => [vi.fn(), { loading: false }],
  };
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  PermissionControl: ({ children }: { children?: unknown }) => children,
  useAuthorisation: () => true,
  useUnsavedChangesDialog: () => () => true,
  BlockList: ({ value }: { value: unknown[] }) => {
    captured.blocks = value;
    return null;
  },
  TeaserOverviewPanel: () => null,
  PageMetadataPanel: (props: typeof captured.metadataPanel) => {
    captured.metadataPanel = props;
    return null;
  },
  VersionHistory: () => null,
  PublishPagePanel: () => null,
  RevisionContentPreview: () => null,
}));

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

function CurrentLocation() {
  const { pathname, search } = useLocation();

  return <div data-testid="location">{`${pathname}${search}`}</div>;
}

const renderEditor = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/pages/create"
          element={<PageEditor />}
        />
        <Route
          path="/pages/edit/:id"
          element={<PageEditor />}
        />
        <Route
          path="*"
          element={<CurrentLocation />}
        />
      </Routes>
    </MemoryRouter>
  );

// Results are kept stable across renders, as the editor repopulates from every
// new result.
const skipped = { data: undefined, loading: false, refetch: vi.fn() };
const pageResult = { data: { page }, loading: false, refetch: vi.fn() };
const pageTemplateResult = { data: { pageTemplate }, loading: false };

const openMetadata = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /pageEditor.overview.metadata/ })
  );

beforeEach(() => {
  vi.clearAllMocks();
  captured.blocks = [];
  captured.metadataPanel = undefined;
  queries.page.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : pageResult
  );
  queries.pageTemplate.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : pageTemplateResult
  );
});

describe('PageEditor', () => {
  it('should start a new page without blocks', () => {
    renderEditor('/pages/create');

    expect(queries.pageTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ skip: true })
    );
    expect(captured.blocks).toEqual([]);
  });

  it('should start a new page from a page template', () => {
    renderEditor('/pages/create?templateId=template-1');
    openMetadata();

    expect(queries.pageTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'template-1' }, skip: false })
    );
    expect(captured.blocks).toEqual([
      expect.objectContaining({
        value: expect.objectContaining({ title: 'Template Block' }),
      }),
    ]);
    expect(captured.metadataPanel?.value).toEqual(
      expect.objectContaining({
        slug: '',
        title: 'Template Title',
        description: 'Template Description',
      })
    );
  });

  it('should show that the page template is loading', () => {
    const loading = { data: undefined, loading: true };
    queries.pageTemplate.mockReturnValue(loading);

    renderEditor('/pages/create?templateId=template-1');

    expect(
      screen.getByText('pageEditor.overview.loadingTemplate')
    ).toBeInTheDocument();
  });

  it('should load an existing page', () => {
    renderEditor('/pages/edit/page-1');
    openMetadata();

    expect(captured.metadataPanel?.value).toEqual(
      expect.objectContaining({
        slug: 'about',
        title: 'About us',
        description: 'About the team',
      })
    );
    expect(captured.blocks).toEqual([
      expect.objectContaining({
        value: expect.objectContaining({ title: 'Page Block' }),
      }),
    ]);
  });

  it('should create a page template from an existing page', () => {
    renderEditor('/pages/edit/page-1');
    openMetadata();

    act(() => captured.metadataPanel?.onCreateTemplate?.());

    expect(screen.getByTestId('location')).toHaveTextContent(
      '/pages/templates/create?fromPage=page-1'
    );
  });

  it('should not create a page template from an unsaved page', () => {
    renderEditor('/pages/create');
    openMetadata();

    expect(captured.metadataPanel).toBeDefined();
    expect(captured.metadataPanel?.onCreateTemplate).toBeUndefined();
  });
});
