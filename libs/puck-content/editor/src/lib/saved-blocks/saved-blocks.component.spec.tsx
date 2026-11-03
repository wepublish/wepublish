import { MockedProvider, MockedResponse } from '@apollo/client/testing/react';
import { Config, createUsePuck, Data, Puck, UiState } from '@puckeditor/core';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  CreatePuckBlockTemplateDocument,
  PuckBlockTemplateListDocument,
} from '@wepublish/editor/api';
import { MemoryRouter } from 'react-router-dom';

import { PuckActionBar } from '../action-bar/action-bar.component';
import { PuckBlockDataContext } from '../block-data/puck-block-data.context';
import { blockLibraryPlugin } from '../block-library/block-library';
import { withSavedBlocksPlaceholder } from './saved-blocks';
import { EditedBlockTemplateContext } from './edited-block-template.context';
import { savedBlocksPlugin } from './saved-blocks.plugin';

const snackbar = vi.hoisted(() => vi.fn());

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<object>()),
  enqueueSnackbar: snackbar,
}));

const usePuck = createUsePuck();

const config: Config = withSavedBlocksPlaceholder({
  components: {
    Title: {
      category: 'text',
      nameKey: 'puck.blocks.names.Title',
      render: () => <h1>Title</h1>,
    },
    Container: {
      category: 'layout',
      nameKey: 'puck.blocks.names.Container',
      fields: { content: { type: 'slot' } },
      render: ({ content: Content }) => <Content />,
    },
    LinkedTemplate: {
      hidden: true,
      render: () => <div />,
    },
  },
});

const puckBlock = (
  id: string,
  type: string,
  parentId: string | null = null,
  puckSlot: string | null = null
) => ({
  __typename: 'PuckBlock',
  id,
  kind: 'puck',
  type,
  parentId,
  puckSlot,
  position: 0,
  locked: null,
  grouped: null,
  visibility: null,
  styling: null,
  datasources: null,
  props: {},
});

const template = {
  __typename: 'BlockTemplate',
  id: 'template-1',
  createdAt: '2026-11-01T00:00:00.000Z',
  modifiedAt: '2026-11-01T00:00:00.000Z',
  name: 'Rubric header',
  puckBlocks: [
    puckBlock('Container-1', 'Container'),
    puckBlock('Title-1', 'Title', 'Container-1', 'content'),
  ],
  puckRegistry: null,
  linkedTemplateIds: [],
};

const listMock = (
  nodes: unknown[],
  variables: Record<string, unknown> = {},
  hasNextPage = false
): MockedResponse => ({
  request: {
    query: PuckBlockTemplateListDocument,
    variables: { take: 100, ...variables },
  },
  result: {
    data: {
      blockTemplates: {
        __typename: 'PaginatedBlockTemplate',
        nodes,
        totalCount: nodes.length,
        pageInfo: { __typename: 'PageInfo', hasNextPage },
      },
    },
  },
  maxUsageCount: 10,
});

function Content() {
  const content = usePuck(puck => puck.appState.data.content);
  const histories = usePuck(puck => puck.history.histories);

  return (
    <>
      <output data-testid="content">{JSON.stringify(content)}</output>
      <output data-testid="history">
        {JSON.stringify(
          histories.map(({ state }) =>
            (state.data?.content ?? []).map(({ type }) => type)
          )
        )}
      </output>
    </>
  );
}

const historyTypes = () =>
  JSON.parse(screen.getByTestId('history').textContent ?? '[]') as string[][];

const settleHistory = () =>
  act(() => new Promise(resolve => setTimeout(resolve, 400)));

function DropPlaceholder() {
  const dispatch = usePuck(puck => puck.dispatch);

  return (
    <button
      type="button"
      onClick={() =>
        dispatch({
          type: 'insert',
          componentType: 'SavedBlocks',
          id: 'SavedBlocks-dropped',
          destinationIndex: 0,
          destinationZone: 'root:default-zone',
        })
      }
    >
      drop
    </button>
  );
}

const data: Data = { root: { props: {} }, content: [] };

