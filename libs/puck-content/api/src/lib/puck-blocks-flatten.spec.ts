import { ApiBlock, filterPuckBlocks } from './puck-blocks';
import { flattenPuckBlocks } from './puck-blocks-flatten';

const block = (id: string, extra: Partial<ApiBlock> = {}): ApiBlock => ({
  id,
  kind: 'puck',
  type: 'Heading',
  props: {},
  ...extra,
});

const placement = (blocks: ApiBlock[]) =>
  flattenPuckBlocks(blocks).map(({ id, parentId, puckSlot, position }) => [
    id,
    parentId,
    puckSlot,
    position,
  ]);

describe('flattenPuckBlocks', () => {
  it('flattens nothing to nothing', () => {
    expect(flattenPuckBlocks([])).toEqual([]);
  });

  it('places top level blocks in no parent and no slot', () => {
    expect(placement([block('a'), block('b'), block('c')])).toEqual([
      ['a', null, null, 0],
      ['b', null, null, 1],
      ['c', null, null, 2],
    ]);
  });

  it('lists every block depth first, each parent before its children', () => {
    const blocks = [
      block('grid', {
        children: [
          block('column', { children: [block('text'), block('image')] }),
          block('aside'),
        ],
      }),
      block('footer'),
    ];

    expect(flattenPuckBlocks(blocks).map(({ id }) => id)).toEqual([
      'grid',
      'column',
      'text',
      'image',
      'aside',
      'footer',
    ]);
  });

  it('places children in the default content slot unless they name one', () => {
    const blocks = [
      block('grid', {
        children: [
          block('a', { puckSlot: 'items[0].content' }),
          block('b', { puckSlot: 'items[1].content' }),
          block('d'),
          block('e', { puckSlot: 'content' }),
        ],
      }),
    ];

    expect(placement(blocks)).toEqual([
      ['grid', null, null, 0],
      ['a', 'grid', 'items[0].content', 0],
      ['b', 'grid', 'items[1].content', 0],
      ['d', 'grid', 'content', 0],
      ['e', 'grid', 'content', 1],
    ]);
  });

  it('lists interleaved children grouped by slot, in the order the slots first appear', () => {
    const blocks = [
      block('grid', {
        children: [
          block('a', { puckSlot: 'items[1].content' }),
          block('b', { puckSlot: 'items[0].content' }),
          block('c', { puckSlot: 'items[1].content' }),
          block('d', {
            puckSlot: 'items[0].content',
            children: [
              block('x', { puckSlot: 'right' }),
              block('y', { puckSlot: 'left' }),
              block('z', { puckSlot: 'right' }),
            ],
          }),
        ],
      }),
    ];

    expect(placement(blocks)).toEqual([
      ['grid', null, null, 0],
      ['a', 'grid', 'items[1].content', 0],
      ['c', 'grid', 'items[1].content', 1],
      ['b', 'grid', 'items[0].content', 0],
      ['d', 'grid', 'items[0].content', 1],
      ['x', 'd', 'right', 0],
      ['z', 'd', 'right', 1],
      ['y', 'd', 'left', 0],
    ]);
  });

  it('keeps the slot names of generated blocks as they are, dots included', () => {
    expect(
      placement([
        block('hero', {
          kind: 'generated',
          type: 'HeroBanner',
          children: [block('a', { puckSlot: 'hero.body' })],
        }),
      ])
    ).toEqual([
      ['hero', null, null, 0],
      ['a', 'hero', 'hero.body', 0],
    ]);
  });

  it('counts positions per parent', () => {
    const blocks = [
      block('first', { children: [block('a'), block('b')] }),
      block('second', { children: [block('c')] }),
    ];

    expect(placement(blocks)).toEqual([
      ['first', null, null, 0],
      ['a', 'first', 'content', 0],
      ['b', 'first', 'content', 1],
      ['second', null, null, 1],
      ['c', 'second', 'content', 0],
    ]);
  });

  it('keeps top level blocks out of any slot they name', () => {
    expect(placement([block('a', { puckSlot: 'items[0].content' })])).toEqual([
      ['a', null, null, 0],
    ]);
  });

  it('carries every block field over and leaves the children out', () => {
    const [flat] = flattenPuckBlocks([
      block('grid', {
        type: 'Grid',
        locked: true,
        props: { gap: 2, items: [{ content: [] }] },
        styling: { xs: { color: 'primary.main' }, md: { margin: { top: 2 } } },
        datasources: { article: { type: 'list' } },
        consumes: 3,
        visibility: { disabled: false, breakpoints: ['md', 'lg'] },
        children: [block('a')],
      }),
    ]);

    expect(flat).toEqual({
      id: 'grid',
      kind: 'puck',
      type: 'Grid',
      parentId: null,
      puckSlot: null,
      position: 0,
      locked: true,
      props: { gap: 2, items: [{ content: [] }] },
      styling: { xs: { color: 'primary.main' }, md: { margin: { top: 2 } } },
      datasources: { article: { type: 'list' } },
      consumes: 3,
      visibility: { disabled: false, breakpoints: ['md', 'lg'] },
    });
    expect(flat).not.toHaveProperty('children');
  });

  it('carries the kind of generated blocks over', () => {
    expect(
      flattenPuckBlocks([
        block('hero', {
          kind: 'generated',
          type: 'HeroBanner',
          props: { title: 'Hello' },
        }),
      ])
    ).toEqual([
      {
        id: 'hero',
        kind: 'generated',
        type: 'HeroBanner',
        props: { title: 'Hello' },
        parentId: null,
        puckSlot: null,
        position: 0,
      },
    ]);
  });

  it('hands the timing out as dates, so the DateTime scalar can serialize it', () => {
    const [{ visibility }] = flattenPuckBlocks([
      block('a', {
        visibility: {
          timings: {
            from: '2026-01-05T08:00:00.000Z',
            to: '2026-01-06T08:00:00.000Z',
            weekdays: ['Monday'],
            timeOfDay: { from: '08:00', to: '12:00' },
          },
        },
      }),
    ]);

    expect(visibility?.timings).toEqual({
      from: new Date('2026-01-05T08:00:00.000Z'),
      to: new Date('2026-01-06T08:00:00.000Z'),
      weekdays: ['Monday'],
      timeOfDay: { from: '08:00', to: '12:00' },
    });
  });

  it('leaves an open timing open', () => {
    const [{ visibility }] = flattenPuckBlocks([
      block('a', { visibility: { timings: { weekdays: ['Sunday'] } } }),
    ]);

    expect(visibility?.timings).toEqual({ weekdays: ['Sunday'] });
  });

  it('drops pruned blocks together with their whole subtree', () => {
    const blocks = [
      block('grid', {
        children: [
          block('hidden', {
            visibility: { disabled: true },
            children: [block('child', { children: [block('grandchild')] })],
          }),
          block('shown'),
        ],
      }),
    ];

    const pruned = filterPuckBlocks(
      blocks,
      ({ visibility }) => !visibility?.disabled
    );

    expect(placement(pruned)).toEqual([
      ['grid', null, null, 0],
      ['shown', 'grid', 'content', 0],
    ]);
  });
});
