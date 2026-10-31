import { ApiBlock, filterPuckBlocks } from './puck-blocks';
import { flattenPuckBlocks } from './puck-blocks-flatten';

const block = (id: string, extra: Partial<ApiBlock> = {}): ApiBlock => ({
  id,
  type: 'Heading',
  data: {},
  ...extra,
});

const placement = (blocks: ApiBlock[]) =>
  flattenPuckBlocks(blocks).map(({ id, parentId, slot, position }) => [
    id,
    parentId,
    slot,
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
          block('a', { slot: 'items[0].content' }),
          block('b', { slot: 'items[1].content' }),
          block('c', { slot: 'items[0].content' }),
          block('d'),
          block('e', { slot: 'content' }),
        ],
      }),
    ];

    expect(placement(blocks)).toEqual([
      ['grid', null, null, 0],
      ['a', 'grid', 'items[0].content', 0],
      ['b', 'grid', 'items[1].content', 0],
      ['c', 'grid', 'items[0].content', 1],
      ['d', 'grid', 'content', 0],
      ['e', 'grid', 'content', 1],
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
    expect(placement([block('a', { slot: 'items[0].content' })])).toEqual([
      ['a', null, null, 0],
    ]);
  });

  it('carries every block field over and leaves the children out', () => {
    const [flat] = flattenPuckBlocks([
      block('grid', {
        type: 'Grid',
        locked: true,
        data: { gap: 2, items: [{ content: [] }] },
        styling: { color: 'primary.main', margin: { top: 2 } },
        datasources: { article: { type: 'multiple', ids: ['article-1'] } },
        visibility: { disabled: false, breakpoints: ['md', 'lg'] },
        children: [block('a')],
      }),
    ]);

    expect(flat).toEqual({
      id: 'grid',
      type: 'Grid',
      parentId: null,
      slot: null,
      position: 0,
      locked: true,
      data: { gap: 2, items: [{ content: [] }] },
      styling: { color: 'primary.main', margin: { top: 2 } },
      datasources: { article: { type: 'multiple', ids: ['article-1'] } },
      visibility: { disabled: false, breakpoints: ['md', 'lg'] },
    });
    expect(flat).not.toHaveProperty('children');
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