const renderEditor = (
  mocks: MockedResponse[] = [listMock([template])],
  initial = data,
  ui?: Partial<UiState>,
  editedTemplateId: string | null = null
) =>
  render(
    <MockedProvider mocks={mocks}>
      <EditedBlockTemplateContext.Provider value={editedTemplateId}>
        <MemoryRouter>
          <Puck
            config={config}
            data={initial}
            ui={ui}
            plugins={[savedBlocksPlugin, blockLibraryPlugin]}
          >
            <Puck.Components />
            <PuckActionBar label="Block" />
            <Content />
            <DropPlaceholder />
          </Puck>
        </MemoryRouter>
      </EditedBlockTemplateContext.Provider>
    </MockedProvider>
  );

const content = () =>
  JSON.parse(screen.getByTestId('content').textContent ?? '[]') as {
    type: string;
    props: { id: string; content?: { type: string; props: { id: string } }[] };
  }[];

describe('saved blocks in the block library', () => {
  beforeEach(() => localStorage.clear());

  describe('while editing a block template', () => {
    const linking = {
      ...template,
      id: 'template-2',
      name: 'Links back',
      linkedTemplateIds: ['template-1'],
    };
    const unrelated = {
      ...template,
      id: 'template-3',
      name: 'Unrelated',
      linkedTemplateIds: ['template-4'],
    };
    const renderTemplateEditor = () =>
      renderEditor(
        [listMock([template, linking, unrelated])],
        data,
        undefined,
        'template-1'
      );

    it('inserts the edited template itself as a copy, never linked', async () => {
      renderTemplateEditor();

      fireEvent.click(
        await screen.findByRole('button', {
          name: 'More ways to insert “Rubric header”',
        })
      );

      expect(
        await screen.findByRole('menuitem', { name: 'Insert linked' })
      ).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(screen.getByRole('menuitem', { name: 'Insert as copy' }));

      expect(content().map(({ type }) => type)).toEqual(['Container']);
    });

    it('copies the edited template when its tile is clicked', async () => {
      renderTemplateEditor();

      fireEvent.click(
        await screen.findByRole('button', { name: 'Rubric header' })
      );

      expect(content().map(({ type }) => type)).toEqual(['Container']);
    });

    it('does not offer templates that link the edited template', async () => {
      renderTemplateEditor();

      await screen.findByRole('button', { name: 'Unrelated' });

      expect(screen.queryByRole('button', { name: 'Links back' })).toBeNull();
    });

    it('links unrelated templates as usual', async () => {
      renderTemplateEditor();

      fireEvent.click(await screen.findByRole('button', { name: 'Unrelated' }));

      expect(content()).toEqual([
        expect.objectContaining({
          type: 'LinkedTemplate',
          props: expect.objectContaining({ templateId: 'template-3' }),
        }),
      ]);
    });
  });

  it('lists the saved block templates and never the placeholder', async () => {
    renderEditor();

    const saved = await screen.findByRole('region', { name: 'Saved blocks' });

    expect(
      await within(saved).findByRole('button', { name: 'Rubric header' })
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'SavedBlocks' })).toBeNull();
  });

  it('finds saved block templates by their name', async () => {
    renderEditor();

    await screen.findByRole('button', { name: 'Rubric header' });

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'rubric' },
    });

    expect(
      await screen.findByRole('button', { name: 'Rubric header' })
    ).toBeVisible();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zzz' },
    });

    expect(screen.queryByRole('button', { name: 'Rubric header' })).toBeNull();
  });

  it('links the template when clicked, like the block editor does', async () => {
    renderEditor();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Rubric header' })
    );

    expect(content()).toEqual([
      {
        type: 'LinkedTemplate',
        props: {
          id: expect.stringMatching(/^LinkedTemplate-/),
          templateId: 'template-1',
        },
      },
    ]);
  });

  it('inserts a copy of the saved blocks with new ids on request', async () => {
    renderEditor();

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'More ways to insert “Rubric header”',
      })
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Insert as copy' })
    );

    const [container] = content();

    expect(container.type).toBe('Container');
    expect(container.props.id).toMatch(/^Container-/);
    expect(container.props.id).not.toBe('Container-1');
    expect(container.props.content?.[0].type).toBe('Title');
    expect(container.props.content?.[0].props.id).not.toBe('Title-1');
  });

  it('warns when a copied template component is skipped because the document has another one of that name', async () => {
    renderEditor(
      [
        listMock([
          {
            ...template,
            puckRegistry: {
              __typename: 'PuckRegistry',
              components: { Hero: { html: '<section>template</section>' } },
              styles: null,
              script: null,
            },
          },
        ]),
      ],
      {
        root: {
          props: {
            _dynamicConfig: {
              components: { Hero: { html: '<section>document</section>' } },
            },
          },
        },
        content: [],
      }
    );

    fireEvent.click(
      await screen.findByRole('button', {
        name: 'More ways to insert “Rubric header”',
      })
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Insert as copy' })
    );

    expect(snackbar).toHaveBeenCalledWith(
      expect.stringContaining('Hero'),
      expect.objectContaining({ variant: 'warning' })
    );
  });

  it('inserts independent copies each time', async () => {
    renderEditor();

    for (let copy = 0; copy < 2; copy++) {
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'More ways to insert “Rubric header”',
        })
      );
      fireEvent.click(
        await screen.findByRole('menuitem', { name: 'Insert as copy' })
      );
    }

    const ids = [
      ...screen.getByTestId('content').textContent!.matchAll(/"id":"([^"]+)"/g),
    ].map(([, id]) => id);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it('links the dragged template where it was dropped', async () => {
    renderEditor();

    const tile = await screen.findByRole('button', { name: 'Rubric header' });

    fireEvent.pointerDown(tile);
    fireEvent.click(screen.getByRole('button', { name: 'drop' }));

    await waitFor(() =>
      expect(content().map(({ type }) => type)).toEqual(['LinkedTemplate'])
    );
  });

  it('asks the API for saved blocks by name beyond the first page', async () => {
    const far = { ...template, id: 'template-far', name: 'Far away' };

    renderEditor([listMock([template]), listMock([far], { name: 'far' })]);

    await screen.findByRole('button', { name: 'Rubric header' });

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'far' },
    });

    expect(
      await screen.findByRole('button', { name: 'Far away' }, { timeout: 3000 })
    ).toBeVisible();
  });

  it('loads more saved blocks on request', async () => {
    const next = { ...template, id: 'template-2', name: 'Second page' };

    renderEditor([
      listMock([template], {}, true),
      listMock([next], { skip: 1 }),
    ]);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Load more saved blocks' })
    );

    expect(
      await screen.findByRole('button', { name: 'Second page' })
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Rubric header' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Load more saved blocks' })
    ).toBeNull();
  });

  it('makes a click insert one undo step', async () => {
    renderEditor();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Rubric header' })
    );
    await settleHistory();

    expect(historyTypes().at(-1)).toEqual(['LinkedTemplate']);
    expect(historyTypes().slice(0, -1)).not.toContainEqual(['LinkedTemplate']);
  });

  it('makes a drop one undo step, without the placeholder', async () => {
    renderEditor();

    const tile = await screen.findByRole('button', { name: 'Rubric header' });

    fireEvent.pointerDown(tile);
    fireEvent.click(screen.getByRole('button', { name: 'drop' }));
    await waitFor(() =>
      expect(content().map(({ type }) => type)).toEqual(['LinkedTemplate'])
    );
    await settleHistory();

    expect(historyTypes().at(-1)).toEqual(['LinkedTemplate']);
    expect(historyTypes().flat()).not.toContain('SavedBlocks');
  });

  it('drops nothing when no template was dragged', async () => {
    renderEditor();

    await screen.findByRole('button', { name: 'Rubric header' });

    fireEvent.click(screen.getByRole('button', { name: 'drop' }));

    await waitFor(() => expect(content()).toEqual([]));
  });

  it('points to creating a block template while there is none', async () => {
    renderEditor([listMock([])]);

    expect(
      await screen.findByText('Save a block from its toolbar to reuse it here.')
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'New block template' })
    ).toHaveAttribute('href', '/puck/templates/blocks/create');
  });
});

