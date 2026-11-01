import { ComponentData } from '@puckeditor/core';
import {
  FullPuckBlockFragment,
  PuckBackgroundSize,
  PuckBlockInput,
  PuckBlockKind,
  PuckBorderStyle,
  PuckBreakpoint,
  PuckDatasourceType,
  PuckFontWeight,
  PuckListDatasourceType,
  PuckTextAlign,
  PuckTextTransform,
  PuckWeekday,
  Weekday,
} from '@wepublish/editor/api';

import { getPuckConfig } from '../config';
import {
  BlockConsumes,
  DerivedDatasources,
  fromPuckBlocks,
  PuckSlotConfig,
  toPuckBlockInputs,
} from './puck-blocks';
import { PuckDynamicConfig } from './puck-registry';

const config = getPuckConfig('page');

const puckComponent = (
  type: string,
  n: number,
  props: Record<string, unknown> = {}
): ComponentData => ({ type, props: { id: `${type}-${n}`, ...props } });

const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const toInputs = (
  content: ComponentData[],
  options: {
    config?: PuckSlotConfig;
    dynamicConfig?: PuckDynamicConfig;
    derivedDatasources?: DerivedDatasources;
    blockConsumes?: BlockConsumes;
  } = {}
) => toPuckBlockInputs(content, { config, ...options });

const flatten = (
  inputs: readonly PuckBlockInput[],
  parentId: string | null = null
): FullPuckBlockFragment[] => {
  const positions = new Map<string, number>();

  return inputs.flatMap(
    ({
      children,
      puckSlot,
      locked,
      visibility,
      styling,
      datasources,
      ...block
    }) => {
      const slot = puckSlot ?? 'content';
      const position = positions.get(slot) ?? 0;

      positions.set(slot, position + 1);

      return [
        {
          __typename: 'PuckBlock',
          ...block,
          parentId,
          puckSlot: parentId === null ? null : slot,
          position,
          locked: locked ?? null,
          visibility: visibility ?? null,
          styling: styling ?? null,
          datasources: datasources ?? null,
        } as unknown as FullPuckBlockFragment,
        ...flatten(children ?? [], block.id),
      ];
    }
  );
};

const roundTrip = (
  content: ComponentData[],
  options: Parameters<typeof toInputs>[1] = {}
) =>
  fromPuckBlocks(asJson(flatten(toInputs(content, options))), {
    derivedDatasources: options.derivedDatasources,
  });

const flatBlock = (
  block: Pick<FullPuckBlockFragment, 'id' | 'type'> &
    Partial<FullPuckBlockFragment>
): FullPuckBlockFragment => ({
  __typename: 'PuckBlock',
  kind: PuckBlockKind.Puck,
  parentId: null,
  puckSlot: null,
  position: 0,
  locked: null,
  props: {},
  visibility: null,
  styling: null,
  datasources: null,
  ...block,
});

const fullStyling = {
  typography: 'h2',
  textAlign: 'center',
  color: 'primary.main',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  background: '#ffffff',
  backgroundImage: 'image-1',
  backgroundSize: 'contain',
  backgroundPosition: 'left top',
  overlay: '#00000080',
  overlayOpacity: 40,
  margin: { top: 2, right: '12px', bottom: 0, left: 1.5 },
  padding: { top: '8px', right: 2, bottom: 2, left: 2 },
  border: {
    width: { top: 1, right: 1, bottom: 1, left: 1 },
    style: 'dashed',
    color: 'secondary.dark',
  },
  borderRadius: {
    topLeft: 2,
    topRight: '8px',
    bottomRight: 0,
    bottomLeft: 1,
  },
  minHeight: '50vh',
  maxWidth: 'md',
  shadow: 24,
  opacity: 100,
} as const;

const fullStylingInput = {
  ...fullStyling,
  textAlign: PuckTextAlign.Center,
  fontWeight: PuckFontWeight.Bold,
  textTransform: PuckTextTransform.Uppercase,
  backgroundSize: PuckBackgroundSize.Contain,
  border: { ...fullStyling.border, style: PuckBorderStyle.Dashed },
};

