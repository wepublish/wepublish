import type {
  ApiBlock,
  ApiBlockDatasources,
} from '@wepublish/puck-content/api';

import { planPuckBlockData } from './puck-block-data.plan';

const now = new Date('2026-01-05T09:00:00Z');
const timeZone = 'Europe/Zurich';

const block = (
  id: string,
  datasources?: ApiBlockDatasources,
  children?: ApiBlock[],
  extra: Partial<ApiBlock> = {}
): ApiBlock =>
  ({
    id,
    kind: 'puck',
    type: 'Box',
    props: {},
    ...(datasources ? { datasources } : {}),
    ...(children ? { children } : {}),
    ...extra,
  }) as ApiBlock;

const disabled = { visibility: { disabled: true } };

const plan = (tree: ApiBlock[], pruned = false) =>
  planPuckBlockData(tree, { pruned, now, timeZone });

const sourcesOf = (tree: ApiBlock[], pruned = false) =>
  Object.fromEntries(
    plan(tree, pruned).blocks.map(({ id, sources }) => [id, sources])
  );

describe('planPuckBlockData', () => {
  it('lists every block in document order, parents before their children', () => {
    expect(
      plan([
        block('grid', undefined, [
          block('a'),
          block('b', undefined, [block('c')]),
        ]),
        block('d'),
      ]).blocks.map(({ id }) => id)
    ).toEqual(['grid', 'a', 'b', 'c', 'd']);
  });

  it('walks interleaved stored children grouped by slot, as they render', () => {
    const tree = [
      block('slider', { article: { type: 'uniqueList' } }, [
        block('x', { article: { type: 'slot' } }, undefined, {
          puckSlot: 'items[0].content',
        }),
        block('y', { article: { type: 'slot' } }, undefined, {
          puckSlot: 'items[1].content',
        }),
        block('z', { article: { type: 'slot' } }, undefined, {
          puckSlot: 'items[0].content',
        }),
      ]),
    ];

    expect(plan(tree).blocks.map(({ id }) => id)).toEqual([
      'slider',
      'x',
      'z',
      'y',
    ]);
    expect(sourcesOf(tree)).toMatchObject({
      x: { article: { type: 'slot', provider: 'slider', index: 0 } },
      z: { article: { type: 'slot', provider: 'slider', index: 1 } },
      y: { article: { type: 'slot', provider: 'slider', index: 2 } },
    });
  });

  it('picks records by id in the stored order', () => {
    expect(
      sourcesOf([
        block('one', { article: { type: 'single', id: 'a1' } }),
        block('many', {
          page: { type: 'multiple', ids: ['p2', 'p1'] },
          image: { type: 'multiple', ids: [] },
        }),
      ])
    ).toEqual({
      one: { article: { type: 'pick', ids: ['a1'] } },
      many: {
        page: { type: 'pick', ids: ['p2', 'p1'] },
        image: { type: 'pick', ids: [] },
      },
    });
  });

  it('pins the picks of every displayed block, wherever they sit', () => {
    expect(
      plan([
        block('grid', { article: { type: 'uniqueList' } }, [
          block('slot', { article: { type: 'slot' } }),
        ]),
        block('later', {
          article: { type: 'multiple', ids: ['a2', 'a3'] },
          memberPlan: { type: 'single', id: 'm1' },
        }),
        block(
          'hidden',
          { article: { type: 'single', id: 'a4' } },
          undefined,
          disabled
        ),
      ]).pinned
    ).toEqual({
      article: ['a2', 'a3'],
      page: [],
      event: [],
      image: [],
      memberPlan: ['m1'],
      userSubscription: [],
    });
  });

  describe('lists', () => {
    it('loads as many records as the list has slot consumers', () => {
      const tree = [
        block('grid', { article: { type: 'uniqueList' } }, [
          block('c1', { article: { type: 'slot' } }),
          block('c2', { article: { type: 'slot' } }),
          block('c3', { article: { type: 'slot' } }),
        ]),
      ];

      expect(plan(tree).lists).toEqual([
        { block: 'grid', model: 'article', unique: true, count: 3, shown: 3 },
      ]);
      expect(sourcesOf(tree)['grid']).toEqual({
        article: { type: 'list', list: 0, consumes: null },
      });
    });

    it('loads as many records as a block consumes itself', () => {
      const tree = [
        block('events', { event: { type: 'list' } }, undefined, {
          consumes: 6,
        }),
      ];

      expect(plan(tree).lists).toEqual([
        { block: 'events', model: 'event', unique: false, count: 6, shown: 6 },
      ]);
      expect(sourcesOf(tree)['events']).toEqual({
        event: { type: 'list', list: 0, consumes: 6 },
      });
    });

    it('serves the block itself before the blocks in its slots', () => {
      const tree = [
        block(
          'grid',
          {
            article: { type: 'uniqueList' },
            page: { type: 'list' },
          },
          [
            block('c1', { article: { type: 'slot' } }),
            block('c2', { article: { type: 'slot' } }, undefined, disabled),
          ],
          { consumes: 2 }
        ),
      ];

      expect(plan(tree).lists).toEqual([
        { block: 'grid', model: 'article', unique: true, count: 4, shown: 3 },
        { block: 'grid', model: 'page', unique: false, count: 2, shown: 2 },
      ]);
      expect(sourcesOf(tree)).toMatchObject({
        grid: {
          article: { type: 'list', list: 0, consumes: 2 },
          page: { type: 'list', list: 1, consumes: 2 },
        },
        c1: { article: { type: 'slot', provider: 'grid', index: 2 } },
        c2: { article: { type: 'slot', provider: 'grid', index: 3 } },
      });
    });

    it('never counts what a hidden block consumes as shown', () => {
      expect(
        plan([
          block('events', { event: { type: 'uniqueList' } }, undefined, {
            consumes: 3,
            ...disabled,
          }),
        ]).lists
      ).toEqual([
        { block: 'events', model: 'event', unique: true, count: 3, shown: 0 },
      ]);
    });

    it('consumes nothing from picks or from the parent', () => {
      expect(
        sourcesOf([
          block('grid', { article: { type: 'list' } }, [
            block(
              'child',
              {
                article: { type: 'slot' },
                page: { type: 'multiple', ids: ['p1'] },
              },
              undefined,
              { consumes: 4 }
            ),
          ]),
        ])
      ).toEqual({
        grid: { article: { type: 'list', list: 0, consumes: null } },
        child: {
          article: { type: 'slot', provider: 'grid', index: 0 },
          page: { type: 'pick', ids: ['p1'] },
        },
      });
    });

    it('loads nothing for a list without consumers', () => {
      expect(
        plan([
          block('events', { event: { type: 'list' } }),
          block('grid', { page: { type: 'uniqueList' } }, [
            block('other-model', { article: { type: 'slot' } }),
          ]),
        ]).lists
      ).toEqual([
        { block: 'events', model: 'event', unique: false, count: 0, shown: 0 },
        { block: 'grid', model: 'page', unique: true, count: 0, shown: 0 },
      ]);
    });

    it('loads every member plan and every subscription of the reader, whatever the block consumes', () => {
      const tree = [
        block(
          'subscribe',
          {
            memberPlan: { type: 'list' },
            userSubscription: { type: 'uniqueList' },
          },
          undefined,
          { consumes: 2 }
        ),
      ];

      expect(sourcesOf(tree)['subscribe']).toEqual({
        memberPlan: { type: 'list', list: 0, consumes: null },
        userSubscription: { type: 'list', list: 1, consumes: null },
      });
      expect(plan(tree).lists).toEqual([
        {
          block: 'subscribe',
          model: 'memberPlan',
          unique: false,
          count: null,
          shown: null,
        },
        {
          block: 'subscribe',
          model: 'userSubscription',
          unique: true,
          count: null,
          shown: null,
        },
      ]);
    });

    it('orders the lists as the document, so earlier lists exclude first', () => {
      expect(
        plan([
          block('top', { article: { type: 'list' } }, [
            block('t1', { article: { type: 'slot' } }),
          ]),
          block(
            'mixed',
            {
              page: { type: 'uniqueList' },
              article: { type: 'uniqueList' },
            },
            [
              block('m1', {
                article: { type: 'slot' },
                page: { type: 'slot' },
              }),
            ]
          ),
        ]).lists.map(({ block: id, model }) => `${id}.${model}`)
      ).toEqual(['top.article', 'mixed.article', 'mixed.page']);
    });
  });

  describe('slots', () => {
    it('takes the records from the nearest provider of the same model', () => {
      const tree = [
        block('grid', { article: { type: 'uniqueList' } }, [
          block('c1', { article: { type: 'slot' } }),
          block('pages', { page: { type: 'list' } }, [
            block('c2', { article: { type: 'slot' } }),
          ]),
          block('inner', { article: { type: 'list' } }, [
            block('c3', { article: { type: 'slot' } }),
            block('c4', { article: { type: 'slot' } }),
          ]),
          block('c5', { article: { type: 'slot' } }),
        ]),
      ];

      expect(sourcesOf(tree)).toMatchObject({
        c1: { article: { type: 'slot', provider: 'grid', index: 0 } },
        c2: { article: { type: 'slot', provider: 'grid', index: 1 } },
        c3: { article: { type: 'slot', provider: 'inner', index: 0 } },
        c4: { article: { type: 'slot', provider: 'inner', index: 1 } },
        c5: { article: { type: 'slot', provider: 'grid', index: 2 } },
      });
      expect(
        plan(tree).lists.map(({ block: id, count }) => [id, count])
      ).toEqual([
        ['grid', 3],
        ['pages', 0],
        ['inner', 2],
      ]);
    });

    it('passes a consumer by on the way up, both consume the same provider', () => {
      expect(
        sourcesOf([
          block('grid', { event: { type: 'list' } }, [
            block('outer', { event: { type: 'slot' } }, [
              block('nested', { event: { type: 'slot' } }),
            ]),
          ]),
        ])
      ).toMatchObject({
        outer: { event: { type: 'slot', provider: 'grid', index: 0 } },
        nested: { event: { type: 'slot', provider: 'grid', index: 1 } },
      });
    });

    it('lets a picked record provide the slots below it', () => {
      expect(
        sourcesOf([
          block('container', { article: { type: 'single', id: 'a1' } }, [
            block('title', { article: { type: 'slot' } }),
          ]),
        ])
      ).toEqual({
        container: { article: { type: 'pick', ids: ['a1'] } },
        title: { article: { type: 'slot', provider: 'container', index: 0 } },
      });
    });

    it('hands every Teaser of a grid list its own record and the parts inside none, and lets a picked Teaser pin its record', () => {
      const part = (id: string, type: string) =>
        block(id, undefined, undefined, { type });
      const teaser = (n: number) =>
        block(
          `teaser-${n}`,
          { article: { type: 'slot' } },
          [
            part(`image-${n}`, 'TeaserImage'),
            part(`title-${n}`, 'TeaserTitle'),
          ],
          { type: 'Teaser' }
        );
      const tree = [
        block(
          'grid',
          { article: { type: 'uniqueList' } },
          [teaser(1), teaser(2), teaser(3)],
          { type: 'Grid' }
        ),
        block(
          'picked',
          { page: { type: 'single', id: 'p1' } },
          [part('picked-title', 'TeaserTitle')],
          { type: 'Teaser' }
        ),
      ];

      expect(plan(tree).lists).toEqual([
        { block: 'grid', model: 'article', unique: true, count: 3, shown: 3 },
      ]);
      expect(plan(tree).pinned.page).toEqual(['p1']);
      expect(sourcesOf(tree)).toEqual({
        grid: { article: { type: 'list', list: 0, consumes: null } },
        'teaser-1': { article: { type: 'slot', provider: 'grid', index: 0 } },
        'image-1': {},
        'title-1': {},
        'teaser-2': { article: { type: 'slot', provider: 'grid', index: 1 } },
        'image-2': {},
        'title-2': {},
        'teaser-3': { article: { type: 'slot', provider: 'grid', index: 2 } },
        'image-3': {},
        'title-3': {},
        picked: { page: { type: 'pick', ids: ['p1'] } },
        'picked-title': {},
      });
    });

    it('leaves a consumer without a provider empty', () => {
      expect(
        sourcesOf([block('orphan', { article: { type: 'slot' } })])
      ).toEqual({
        orphan: { article: { type: 'slot', provider: null, index: 0 } },
      });
    });
  });

  describe('hidden blocks', () => {
    it('hides disabled and untimely blocks with their subtree', () => {
      expect(
        plan([
          block('off', undefined, [block('below')], disabled),
          block('later', undefined, undefined, {
            visibility: { timings: { from: '2026-01-06T00:00:00Z' } },
          }),
          block('shown'),
        ]).blocks.map(({ id, hidden }) => [id, hidden])
      ).toEqual([
        ['off', true],
        ['below', true],
        ['later', true],
        ['shown', false],
      ]);
    });

    it('hides nothing in a tree that is already pruned', () => {
      expect(
        plan([block('off', undefined, undefined, disabled)], true).blocks
      ).toEqual([{ id: 'off', hidden: false, sources: {} }]);
    });

    it('serves the hidden consumers after the displayed ones, without counting them as shown', () => {
      const tree = [
        block('grid', { article: { type: 'uniqueList' } }, [
          block('h1', { article: { type: 'slot' } }, undefined, disabled),
          block('v1', { article: { type: 'slot' } }),
          block('v2', { article: { type: 'slot' } }),
        ]),
      ];

      expect(sourcesOf(tree)).toMatchObject({
        v1: { article: { index: 0 } },
        v2: { article: { index: 1 } },
        h1: { article: { index: 2 } },
      });
      expect(plan(tree).lists).toEqual([
        { block: 'grid', model: 'article', unique: true, count: 3, shown: 2 },
      ]);
    });

    it('lets a hidden list load for its own consumers without showing them', () => {
      expect(
        plan([
          block(
            'grid',
            { article: { type: 'list' } },
            [block('c1', { article: { type: 'slot' } })],
            disabled
          ),
          block('plans', { memberPlan: { type: 'list' } }, undefined, disabled),
        ]).lists
      ).toEqual([
        { block: 'grid', model: 'article', unique: false, count: 1, shown: 0 },
        {
          block: 'plans',
          model: 'memberPlan',
          unique: false,
          count: null,
          shown: 0,
        },
      ]);
    });
  });
});
