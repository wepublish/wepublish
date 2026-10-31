import { BadRequestException } from '@nestjs/common';

import {
  ApiBlock,
  ApiBlockStyling,
  apiBlockStylingKeys,
  filterPuckBlocks,
  MAX_PUCK_BLOCKS_DEPTH,
  MAX_PUCK_BLOCKS_LENGTH,
  parsePuckBlocks,
  PuckBlocksError,
} from './puck-blocks';

const block = (
  id: string,
  props: Record<string, unknown> = {},
  extra: Partial<ApiBlock> = {}
): ApiBlock => ({
  id,
  type: 'Heading',
  data: props,
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
  margin: { top: 2, bottom: '12px' },
  padding: { top: 1, right: 1.5, bottom: '8px', left: 0 },
  border: { width: { top: 1, bottom: 2 }, style: 'dashed', color: '#fff' },
  borderRadius: { topLeft: 1, bottomRight: '8px' },
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
          visibility: {
            disabled: false,
            timings: {
              from: '2026-01-05T08:00:00.000Z',
              weekdays: ['Monday'],
              timeOfDay: { from: '08:00', to: '12:00' },
            },
            breakpoints: ['md'],
          },
          styling: fullStyling,
          datasources: {
            article: { type: 'list' },
            page: { type: 'single', id: 'page-1' },
            image: { type: 'multiple', ids: ['image-1', 'image-2'] },
            userSubscription: { type: 'uniqueList' },
          },
          children: [
            block('heading-1', { text: 'Hello' }, { slot: 'items[0].content' }),
            block('heading-2', {}, { slot: 'items[1].content' }),
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

  it('accepts a component prop named type inside the data', () => {
    const blocks = [block('input-1', { type: 'email', name: 'EMAIL' })];

    expect(parsePuckBlocks(blocks)).toEqual(blocks);
  });

  it('keeps null props inside the data', () => {
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
          type: 'Grid',
          data: {},
          locked: null,
          slot: null,
          styling: { color: null, margin: { top: 1, left: null } },
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
        type: 'Grid',
        data: {},
        styling: { margin: { top: 1 } },
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
      'blocks[0].id is required',
    ],
    [
      'a block without a type',
      [{ id: 'a', data: { text: 'Hello' } }],
      'blocks[0].type is required',
    ],
    [
      'a type that is not a string',
      [{ id: 'a', type: 1, data: {} }],
      'blocks[0].type must be a string',
    ],
    [
      'a block without data',
      [{ id: 'a', type: 'Heading' }],
      'blocks[0].data is required',
    ],
    [
      'data that is a list',
      [{ id: 'a', type: 'Heading', data: [] }],
      'blocks[0].data must be an object',
    ],
    [
      'an unknown block key',
      [{ ...block('a'), props: {} }],
      'blocks[0] must not have props',
    ],
    [
      'a lock that is not a boolean',
      [{ ...block('a'), locked: 'yes' }],
      'blocks[0].locked must be a boolean',
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
      [{ ...block('a'), slot: 1 }],
      'blocks[0].slot must be a string',
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
          children: [block('b'), { type: 'Heading', data: {} }],
        },
      ],
      'blocks[0].children[1].id is required',
    ],
    ['an empty id', [block('')], 'blocks[0].id must not be empty'],
    [
      'a component inside the data',
      [
        block('a', {
          items: [{ content: [{ type: 'Text', props: { id: 't' } }] }],
        }),
      ],
      'blocks[0].data.items[0].content[0] must not be a component, nest it through children',
    ],
    [
      'block fields inside the data',
      [block('a', { visibility: { disabled: true } })],
      'blocks[0].data.visibility belongs on the block, not inside its data',
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
      'an unknown datasource model',
      [{ ...block('a'), datasources: { author: { type: 'list' } } }],
      'blocks[0].datasources must not have author',
    ],
    [
      'a huge slot index',
      [{ ...block('a'), slot: 'items[4294967294].content' }],
      'blocks[0].slot must be a slot path like items[0].content',
    ],
    [
      'a colour that is neither a theme colour nor hex',
      [{ ...block('a'), styling: { color: 'red' } }],
      'blocks[0].styling.color must be a theme colour like primary.main or a hex colour like #1a1a1a',
    ],
    [
      'a negative margin',
      [{ ...block('a'), styling: { margin: { top: -1 } } }],
      'blocks[0].styling.margin.top must be theme spacing units or pixels like 12px',
    ],
    [
      'a padding in another unit',
      [{ ...block('a'), styling: { padding: { left: '1rem' } } }],
      'blocks[0].styling.padding.left must be theme spacing units or pixels like 12px',
    ],
    [
      'a border width as a string',
      [{ ...block('a'), styling: { border: { width: { top: '2px' } } } }],
      'blocks[0].styling.border.width.top must be a number',
    ],
    [
      'an unknown border style',
      [{ ...block('a'), styling: { border: { style: 'double' } } }],
      'blocks[0].styling.border.style must be one of solid, dashed, dotted',
    ],
    [
      'a corner radius in another unit',
      [{ ...block('a'), styling: { borderRadius: { topLeft: '8em' } } }],
      'blocks[0].styling.borderRadius.topLeft must be theme spacing units or pixels like 12px',
    ],
    [
      'a minimum height in percent',
      [{ ...block('a'), styling: { minHeight: '50%' } }],
      'blocks[0].styling.minHeight must be pixels like 320px or viewport height like 50vh',
    ],
    [
      'a maximum width at the smallest breakpoint',
      [{ ...block('a'), styling: { maxWidth: 'xs' } }],
      'blocks[0].styling.maxWidth must be a breakpoint (sm, md, lg, xl), pixels like 640px or percent like 80%',
    ],
    [
      'a shadow above the highest elevation',
      [{ ...block('a'), styling: { shadow: 25 } }],
      'blocks[0].styling.shadow must be at most 24',
    ],
    [
      'a shadow between elevations',
      [{ ...block('a'), styling: { shadow: 1.5 } }],
      'blocks[0].styling.shadow must be an integer',
    ],
    [
      'an opacity above 100 percent',
      [{ ...block('a'), styling: { opacity: 101 } }],
      'blocks[0].styling.opacity must be at most 100',
    ],
    [
      'a background position in the wrong order',
      [{ ...block('a'), styling: { backgroundPosition: 'top left' } }],
      'blocks[0].styling.backgroundPosition must be one of left top, center top, right top, left center, center center, right center, left bottom, center bottom, right bottom',
    ],
    [
      'an unknown styling key',
      [{ ...block('a'), styling: { fontSize: '2rem' } }],
      'blocks[0].styling must not have fontSize',
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
  type: 'Title',
  data: {},
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
  margin: { top: 2, bottom: '12px' },
  padding: { top: 1, right: 1.5, bottom: '8px', left: 0 },
  border: { width: { top: 1, bottom: 2 }, style: 'dashed', color: '#fff' },
  borderRadius: { topLeft: 1, bottomRight: '8px' },
  minHeight: '50vh',
  maxWidth: 'md',
  shadow: 24,
  opacity: 100,
};

const timed = (timings: unknown) => [storedBlock({ visibility: { timings } })];

const sourced = (datasources: unknown) => [storedBlock({ datasources })];

const styled = (styling: unknown) => [storedBlock({ styling })];

const slotted = (slot: unknown) => [
  storedBlock({ children: [storedBlock({ id: 'Title-2', slot })] }),
];

const storedBlockFormat: Record<'valid' | 'invalid', [string, unknown][]> = {
  valid: [
    ['an empty list', []],
    ['a block', [storedBlock()]],
    [
      'locked and unlocked blocks',
      [storedBlock({ locked: true }), storedBlock({ locked: false })],
    ],
    [
      'a type prop inside the data',
      [storedBlock({ data: { type: 'submit' } })],
    ],
    [
      'rich text nodes inside the data',
      [
        storedBlock({
          data: {
            richText: [{ type: 'paragraph', children: [{ text: 'Hi' }] }],
          },
        }),
      ],
    ],
    [
      'empty slots inside the data',
      [storedBlock({ data: { items: [{ content: [] }], content: [] } })],
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
    ['a block without a type', [{ id: 'Title-1', data: {} }]],
    ['the type inside the data', [{ id: 'Title-1', data: { type: 'Title' } }]],
    ['a block without data', [{ id: 'Title-1', type: 'Title' }]],
    ['data that is a list', [storedBlock({ data: [] })]],
    ['an unknown block key', [storedBlock({ zones: {} })]],
    ['a lock that is not a boolean', [storedBlock({ locked: 'yes' })]],
    [
      'a component inside the data',
      [storedBlock({ data: { content: [storedComponent] } })],
    ],
    [
      'a component next to other items inside the data',
      [storedBlock({ data: { content: [{}, storedComponent] } })],
    ],
    [
      'a component deep inside the data',
      [
        storedBlock({
          data: { items: [{ card: { teaser: storedComponent } }] },
        }),
      ],
    ],
    ['the id inside the data', [storedBlock({ data: { id: 'Title-1' } })]],
    ['the lock inside the data', [storedBlock({ data: { locked: true } })]],
    [
      'the visibility inside the data',
      [storedBlock({ data: { visibility: {} } })],
    ],
    [
      'datasources inside the data',
      [storedBlock({ data: { datasources: {} } })],
    ],
    ['styling inside the data', [storedBlock({ data: { styling: {} } })]],
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
    ['margin in rem', styled({ margin: { top: '1rem' } })],
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
      'a corner radius in percent',
      styled({ borderRadius: { topLeft: '50%' } }),
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
            { type: 'Title', data: {} },
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

  const keepVisible = (entry: ApiBlock) => !entry.data['hidden'];

  it('returns the same blocks when every block is kept', () => {
    const blocks = [
      block(
        'a',
        { content: [] },
        { children: [block('b', {}, { slot: 'content' })] }
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