const pageContent: ComponentData[] = [
  puckComponent('Container', 1, {
    maxWidth: 'lg',
    visibility: { disabled: false, breakpoints: ['md', 'lg'] },
    styling: fullStyling,
    datasources: { article: { type: 'uniqueList' } },
    content: [
      puckComponent('Grid', 2, {
        locked: true,
        styling: { padding: { top: 2, bottom: 2 } },
        layout: { xs: { columns: [6, 6], gap: { row: 2, column: 2 } } },
        content: [
          puckComponent('Container', 3, {
            datasources: { article: { type: 'slot' } },
            content: [puckComponent('TeaserTitle', 4)],
          }),
          puckComponent('Row', 5, {
            styling: { background: 'background.paper' },
            content: [],
          }),
        ],
      }),
    ],
  }),
  puckComponent('DynamicGrid', 6, {
    styling: { maxWidth: '80%', borderRadius: { topLeft: '4px' } },
    items: [
      {
        span: { xs: { columnSpan: 12 } },
        visibility: ['md'],
        content: [puckComponent('Quote', 7, { quote: 'Hi' })],
      },
      { span: { xs: { columnSpan: 6 } }, content: [] },
      {
        span: { xs: { columnSpan: 6 } },
        content: [
          puckComponent('Image', 8, {
            datasources: { image: { type: 'single', id: 'image-1' } },
          }),
          puckComponent('Button', 9, { text: 'Go' }),
        ],
      },
    ],
  }),
  puckComponent('Slider', 10, {
    settings: { xs: { perView: 1.4, gap: 16 } },
    dragDisabled: false,
    styling: { shadow: 2, opacity: 90 },
    items: [
      {
        content: [
          puckComponent('Collapsible', 11, {
            title: 'FAQ',
            defaultOpen: false,
            styling: { border: { width: { bottom: 1 }, style: 'solid' } },
            content: [puckComponent('RichText', 12, { richText: [] })],
          }),
        ],
      },
      { content: [] },
    ],
  }),
  puckComponent('Title', 13, {
    title: 'Timed',
    visibility: {
      timings: {
        from: '2026-11-01T08:00:00.000Z',
        weekdays: [Weekday.Monday, Weekday.Friday],
        timeOfDay: { from: '08:00', to: '12:00' },
      },
    },
  }),
];

const allInputs = (inputs: readonly PuckBlockInput[]): PuckBlockInput[] =>
  inputs.flatMap(input => [input, ...allInputs(input.children ?? [])]);

const generatedConfig: PuckDynamicConfig = {
  components: {
    Columns: {
      html: '<div><div data-puck-slot="col.left"></div><div data-puck-slot="col.right"></div></div>',
      fields: {
        'col.left': { type: 'slot' },
        'col.right': { type: 'slot' },
      },
    },
    Hero: { html: '<section data-puck-slot="content"></section>' },
  },
};

