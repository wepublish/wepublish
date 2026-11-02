import '@testing-library/jest-dom/vitest';

import { act, screen } from '@testing-library/react';
import {
  FullPageFragment,
  FullPageTemplateFragment,
} from '@wepublish/editor/api';
import {
  getPuckConfig,
  PuckData,
  toPuckDocument,
} from '@wepublish/puck-content/editor';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import type { PuckDocumentEditorProps } from './puck-editor';
import { PuckPageTemplateEditor } from './puck-page-template-editor';
import {
  toCreatePageTemplateVariables,
  toUpdatePageTemplateVariables,
} from './puck-template-mapping';

const editor = vi.hoisted(() => ({
  props: undefined as unknown as PuckDocumentEditorProps<'page'>,
}));

const apollo = vi.hoisted(() => ({
  template: vi.fn(),
  page: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}));

vi.mock('./puck-editor', () => ({
  PuckDocumentEditor: (props: PuckDocumentEditorProps<'page'>) => {
    editor.props = props;

    return null;
  },
}));

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');
  const actual = await importOriginal<typeof import('@apollo/client/react')>();

  return routeApolloByOperation(actual, {
    queries: {
      PageTemplate: options => apollo.template(options),
      Page: options => apollo.page(options),
    },
    mutations: {
      CreatePageTemplate: () => [apollo.createTemplate, { loading: false }],
      UpdatePageTemplate: () => [apollo.updateTemplate, { loading: false }],
    },
  });
});

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...((await importOriginal()) as object),
  createCheckedPermissionComponent:
    () =>
    <T,>(component: T) =>
      component,
  enqueueSnackbar: vi.fn(),
}));

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

const template = {
  __typename: 'PageTemplate',
  id: 'page-template-1',
  createdAt: '2026-10-01T08:00:00.000Z',
  modifiedAt: '2026-10-02T08:00:00.000Z',
  blockTemplate: {
    __typename: 'BlockTemplate',
    id: 'block-template-2',
    name: 'Landing',
    blocks: [],
    puckBlocks: [],
    puckRegistry: null,
  },
  metadata: {
    __typename: 'PageTemplateMetadata',
    title: 'Landing title',
    description: null,
    seoTitle: null,
    seoDescription: null,
    hidden: false,
    hideHeader: true,
    hideFooter: false,
    socialMediaTitle: null,
    socialMediaDescription: null,
    tags: [],
    image: null,
    socialMediaImage: null,
    properties: [],
  },
} as unknown as FullPageTemplateFragment;

const page = {
  __typename: 'Page',
  id: 'page-1',
  slug: 'about',
  hidden: false,
  hideHeader: false,
  hideFooter: false,
  tags: [],
  latest: {
    __typename: 'PageRevision',
    title: 'About',
    description: null,
    image: null,
    socialMediaImage: null,
    properties: [],
    puckBlocks: [],
    puckRegistry: null,
  },
} as unknown as FullPageFragment;

const skipped = { data: undefined, loading: false, refetch: vi.fn() };
const templateResult = {
  data: { pageTemplate: template },
  loading: false,
  refetch: vi.fn(async () => undefined),
};

const editedDocument = {
  root: { props: { title: 'Edited', templateName: 'Renamed' } },
  content: [],
} as unknown as PuckData<'page'>;

const apiDocument = (data: PuckData<'page'>) =>
  toPuckDocument('page', data, getPuckConfig('page'));

function CurrentLocation() {
  const { pathname } = useLocation();

  return <output aria-label="Location">{pathname}</output>;
}

const renderEditor = (path: string) =>
  renderWithTheme(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/puck/templates/pages/create"
          element={<PuckPageTemplateEditor />}
        />
        <Route
          path="/puck/templates/pages/edit/:id"
          element={<PuckPageTemplateEditor />}
        />
      </Routes>
      <CurrentLocation />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  apollo.template.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : templateResult
  );
  apollo.page.mockImplementation(({ skip }: { skip?: boolean }) =>
    skip ? skipped : { data: { page }, loading: false }
  );
  apollo.updateTemplate.mockResolvedValue({
    data: { updatePageTemplate: template },
  });
  apollo.createTemplate.mockResolvedValue({
    data: { createPageTemplate: { ...template, id: 'new-template' } },
  });
});

describe('PuckPageTemplateEditor', () => {
  it('loads the template into the page editor as a template', () => {
    renderEditor('/puck/templates/pages/edit/page-template-1');

    expect(editor.props.kind).toBe('page');
    expect(editor.props.templateNameLabel).toBe('puck.templates.name');
    expect(editor.props.data.root.props).toEqual(
      expect.objectContaining({
        title: 'Landing title',
        showNavigation: false,
        templateName: 'Landing',
      })
    );
    expect(editor.props.controller).toEqual(
      expect.objectContaining({
        backTo: '/pages/templates',
        backLabel: 'pageTemplates.edit.backToList',
        status: 'none',
        statusLabel: 'puck.templates.status',
        isNew: false,
        canPublish: false,
      })
    );
  });

  it('saves the puck document, the metadata and the name of the template', async () => {
    renderEditor('/puck/templates/pages/edit/page-template-1');

    await act(() => editor.props.controller.onSave(editedDocument));

    expect(apollo.updateTemplate).toHaveBeenCalledWith({
      variables: toUpdatePageTemplateVariables(
        'page-template-1',
        apiDocument(editedDocument)
      ),
    });
  });

  it('creates a new template and keeps editing it under its own address', async () => {
    renderEditor('/puck/templates/pages/create');

    await act(() => editor.props.controller.onSave(editedDocument));

    expect(apollo.createTemplate).toHaveBeenCalledWith({
      variables: toCreatePageTemplateVariables(apiDocument(editedDocument)),
    });
    expect(screen.getByRole('status', { name: 'Location' })).toHaveTextContent(
      '/puck/templates/pages/edit/new-template'
    );
  });

  it('starts a copy of a template under a new name', () => {
    renderEditor('/puck/templates/pages/create?copyFrom=page-template-1');

    expect(editor.props.controller.isNew).toBe(true);
    expect(editor.props.data.root.props).toEqual(
      expect.objectContaining({
        templateName: 'pageTemplates.edit.copyName:Landing',
      })
    );
  });

  it('starts a template from the saved content of a page', () => {
    renderEditor('/puck/templates/pages/create?fromPage=page-1');

    expect(apollo.page).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { id: 'page-1' }, skip: false })
    );
    expect(editor.props.data.root.props).toEqual(
      expect.objectContaining({ title: 'About', templateName: 'About' })
    );
    expect(editor.props.data.root.props).not.toHaveProperty('slug');
  });

  it('refuses to save a template without a name', async () => {
    renderEditor('/puck/templates/pages/edit/page-template-1');

    await expect(
      act(() =>
        editor.props.controller.onSave({
          root: { props: { title: 'Unnamed' } },
          content: [],
        })
      )
    ).rejects.toThrow('puck.templates.nameRequired');
    expect(apollo.updateTemplate).not.toHaveBeenCalled();
  });
});
