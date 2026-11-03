import '@testing-library/jest-dom/vitest';

import { CombinedGraphQLErrors } from '@apollo/client';
import { act, screen } from '@testing-library/react';
import { useContext } from 'react';
import {
  EditedBlockTemplateContext,
  getPuckConfig,
  PuckData,
  toPuckDocument,
} from '@wepublish/puck-content/editor';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { renderWithTheme } from '../templates/testUtils';
import { PuckBlockTemplateEditor } from './puck-block-template-editor';
import type { PuckDocumentEditorProps } from './puck-editor';

const editor = vi.hoisted(() => ({
  props: undefined as unknown as PuckDocumentEditorProps<'page'>,
  editedTemplate: undefined as string | null | undefined,
}));

const apollo = vi.hoisted(() => ({
  template: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
}));

vi.mock('./puck-editor', () => ({
  PuckDocumentEditor: (props: PuckDocumentEditorProps<'page'>) => {
    editor.props = props;
    editor.editedTemplate = useContext(EditedBlockTemplateContext);

    return null;
  },
}));

vi.mock('@apollo/client/react', async importOriginal => {
  const { routeApolloByOperation } = await import('../templates/testUtils');
  const actual = await importOriginal<typeof import('@apollo/client/react')>();

  return routeApolloByOperation(actual, {
    queries: { PuckBlockTemplate: options => apollo.template(options) },
    mutations: {
      CreatePuckBlockTemplate: () => [
        apollo.createTemplate,
        { loading: false },
      ],
      UpdatePuckBlockTemplate: () => [
        apollo.updateTemplate,
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
  enqueueSnackbar: vi.fn(),
}));

vi.mock(
  'react-i18next',
  async () => (await import('../templates/testUtils')).translationMock
);

const template = {
  __typename: 'BlockTemplate',
  id: 'block-template-1',
  createdAt: '2026-10-01T08:00:00.000Z',
  modifiedAt: '2026-10-02T08:00:00.000Z',
  name: 'Rubric header',
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
};

const skipped = { data: undefined, loading: false, refetch: vi.fn() };
const templateResult = {
  data: { blockTemplate: template },
  loading: false,
  refetch: vi.fn(async () => undefined),
};

const edited = {
  root: { props: { templateName: 'Renamed' } },
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
          path="/puck/templates/blocks/create"
          element={<PuckBlockTemplateEditor />}
        />
        <Route
          path="/puck/templates/blocks/edit/:id"
          element={<PuckBlockTemplateEditor />}
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
  apollo.updateTemplate.mockResolvedValue({
    data: { updateBlockTemplate: template },
  });
  apollo.createTemplate.mockResolvedValue({
    data: { createBlockTemplate: { ...template, id: 'new-template' } },
  });
});

describe('PuckBlockTemplateEditor', () => {
  it('loads the block template without document settings', () => {
    renderEditor('/puck/templates/blocks/edit/block-template-1');

    expect(apollo.template).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: { id: 'block-template-1' },
        skip: false,
      })
    );
    expect(editor.props.blockTemplate).toBe(true);
    expect(editor.props.templateNameLabel).toBe('puck.templates.name');
    expect(editor.props.data.root.props).toEqual({
      templateName: 'Rubric header',
    });
    expect(editor.props.data.content).toEqual([
      expect.objectContaining({ type: 'Heading' }),
    ]);
    expect(editor.props.controller).toEqual(
      expect.objectContaining({
        backTo: '/block-content/templates',
        backLabel: 'blockTemplates.list.title',
        status: 'none',
        statusLabel: 'puck.templates.status',
        isNew: false,
        canPublish: false,
      })
    );
  });

  it('saves the blocks and the name of the block template', async () => {
    renderEditor('/puck/templates/blocks/edit/block-template-1');

    await act(() => editor.props.controller.onSave(edited));

    const { puckBlocks, puckRegistry } = apiDocument(edited);

    expect(apollo.updateTemplate).toHaveBeenCalledWith({
      variables: {
        id: 'block-template-1',
        name: 'Renamed',
        puckBlocks,
        puckRegistry,
      },
    });
  });

  it('creates a block template and keeps editing it under its own address', async () => {
    renderEditor('/puck/templates/blocks/create');

    expect(editor.props.controller.isNew).toBe(true);
    expect(editor.props.data).toEqual({
      root: { props: { templateName: '' } },
      content: [],
    });

    await act(() => editor.props.controller.onSave(edited));

    expect(apollo.createTemplate).toHaveBeenCalledWith({
      variables: expect.objectContaining({ name: 'Renamed' }),
    });
    expect(screen.getByRole('status', { name: 'Location' })).toHaveTextContent(
      '/puck/templates/blocks/edit/new-template'
    );
  });

  it('starts a copy of a block template under a new name', () => {
    renderEditor('/puck/templates/blocks/create?copyFrom=block-template-1');

    expect(editor.props.controller.isNew).toBe(true);
    expect(editor.props.data.root.props).toEqual({
      templateName: 'blockTemplates.edit.copyName:Rubric header',
    });
  });

  it('refuses to save a block template without a name', async () => {
    renderEditor('/puck/templates/blocks/edit/block-template-1');

    await expect(
      act(() =>
        editor.props.controller.onSave({ root: { props: {} }, content: [] })
      )
    ).rejects.toThrow('puck.templates.nameRequired');
    expect(apollo.updateTemplate).not.toHaveBeenCalled();
  });

  it('explains a rejected save of a block template that would contain itself', async () => {
    apollo.updateTemplate.mockRejectedValue(
      new CombinedGraphQLErrors({
        errors: [
          { message: 'Block templates can not contain circular references.' },
        ],
      })
    );

    renderEditor('/puck/templates/blocks/edit/block-template-1');

    await expect(
      act(() =>
        editor.props.controller.onSave({
          root: { props: { templateName: 'Rubric header' } },
          content: [],
        })
      )
    ).rejects.toThrow();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'errors.circularBlockTemplate',
      expect.objectContaining({ variant: 'error' })
    );
  });

  it('tells the blocks panel which template is edited, so it is never linked into itself', () => {
    renderEditor('/puck/templates/blocks/edit/block-template-1');

    expect(editor.editedTemplate).toBe('block-template-1');
  });

  it('says so when the block template does not exist', () => {
    apollo.template.mockReturnValue({
      ...skipped,
      data: { blockTemplate: null },
    });

    renderEditor('/puck/templates/blocks/edit/missing');

    expect(screen.getByText('puck.templates.notFound')).toBeInTheDocument();
  });
});