describe('toPuckBlockInputs', () => {
  it('splits the id, lock, visibility, styling and datasources off the component props', () => {
    expect(
      toInputs([
        puckComponent('Container', 1, {
          locked: true,
          visibility: { disabled: true },
          styling: { color: 'primary.main', padding: { top: 2 } },
          datasources: { article: { type: 'list' } },
          maxWidth: 'md',
        }),
      ])
    ).toStrictEqual([
      {
        id: 'Container-1',
        kind: PuckBlockKind.Puck,
        type: 'Container',
        locked: true,
        visibility: { disabled: true },
        styling: { color: 'primary.main', padding: { top: 2 } },
        datasources: { article: { type: PuckDatasourceType.List } },
        props: { maxWidth: 'md' },
      },
    ]);
  });

  it('sends the styling, visibility and datasources with the values of the API', () => {
    const [block] = toInputs([
      puckComponent('Grid', 1, {
        styling: fullStyling,
        visibility: {
          disabled: false,
          breakpoints: ['md', 'lg'],
          timings: {
            from: '2026-11-01T08:00:00.000Z',
            to: '2026-11-30T08:00:00.000Z',
            weekdays: [Weekday.Monday, Weekday.Friday],
            timeOfDay: { from: '08:00', to: '18:00' },
          },
        },
        datasources: {
          article: { type: 'multiple', ids: ['article-2', 'article-3'] },
          page: { type: 'single', id: 'page-2' },
          event: { type: 'uniqueList' },
          image: { type: 'single', id: 'image-1' },
          memberPlan: { type: 'list' },
          userSubscription: { type: 'list' },
        },
      }),
    ]);

    expect(block.styling).toEqual(fullStylingInput);
    expect(block.visibility).toEqual({
      disabled: false,
      breakpoints: [PuckBreakpoint.Md, PuckBreakpoint.Lg],
      timings: {
        from: '2026-11-01T08:00:00.000Z',
        to: '2026-11-30T08:00:00.000Z',
        weekdays: [PuckWeekday.Monday, PuckWeekday.Friday],
        timeOfDay: { from: '08:00', to: '18:00' },
      },
    });
    expect(block.datasources).toEqual({
      article: {
        type: PuckDatasourceType.Multiple,
        ids: ['article-2', 'article-3'],
      },
      page: { type: PuckDatasourceType.Single, id: 'page-2' },
      event: { type: PuckDatasourceType.UniqueList },
      image: { type: PuckDatasourceType.Single, id: 'image-1' },
      memberPlan: { type: PuckDatasourceType.List },
      userSubscription: { type: PuckListDatasourceType.List },
    });
  });

  it.each([
    ['an empty styling', {}],
    ['a styling without values', { color: undefined, typography: '' }],
    ['a styling with empty groups', { margin: {}, border: { width: {} } }],
    ['a cleared styling', undefined],
  ])('leaves out %s', (_, styling) => {
    expect(
      toInputs([puckComponent('Container', 1, { styling })])
    ).toStrictEqual([
      {
        id: 'Container-1',
        kind: PuckBlockKind.Puck,
        type: 'Container',
        props: {},
      },
    ]);
  });

  it('drops the empty values inside the styling', () => {
    const [block] = toInputs([
      puckComponent('Container', 1, {
        styling: {
          color: '',
          margin: { top: 2, left: undefined },
          border: { width: { top: 1 }, color: null },
          padding: {},
          shadow: 0,
        },
      }),
    ]);

    expect(block.styling).toStrictEqual({
      margin: { top: 2 },
      border: { width: { top: 1 } },
      shadow: 0,
    });
  });

  it('drops the values the editor cleared', () => {
    const [block] = toInputs([
      puckComponent('Title', 1, {
        visibility: { timings: { from: null, to: '2026-11-30T08:00:00.000Z' } },
        datasources: { article: null, page: { type: 'list' } },
      }),
    ]);

    expect(block.visibility).toStrictEqual({
      timings: { to: '2026-11-30T08:00:00.000Z' },
    });
    expect(block.datasources).toStrictEqual({
      page: { type: PuckDatasourceType.List },
    });
  });

  it('stores the datasources without what the API resolves and keeps only the ids a type uses', () => {
    const [block] = toInputs([
      puckComponent('Grid', 1, {
        datasources: {
          article: { type: 'uniqueList', data: [{ id: 'article-1' }] },
          page: { type: 'single', id: 'page-1', ids: ['page-2'] },
          event: { type: 'multiple', id: 'event-1', ids: ['event-2'] },
          memberPlan: { type: 'list', id: 'plan-1' },
        },
      }),
    ]);

    expect(block.datasources).toStrictEqual({
      article: { type: PuckDatasourceType.UniqueList },
      page: { type: PuckDatasourceType.Single, id: 'page-1' },
      event: { type: PuckDatasourceType.Multiple, ids: ['event-2'] },
      memberPlan: { type: PuckDatasourceType.List },
    });
  });

  it('leaves unlocked blocks without a lock', () => {
    const [block] = toInputs([puckComponent('Title', 1, { locked: false })]);

    expect(block).not.toHaveProperty('locked');
  });

  it('moves the components of the content slot into children without a slot', () => {
    expect(
      toInputs([
        puckComponent('Container', 1, {
          maxWidth: 'md',
          content: [
            puckComponent('Title', 2, { title: 'A' }),
            puckComponent('Quote', 3, { quote: 'B' }),
          ],
        }),
      ])
    ).toStrictEqual([
      {
        id: 'Container-1',
        kind: PuckBlockKind.Puck,
        type: 'Container',
        props: { maxWidth: 'md', content: [] },
        children: [
          {
            id: 'Title-2',
            kind: PuckBlockKind.Puck,
            type: 'Title',
            props: { title: 'A' },
          },
          {
            id: 'Quote-3',
            kind: PuckBlockKind.Puck,
            type: 'Quote',
            props: { quote: 'B' },
          },
        ],
      },
    ]);
  });

  it('names every other slot by its path, grouped by slot', () => {
    const [grid] = toInputs([
      puckComponent('DynamicGrid', 1, {
        items: [
          {
            span: { xs: { columnSpan: 12 } },
            content: [puckComponent('Title', 2)],
          },
          {
            span: { xs: { columnSpan: 6 } },
            content: [puckComponent('Image', 3), puckComponent('Quote', 4)],
          },
        ],
      }),
    ]);

    expect(grid.props).toEqual({
      items: [
        { span: { xs: { columnSpan: 12 } }, content: [] },
        { span: { xs: { columnSpan: 6 } }, content: [] },
      ],
    });
    expect(grid.children?.map(({ id, puckSlot }) => [id, puckSlot])).toEqual([
      ['Title-2', 'items[0].content'],
      ['Image-3', 'items[1].content'],
      ['Quote-4', 'items[1].content'],
    ]);
  });

  it('converts the slots of nested components recursively', () => {
    const blocks = toInputs([
      puckComponent('Container', 1, {
        content: [
          puckComponent('Grid', 2, {
            content: [
              puckComponent('Container', 3, {
                content: [puckComponent('Title', 4)],
              }),
            ],
          }),
        ],
      }),
    ]);

    expect(allInputs(blocks).map(({ id, props }) => [id, props])).toEqual([
      ['Container-1', { content: [] }],
      ['Grid-2', { content: [] }],
      ['Container-3', { content: [] }],
      ['Title-4', {}],
    ]);
  });

  it('keeps empty slots in the props without adding children', () => {
    expect(
      toInputs([
        puckComponent('Collapsible', 1, { title: 'More', content: [] }),
      ])
    ).toStrictEqual([
      {
        id: 'Collapsible-1',
        kind: PuckBlockKind.Puck,
        type: 'Collapsible',
        props: { title: 'More', content: [] },
      },
    ]);
  });

  it('leaves out undefined values so the props are plain JSON', () => {
    const blocks = toInputs([
      puckComponent('Container', 1, {
        maxWidth: undefined,
        visibility: { disabled: undefined, breakpoints: ['md'] },
        datasources: { article: undefined },
        content: [puckComponent('Title', 2, { title: undefined })],
      }),
    ]);

    expect(blocks).toStrictEqual(asJson(blocks));
  });

  it('leaves out what only Puck needs', () => {
    expect(
      toInputs([
        {
          type: 'Title',
          readOnly: { title: true },
          props: { id: 'Title-1', title: 'Hi' },
        },
      ])
    ).toStrictEqual([
      {
        id: 'Title-1',
        kind: PuckBlockKind.Puck,
        type: 'Title',
        props: { title: 'Hi' },
      },
    ]);
  });

  it('keeps the block keys and the Puck shape out of the props of every block', () => {
    const blocks = allInputs(toInputs(pageContent));

    expect(blocks).toHaveLength(13);
    blocks.forEach(({ props }) =>
      [
        'id',
        'type',
        'locked',
        'visibility',
        'styling',
        'datasources',
        'props',
      ].forEach(key => expect(props).not.toHaveProperty(key))
    );
  });

  it('keeps a type prop of the component in the props, apart from its component type', () => {
    const [block] = toInputs([
      puckComponent('Button', 1, { type: 'submit', text: 'Send' }),
    ]);

    expect(block).toEqual(
      expect.objectContaining({
        type: 'Button',
        props: { type: 'submit', text: 'Send' },
      })
    );
  });

  describe('with the slots the config declares', () => {
    const panelConfig: PuckSlotConfig = {
      components: {
        Panel: {
          fields: {
            footer: { type: 'slot' },
            layout: {
              type: 'object',
              objectFields: { aside: { type: 'slot' } },
            },
            header: { type: 'slot' },
            title: { type: 'text' },
          },
        },
      },
    };

    it('emits the slots in the order the config declares them', () => {
      const [panel] = toInputs(
        [
          puckComponent('Panel', 1, {
            header: [puckComponent('Title', 2)],
            title: 'Panel',
            footer: [puckComponent('Title', 3)],
            layout: { aside: [puckComponent('Title', 4)] },
          }),
        ],
        { config: panelConfig }
      );

      expect(panel.children?.map(({ id, puckSlot }) => [id, puckSlot])).toEqual(
        [
          ['Title-3', 'footer'],
          ['Title-4', 'layout.aside'],
          ['Title-2', 'header'],
        ]
      );
      expect(panel.props).toEqual({
        header: [],
        title: 'Panel',
        footer: [],
        layout: { aside: [] },
      });
    });

    it('leaves a slot the props do not have out of the props', () => {
      const [panel] = toInputs([puckComponent('Panel', 1, { title: 'x' })], {
        config: panelConfig,
      });

      expect(panel.props).toStrictEqual({ title: 'x' });
    });

    it('still nests components a slot the config does not know holds', () => {
      const [panel] = toInputs(
        [
          puckComponent('Panel', 1, {
            extra: { content: [puckComponent('Title', 2)] },
          }),
        ],
        { config: panelConfig }
      );

      expect(panel.props).toEqual({ extra: { content: [] } });
      expect(panel.children).toEqual([
        expect.objectContaining({ id: 'Title-2', puckSlot: 'extra.content' }),
      ]);
    });

    it('finds the slots of a component the config does not know by their shape', () => {
      const [unknown] = toInputs([
        puckComponent('Unknown', 1, {
          items: [{ body: [puckComponent('Title', 2)] }],
        }),
      ]);

      expect(unknown.children).toEqual([
        expect.objectContaining({ id: 'Title-2', puckSlot: 'items[0].body' }),
      ]);
    });
  });

  describe('generated components', () => {
    it('stores a component of the dynamic config as generated', () => {
      const [hero] = toInputs(
        [puckComponent('Hero', 1, { title: 'Hi', tone: 'dark' })],
        { dynamicConfig: generatedConfig }
      );

      expect(hero).toStrictEqual({
        id: 'Hero-1',
        kind: PuckBlockKind.Generated,
        type: 'Hero',
        props: { title: 'Hi', tone: 'dark' },
      });
    });

    it('keeps the slot names of the registration as they are, dots included', () => {
      const [columns] = toInputs(
        [
          puckComponent('Columns', 1, {
            'col.left': [puckComponent('Title', 2)],
            'col.right': [],
            title: 'Two columns',
          }),
        ],
        { dynamicConfig: generatedConfig }
      );

      expect(columns.props).toEqual({
        'col.left': [],
        'col.right': [],
        title: 'Two columns',
      });
      expect(columns.children).toEqual([
        expect.objectContaining({ id: 'Title-2', puckSlot: 'col.left' }),
      ]);
    });

    it('takes the slot names from the live config of the component', () => {
      const [hero] = toInputs(
        [
          puckComponent('Hero', 1, {
            'top.content': [puckComponent('Title', 2)],
          }),
        ],
        {
          dynamicConfig: generatedConfig,
          config: {
            components: {
              Hero: { fields: { 'top.content': { type: 'slot' } } },
            },
          },
        }
      );

      expect(hero.children).toEqual([
        expect.objectContaining({ id: 'Title-2', puckSlot: 'top.content' }),
      ]);
    });

    it('nests the components of a slot it has no field for under the slot name', () => {
      const [hero] = toInputs(
        [
          puckComponent('Hero', 1, {
            'hero.body': [puckComponent('Title', 2)],
            content: [puckComponent('Title', 3)],
          }),
        ],
        { dynamicConfig: generatedConfig }
      );

      expect(hero.props).toEqual({ 'hero.body': [], content: [] });
      expect(hero.children?.map(({ id, puckSlot }) => [id, puckSlot])).toEqual([
        ['Title-2', 'hero.body'],
        ['Title-3', undefined],
      ]);
    });
  });

  describe('derived datasources', () => {
    const derivedDatasources: DerivedDatasources = {
      Lightbox: props => ({
        image: {
          type: 'multiple',
          ids: (props.images as { imageId?: string }[]).flatMap(
            ({ imageId }) => (imageId ? [imageId] : [])
          ),
        },
      }),
    };

    it('derives the datasources of a component from its props', () => {
      const [lightbox] = toInputs(
        [
          puckComponent('Lightbox', 1, {
            images: [{ imageId: 'image-1' }, {}, { imageId: 'image-2' }],
            datasources: {
              image: { type: 'single', id: 'image-9' },
              article: { type: 'list' },
            },
          }),
        ],
        { derivedDatasources }
      );

      expect(lightbox.datasources).toEqual({
        image: {
          type: PuckDatasourceType.Multiple,
          ids: ['image-1', 'image-2'],
        },
        article: { type: PuckDatasourceType.List },
      });
    });

    it('leaves the components it has no derivation for alone', () => {
      const [image] = toInputs(
        [
          puckComponent('Image', 1, {
            datasources: { image: { type: 'single', id: 'image-1' } },
          }),
        ],
        { derivedDatasources }
      );

      expect(image.datasources).toEqual({
        image: { type: PuckDatasourceType.Single, id: 'image-1' },
      });
    });

    it('hands Puck the props without the derived datasources again', () => {
      const content = [
        puckComponent('Lightbox', 1, { images: [{ imageId: 'image-1' }] }),
      ];

      expect(roundTrip(content, { derivedDatasources })).toEqual({ content });
    });
  });

  describe('records a block consumes from its own list', () => {
    const blockConsumes: BlockConsumes = {
      Container: props => props.shown as number,
    };

    it('stores as many records as the Event block lists itself', () => {
      const [event] = toInputs([
        puckComponent('Event', 1, {
          count: 3,
          datasources: { event: { type: 'list' } },
        }),
      ]);

      expect(event.consumes).toBe(3);
      expect(event.props).toEqual({ count: 3 });
    });

    it('stores what the component says it consumes', () => {
      const [container] = toInputs(
        [puckComponent('Container', 1, { shown: 4 })],
        { blockConsumes }
      );

      expect(container.consumes).toBe(4);
    });

    it('leaves it out for components that list nothing themselves', () => {
      const [container] = toInputs(
        [puckComponent('Container', 1, { shown: undefined })],
        { blockConsumes }
      );
      const [title] = toInputs([puckComponent('Title', 1)]);

      expect(container).not.toHaveProperty('consumes');
      expect(title).not.toHaveProperty('consumes');
    });

    it('leaves it out for an Event block that picks its events', () => {
      const [event] = toInputs([
        puckComponent('Event', 1, {
          count: 3,
          datasources: { event: { type: 'multiple', ids: ['event-1'] } },
        }),
      ]);

      expect(event).not.toHaveProperty('consumes');
      expect(event.props).toEqual({ count: 3 });
    });

    it('never takes it from a generated component of the same name', () => {
      const [event] = toInputs([puckComponent('Event', 1, { count: 3 })], {
        dynamicConfig: { components: { Event: { html: '<p/>' } } },
      });

      expect(event).not.toHaveProperty('consumes');
    });

    it('hands Puck the count back as a prop', () => {
      const content = [
        puckComponent('Event', 1, {
          count: 3,
          datasources: { event: { type: 'list' } },
        }),
      ];

      expect(roundTrip(content)).toEqual({ content });
    });
  });
});