describe('saving a block as block template', () => {
  const selected: Data = {
    root: { props: {} },
    content: [
      {
        type: 'Container',
        props: {
          id: 'Container-1',
          content: [{ type: 'Title', props: { id: 'Title-1' } }],
        },
      },
    ],
  };

  it('saves the selected block with its children under the given name', async () => {
    const created = vi.fn(() => ({
      data: { createBlockTemplate: { ...template, id: 'template-2' } },
    }));

    renderEditor(
      [
        listMock([template]),
        {
          request: {
            query: CreatePuckBlockTemplateDocument,
            variables: {
              name: 'Saved container',
              puckBlocks: [
                {
                  id: 'Container-1',
                  kind: 'puck',
                  type: 'Container',
                  props: { content: [] },
                  children: [
                    {
                      id: 'Title-1',
                      kind: 'puck',
                      type: 'Title',
                      props: {},
                    },
                  ],
                },
              ],
              puckRegistry: null,
            },
          },
          result: created,
        },
      ],
      selected,
      { itemSelector: { index: 0, zone: 'root:default-zone' } }
    );

    fireEvent.click(
      await screen.findByRole('button', { name: 'Save as block template' })
    );

    const dialog = await screen.findByRole('dialog', {
      name: 'Save as block template',
    });

    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(
      within(dialog).getByRole('textbox', { name: 'Name' })
    ).toHaveAttribute('data-1p-ignore');
    expect(
      within(dialog).getByRole('textbox', { name: 'Name' })
    ).toHaveAttribute('autocomplete', 'off');

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Name' }), {
      target: { value: 'Saved container' },
    });

    await act(async () => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    });

    await waitFor(() => expect(created).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Save as block template' })
      ).toBeNull()
    );
  });
});

