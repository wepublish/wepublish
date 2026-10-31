import {
  buildPuckBlockTree,
  FlatPuckBlockLike,
  PuckBlockNode,
} from './block-tree';

type Block = FlatPuckBlockLike & { type: string };

type Tree = { id: string; slots: Record<string, Tree[]> };

const toTree = ({ block, slots }: PuckBlockNode<Block>): Tree => ({
  id: block.id,
  slots: Object.fromEntries(
    [...slots].map(([slot, children]) => [slot, children.map(toTree)])
  ),
});

const treeOf = (flat: Block[]) => buildPuckBlockTree(flat).roots.map(toTree);

const ids = (nodes: PuckBlockNode<Block>[]) =>
  nodes.map(({ block }) => block.id);

const flatList: Block[] = [
  {
    id: 'Container-1',
    type: 'Container',
    parentId: null,
    puckSlot: null,
    position: 0,
  },
  {
    id: 'Title-2',
    type: 'Title',
    parentId: 'Container-1',
    puckSlot: 'content',
    position: 0,
  },
  {
    id: 'Grid-3',
    type: 'Grid',
    parentId: 'Container-1',
    puckSlot: 'content',
    position: 1,
  },
  {
    id: 'Quote-4',
    type: 'Quote',
    parentId: 'Grid-3',
    puckSlot: 'content',
    position: 0,
  },
  {
    id: 'DynamicGrid-5',
    type: 'DynamicGrid',
    parentId: null,
    puckSlot: null,
    position: 1,
  },
  {
    id: 'Image-6',
    type: 'Image',
    parentId: 'DynamicGrid-5',
    puckSlot: 'items[0].content',
    position: 0,
  },
  {
    id: 'Title-7',
    type: 'Title',
    parentId: 'DynamicGrid-5',
    puckSlot: 'items[1].content',
    position: 0,
  },
  {
    id: 'Quote-8',
    type: 'Quote',
    parentId: 'DynamicGrid-5',
    puckSlot: 'items[1].content',
    position: 1,
  },
];

const tree: Tree[] = [
  {
    id: 'Container-1',
    slots: {
      content: [
        { id: 'Title-2', slots: {} },
        { id: 'Grid-3', slots: { content: [{ id: 'Quote-4', slots: {} }] } },
      ],
    },
  },
  {
    id: 'DynamicGrid-5',
    slots: {
      'items[0].content': [{ id: 'Image-6', slots: {} }],
      'items[1].content': [
        { id: 'Title-7', slots: {} },
        { id: 'Quote-8', slots: {} },
      ],
    },
  },
];

describe('buildPuckBlockTree', () => {
  it('rebuilds the tree from the parent, slot and position of every block', () => {
    expect(treeOf(flatList)).toEqual(tree);
    expect(buildPuckBlockTree(flatList).unplaced).toEqual([]);
  });

  it('keeps the flat blocks as they are', () => {
    const [container] = buildPuckBlockTree(flatList).roots;

    expect(container.block).toBe(flatList[0]);
  });

  it('orders the blocks of a slot by their position, whatever order the list has', () => {
    expect(treeOf([...flatList].reverse())).toEqual(tree);
  });

  it('orders the top level blocks by their position', () => {
    expect(
      ids(
        buildPuckBlockTree([
          { id: 'Title-2', type: 'Title', position: 1 },
          { id: 'Title-3', type: 'Title', position: 2 },
          { id: 'Title-1', type: 'Title', position: 0 },
        ]).roots
      )
    ).toEqual(['Title-1', 'Title-2', 'Title-3']);
  });

  it('keeps the slots of a parent in the order the list names them', () => {
    const [grid] = buildPuckBlockTree([
      { id: 'DynamicGrid-1', type: 'DynamicGrid', position: 0 },
      {
        id: 'Title-3',
        type: 'Title',
        parentId: 'DynamicGrid-1',
        puckSlot: 'items[1].content',
        position: 0,
      },
      {
        id: 'Title-2',
        type: 'Title',
        parentId: 'DynamicGrid-1',
        puckSlot: 'items[0].content',
        position: 1,
      },
      {
        id: 'Image-4',
        type: 'Image',
        parentId: 'DynamicGrid-1',
        puckSlot: 'items[0].content',
        position: 0,
      },
    ]).roots;

    expect([...grid.slots].map(([slot, nodes]) => [slot, ids(nodes)])).toEqual([
      ['items[1].content', ['Title-3']],
      ['items[0].content', ['Image-4', 'Title-2']],
    ]);
  });

  it('puts children without a slot into the content slot', () => {
    expect(
      treeOf([
        { id: 'Container-1', type: 'Container', position: 0 },
        {
          id: 'Title-2',
          type: 'Title',
          parentId: 'Container-1',
          puckSlot: null,
          position: 0,
        },
      ])
    ).toEqual([
      { id: 'Container-1', slots: { content: [{ id: 'Title-2', slots: {} }] } },
    ]);
  });

  it('keeps dotted slot names as opaque keys', () => {
    expect(
      treeOf([
        { id: 'Hero-1', type: 'Hero', position: 0 },
        {
          id: 'Title-2',
          type: 'Title',
          parentId: 'Hero-1',
          puckSlot: 'hero.content',
          position: 0,
        },
      ])
    ).toEqual([
      {
        id: 'Hero-1',
        slots: { 'hero.content': [{ id: 'Title-2', slots: {} }] },
      },
    ]);
  });

  it('ignores the slot of top level blocks', () => {
    expect(
      treeOf([
        {
          id: 'Title-2',
          type: 'Title',
          puckSlot: 'items[0].content',
          position: 1,
        },
        { id: 'Title-1', type: 'Title', position: 0 },
      ])
    ).toEqual([
      { id: 'Title-1', slots: {} },
      { id: 'Title-2', slots: {} },
    ]);
  });

  it('leaves out the blocks it cannot reach from the top level', () => {
    const orphan = {
      id: 'Title-2',
      type: 'Title',
      parentId: 'Container-9',
      position: 0,
    };
    const ownParent = {
      id: 'Container-3',
      type: 'Container',
      parentId: 'Container-3',
      position: 0,
    };
    const { roots, unplaced } = buildPuckBlockTree([
      { id: 'Title-1', type: 'Title', position: 0 },
      orphan,
      ownParent,
    ]);

    expect(ids(roots)).toEqual(['Title-1']);
    expect(unplaced).toEqual([orphan, ownParent]);
  });

  it('places a block only once when ids repeat', () => {
    const repeated = {
      id: 'Container-1',
      type: 'Container',
      parentId: 'Container-1',
      position: 0,
    };
    const { roots, unplaced } = buildPuckBlockTree([
      { id: 'Container-1', type: 'Container', position: 0 },
      repeated,
    ]);

    expect(roots.map(toTree)).toEqual([{ id: 'Container-1', slots: {} }]);
    expect(unplaced).toEqual([repeated]);
  });

  it('places the first of two siblings that share an id', () => {
    const { roots, unplaced } = buildPuckBlockTree([
      { id: 'Title-1', type: 'Title', position: 0 },
      { id: 'Title-1', type: 'Title', position: 1 },
    ]);

    expect(roots.map(({ block }) => block.position)).toEqual([0]);
    expect(unplaced).toHaveLength(1);
  });
});