describe('fromPuckBlocks', () => {
  it('places every block at the slot path of its parent, in position order', () => {
    expect(
      fromPuckBlocks([
        flatBlock({
          id: 'Title-4',
          type: 'Title',
          parentId: 'DynamicGrid-1',
          puckSlot: 'items[1].content',
          position: 1,
        }),
        flatBlock({
          id: 'DynamicGrid-1',
          type: 'DynamicGrid',
          props: {
            items: [
              { span: { xs: { columnSpan: 12 } }, content: [] },
              { span: { xs: { columnSpan: 6 } }, content: [] },
            ],
          },
        }),
        flatBlock({
          id: 'Image-2',
          type: 'Image',
          parentId: 'DynamicGrid-1',
          puckSlot: 'items[1].content',
        }),
        flatBlock({
          id: 'Quote-3',
          type: 'Quote',
          parentId: 'DynamicGrid-1',
          puckSlot: 'items[0].content',
        }),
        flatBlock({ id: 'Title-5', type: 'Title', position: 1 }),
      ])
    ).toEqual({
      content: [
        {
          type: 'DynamicGrid',
          props: {
            id: 'DynamicGrid-1',
            items: [
              {
                span: { xs: { columnSpan: 12 } },
                content: [{ type: 'Quote', props: { id: 'Quote-3' } }],
              },
              {
                span: { xs: { columnSpan: 6 } },
                content: [
                  { type: 'Image', props: { id: 'Image-2' } },
                  { type: 'Title', props: { id: 'Title-4' } },
                ],
              },
            ],
          },
        },
        { type: 'Title', props: { id: 'Title-5' } },
      ],
    });
  });

  it('puts the children without a slot into the content slot', () => {
    expect(
      fromPuckBlocks([
        flatBlock({ id: 'Container-1', type: 'Container' }),
        flatBlock({ id: 'Title-2', type: 'Title', parentId: 'Container-1' }),
      ]).content
    ).toEqual([
      {
        type: 'Container',
        props: {
          id: 'Container-1',
          content: [{ type: 'Title', props: { id: 'Title-2' } }],
        },
      },
    ]);
  });

  it('creates the slots the props lack and keeps the empty ones', () => {
    expect(
      fromPuckBlocks([
        flatBlock({ id: 'Slider-1', type: 'Slider' }),
        flatBlock({
          id: 'Image-2',
          type: 'Image',
          parentId: 'Slider-1',
          puckSlot: 'items[0].content',
        }),
        flatBlock({
          id: 'Collapsible-3',
          type: 'Collapsible',
          position: 1,
          props: { content: [] },
        }),
      ]).content
    ).toEqual([
      {
        type: 'Slider',
        props: {
          id: 'Slider-1',
          items: [{ content: [{ type: 'Image', props: { id: 'Image-2' } }] }],
        },
      },
      { type: 'Collapsible', props: { id: 'Collapsible-3', content: [] } },
    ]);
  });

  it('puts the children of a generated block under the slot name as it is', () => {
    expect(
      fromPuckBlocks([
        flatBlock({
          id: 'Columns-1',
          kind: PuckBlockKind.Generated,
          type: 'Columns',
          props: { 'col.left': [], 'col.right': [] },
        }),
        flatBlock({
          id: 'Title-2',
          type: 'Title',
          parentId: 'Columns-1',
          puckSlot: 'col.left',
        }),
      ]).content
    ).toEqual([
      {
        type: 'Columns',
        props: {
          id: 'Columns-1',
          'col.left': [{ type: 'Title', props: { id: 'Title-2' } }],
          'col.right': [],
        },
      },
    ]);
  });

  it('moves the lock, visibility, styling and datasources into the props without what GraphQL adds', () => {
    expect(
      fromPuckBlocks([
        flatBlock({
          id: 'Container-1',
          type: 'Container',
          locked: true,
          props: { maxWidth: null, title: 'Kept as stored' },
          visibility: {
            __typename: 'PuckBlockVisibility',
            disabled: null,
            breakpoints: [PuckBreakpoint.Md],
            timings: {
              __typename: 'PuckBlockTimings',
              from: '2026-11-01T08:00:00.000Z',
              to: null,
              weekdays: [PuckWeekday.Monday],
              timeOfDay: {
                __typename: 'PuckBlockTimeOfDay',
                from: '08:00',
                to: '12:00',
              },
            },
          },
          styling: {
            __typename: 'PuckBlockStyling',
            typography: null,
            textAlign: PuckTextAlign.Center,
            color: 'primary.main',
            fontWeight: null,
            textTransform: null,
            background: null,
            backgroundImage: null,
            backgroundSize: null,
            backgroundPosition: null,
            overlay: null,
            overlayOpacity: null,
            margin: {
              __typename: 'PuckSpacingSides',
              top: 2,
              right: null,
              bottom: '8px',
              left: null,
            },
            padding: null,
            border: {
              __typename: 'PuckBorder',
              style: null,
              color: null,
              width: null,
            },
            borderRadius: null,
            minHeight: null,
            maxWidth: null,
            shadow: 0,
            opacity: null,
          },
          datasources: {
            __typename: 'PuckBlockDatasources',
            article: {
              __typename: 'PuckBlockDatasource',
              type: PuckDatasourceType.Single,
              id: 'article-1',
              ids: null,
            },
            page: null,
            event: {
              __typename: 'PuckBlockDatasource',
              type: PuckDatasourceType.UniqueList,
              id: null,
              ids: null,
            },
            image: null,
            memberPlan: null,
            userSubscription: {
              __typename: 'PuckBlockListDatasource',
              type: PuckListDatasourceType.List,
            },
          },
        }),
      ]).content
    ).toStrictEqual([
      {
        type: 'Container',
        props: {
          maxWidth: null,
          title: 'Kept as stored',
          id: 'Container-1',
          locked: true,
          visibility: {
            breakpoints: ['md'],
            timings: {
              from: '2026-11-01T08:00:00.000Z',
              weekdays: ['Monday'],
              timeOfDay: { from: '08:00', to: '12:00' },
            },
          },
          styling: {
            textAlign: 'center',
            color: 'primary.main',
            margin: { top: 2, bottom: '8px' },
            shadow: 0,
          },
          datasources: {
            article: { type: 'single', id: 'article-1' },
            event: { type: 'uniqueList' },
            userSubscription: { type: 'list' },
          },
        },
      },
    ]);
  });

  it('leaves out the lock, visibility, styling and datasources the block does not have', () => {
    expect(
      fromPuckBlocks([
        flatBlock({ id: 'Title-1', type: 'Title', locked: false }),
      ]).content
    ).toStrictEqual([{ type: 'Title', props: { id: 'Title-1' } }]);
  });

  it('never lets the props override the id, lock, visibility, styling or datasources', () => {
    expect(
      fromPuckBlocks([
        flatBlock({
          id: 'Row-1',
          type: 'Row',
          props: {
            id: 'other',
            locked: true,
            visibility: { disabled: true },
            styling: { color: '#000000' },
            datasources: {},
          },
        }),
      ]).content
    ).toStrictEqual([{ type: 'Row', props: { id: 'Row-1' } }]);
  });

  it.each([
    [
      'a block whose parent is not in the list',
      [
        flatBlock({ id: 'Title-1', type: 'Title' }),
        flatBlock({ id: 'Title-2', type: 'Title', parentId: 'Container-9' }),
      ],
    ],
    [
      'a block that is its own parent',
      [
        flatBlock({
          id: 'Container-1',
          type: 'Container',
          parentId: 'Container-1',
        }),
      ],
    ],
    [
      'blocks that share an id',
      [
        flatBlock({ id: 'Container-1', type: 'Container' }),
        flatBlock({
          id: 'Container-1',
          type: 'Container',
          parentId: 'Container-1',
        }),
      ],
    ],
  ])('refuses %s', (_, blocks) => {
    expect(fromPuckBlocks(blocks)).toEqual({ error: expect.any(Error) });
  });
});