describe('a linked template in the action bar', () => {
  const linked: Data = {
    root: { props: {} },
    content: [
      { type: 'LinkedTemplate', props: { id: 'Linked-1', templateId: 'tpl' } },
    ],
  };

  const current = {
    __typename: 'PuckBlockTemplateData',
    id: 'tpl',
    name: 'Rubric header',
    puckRegistry: null,
    puckBlocks: [
      { ...puckBlock('Linked-1/Container-1', 'Container'), data: {} },
      {
        ...puckBlock(
          'Linked-1/Title-1',
          'Title',
          'Linked-1/Container-1',
          'content'
        ),
        data: {},
      },
    ],
  };

  const renderSelected = (template: unknown) =>
    render(
      <PuckBlockDataContext.Provider
        value={new Map([['Linked-1', { template } as never]])}
      >
        <MockedProvider
          mocks={[listMock([template ? (template as never) : []].flat())]}
        >
          <MemoryRouter>
            <Puck
              config={config}
              data={linked}
              ui={{ itemSelector: { index: 0, zone: 'root:default-zone' } }}
              plugins={[savedBlocksPlugin]}
            >
              <PuckActionBar label="Block" />
              <Content />
            </Puck>
          </MemoryRouter>
        </MockedProvider>
      </PuckBlockDataContext.Provider>
    );

  it('opens the template in a new tab to edit it', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);

    renderSelected(current);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Edit template' })
    );

    expect(open).toHaveBeenCalledWith(
      '/puck/templates/blocks/edit/tpl',
      '_blank',
      'noopener,noreferrer'
    );
    open.mockRestore();
  });

  it('replaces the link with a copy of the current template content', async () => {
    renderSelected(current);

    fireEvent.click(await screen.findByRole('button', { name: 'Unlink' }));

    const [container] = content();

    expect(container.type).toBe('Container');
    expect(container.props.id).not.toBe('Linked-1/Container-1');
    expect(container.props.content?.[0].type).toBe('Title');
  });

  it('cannot unlink a template that no longer exists', async () => {
    renderSelected(null);

    expect(
      await screen.findByRole('button', { name: 'Unlink' })
    ).toBeDisabled();
  });
});