describe('the round trip through the API', () => {
  it('restores a document with every slot bearing layout component', () => {
    expect(roundTrip(pageContent)).toEqual({ content: pageContent });
  });

  it('restores a generated block with dotted slot names and the blocks inside', () => {
    const content = [
      puckComponent('Columns', 1, {
        'col.left': [
          puckComponent('Container', 2, {
            content: [puckComponent('Title', 3, { title: 'Left' })],
          }),
        ],
        'col.right': [puckComponent('Title', 4, { title: 'Right' })],
        heading: 'Two columns',
      }),
    ];

    expect(roundTrip(content, { dynamicConfig: generatedConfig })).toEqual({
      content,
    });
  });

  it('restores teasers with their datasources, link switch and the parts inside', () => {
    const content = [
      puckComponent('Grid', 1, {
        layout: { xs: { columns: [1, 1, 1] } },
        datasources: { article: { type: 'uniqueList' } },
        content: [1, 2, 3].map(n =>
          puckComponent('Teaser', 10 + n, {
            linkToRecord: n !== 3,
            datasources: { article: { type: 'slot' } },
            styling: { padding: { top: 2 } },
            content: [
              puckComponent('TeaserImage', 20 + n),
              puckComponent('TeaserTitle', 30 + n),
            ],
          })
        ),
      }),
      puckComponent('Teaser', 4, {
        linkToRecord: true,
        datasources: { page: { type: 'single', id: 'page-1' } },
        content: [
          puckComponent('Container', 5, {
            content: [puckComponent('TeaserLead', 6)],
          }),
        ],
      }),
    ];
    const inputs = allInputs(toInputs(content));

    expect(inputs.find(({ id }) => id === 'Teaser-11')).toMatchObject({
      type: 'Teaser',
      props: { linkToRecord: true, content: [] },
      datasources: { article: { type: PuckDatasourceType.Slot } },
      styling: { padding: { top: 2 } },
      children: [
        { id: 'TeaserImage-21', type: 'TeaserImage' },
        { id: 'TeaserTitle-31', type: 'TeaserTitle' },
      ],
    });
    expect(inputs.find(({ id }) => id === 'Teaser-4')).toMatchObject({
      datasources: {
        page: { type: PuckDatasourceType.Single, id: 'page-1' },
      },
    });
    expect(roundTrip(content)).toEqual({ content });
  });

  it('lifts the styling of every slot bearing layout component', () => {
    expect(
      Object.fromEntries(
        allInputs(toInputs(pageContent))
          .filter(({ styling }) => styling)
          .map(({ id, styling }) => [id, styling])
      )
    ).toEqual({
      'Container-1': fullStylingInput,
      'Grid-2': { padding: { top: 2, bottom: 2 } },
      'Row-5': { background: 'background.paper' },
      'DynamicGrid-6': { maxWidth: '80%', borderRadius: { topLeft: '4px' } },
      'Slider-10': { shadow: 2, opacity: 90 },
      'Collapsible-11': {
        border: { width: { bottom: 1 }, style: PuckBorderStyle.Solid },
      },
    });
  });
});

type FieldMap = Record<
  string,
  { type: string; arrayFields?: FieldMap; objectFields?: FieldMap }
>;

const slotPathsOf = (fields: FieldMap, parent = ''): string[] =>
  Object.entries(fields).flatMap(([name, field]) => {
    const path = parent ? `${parent}.${name}` : name;

    switch (field.type) {
      case 'slot':
        return [path];
      case 'array':
        return slotPathsOf(field.arrayFields ?? {}, `${path}[0]`);
      case 'object':
        return slotPathsOf(field.objectFields ?? {}, path);
      default:
        return [];
    }
  });

const sampleStyling = {
  color: 'primary.main',
  padding: { top: 2, bottom: '12px' },
  shadow: 1,
};

const samplePropsOf = (fields: FieldMap): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(fields).flatMap(([name, field]): [string, unknown][] => {
      switch (field.type) {
        case 'slot':
          return [[name, [puckComponent('Title', name.length)]]];
        case 'styling':
          return [[name, sampleStyling]];
        case 'array':
          return [[name, [samplePropsOf(field.arrayFields ?? {})]]];
        case 'object':
          return [[name, samplePropsOf(field.objectFields ?? {})]];
        default:
          return [];
      }
    })
  );

describe('every component of the config', () => {
  const componentFields = Object.entries(config.components).map(
    ([name, component]): [string, FieldMap] => [
      name,
      (component.fields ?? {}) as unknown as FieldMap,
    ]
  );

  it.each(componentFields)(
    'has every slot of %s detected and restored',
    (name, fields) => {
      const content = [
        { type: name, props: { id: `${name}-1`, ...samplePropsOf(fields) } },
      ];
      const [block] = toInputs(content);

      expect(
        (block.children ?? []).map(({ puckSlot }) => puckSlot ?? 'content')
      ).toEqual(slotPathsOf(fields));
      expect(roundTrip(content)).toEqual({ content });
    }
  );

  const styledComponents = componentFields.filter(
    ([, fields]) => fields.styling?.type === 'styling'
  );

  it.each(styledComponents)(
    'lifts the styling of %s out of the props and restores it',
    (name, fields) => {
      const content = [
        { type: name, props: { id: `${name}-1`, ...samplePropsOf(fields) } },
      ];
      const [block] = toInputs(content);

      expect(block.styling).toEqual(sampleStyling);
      expect(block.props).not.toHaveProperty('styling');
      expect(roundTrip(content)).toEqual({ content });
    }
  );

  it('finds the components that take a styling', () => {
    expect(styledComponents.map(([name]) => name)).toEqual(
      expect.arrayContaining([
        'Container',
        'Grid',
        'DynamicGrid',
        'Row',
        'Slider',
        'Collapsible',
        'Form',
        'Teaser',
      ])
    );
  });

  it('finds the slots of the layout components', () => {
    expect(
      Object.fromEntries(
        componentFields
          .map(([name, fields]) => [name, slotPathsOf(fields)] as const)
          .filter(([, paths]) => paths.length > 0)
      )
    ).toEqual(
      expect.objectContaining({
        Container: ['content'],
        Grid: ['content'],
        Row: ['content'],
        Collapsible: ['content'],
        Slider: ['items[0].content'],
        DynamicGrid: ['items[0].content'],
        Teaser: ['content'],
      })
    );
  });
});
