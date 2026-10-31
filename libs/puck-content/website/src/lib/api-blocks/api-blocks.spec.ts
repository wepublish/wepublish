import { Weekday } from '@wepublish/editor/api';
import { rootSchemas } from '@wepublish/puck-content/editor';
import { z } from 'zod/v4';

import { getPuckConfig } from '../config';
import { PuckContent, PuckData, PuckDocumentKind } from '../document/document';
import {
  ApiBlock,
  apiBlocksSchema,
  FlatApiBlock,
  fromFlatPuckBlocks,
  toApiBlocks,
  toApiDocument,
  toFlatPuckBlocks,
  toPuckContent,
  toPuckData,
  toPuckRootProps,
} from './api-blocks';

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

const asContent = (components: unknown[]) => components as PuckContent;

const puckComponent = (
  type: string,
  n: number,
  props: Record<string, unknown> = {}
) => ({ type, props: { id: `${type}-${n}`, ...props } });

const asJson = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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

const pageDocument: PuckData<'page'> = {
  root: { props: { title: 'Page', hidden: false, tags: ['tag-1'] } },
  content: asContent([
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
              content: [puckComponent('Title', 4, { title: 'Nested' })],
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
            puckComponent('Image', 8, { imageId: 'image-1' }),
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
      datasources: {
        page: { type: 'single', id: 'page-1' },
        event: { type: 'multiple', ids: ['event-1', 'event-2'] },
      },
    }),
  ]),
};

const articleDocument: PuckData<'article'> = {
  root: {
    props: {
      preTitle: 'Kicker',
      title: 'Article',
      authorIds: ['author-1'],
      breaking: true,
    },
  },
  content: asContent([
    puckComponent('Collapsible', 1, {
      title: 'More',
      locked: true,
      content: [puckComponent('Title', 2, { title: 'Inside' })],
    }),
  ]),
};

const graphQLNulls = {
  locked: null,
  visibility: null,
  styling: null,
  datasources: null,
};

describe('toPuckContent', () => {
  it('turns a block into component data with its type, props and id', () => {
    const blocks: ApiBlock[] = [
      {
        id: id(1),
        visibility: {},
        datasources: {},
        type: 'Button',
        data: { text: 'Hello', variant: 'contained' },
      },
    ];

    expect(toPuckContent(blocks)).toEqual([
      {
        type: 'Button',
        props: {
          id: id(1),
          text: 'Hello',
          variant: 'contained',
          visibility: {},
          datasources: {},
        },
      },
    ]);
  });

  it('restores the datasources of the block', () => {
    const datasources = {
      article: { type: 'uniqueList' as const },
      memberPlan: { type: 'multiple' as const, ids: ['m1'] },
    };

    const [component] = toPuckContent([
      { id: id(1), datasources, type: 'Grid', data: {} },
    ]);

    expect(component.props.datasources).toEqual(datasources);
  });

  it('restores the styling of the block into the styling prop', () => {
    const [component] = toPuckContent([
      { id: id(1), styling: fullStyling, type: 'Container', data: {} },
    ]);

    expect(component.props).toEqual({ id: id(1), styling: fullStyling });
  });

  it('fills the content slot with the children, recursively', () => {
    const [container] = toPuckContent([
      {
        id: id(1),
        visibility: {},
        datasources: {},
        type: 'Container',
        data: {},
        children: [
          {
            id: id(2),
            visibility: {},
            datasources: {},
            type: 'Grid',
            data: {},
            children: [
              {
                id: id(3),
                visibility: {},
                datasources: {},
                type: 'Title',
                data: {},
              },
            ],
          },
        ],
      },
    ]);

    expect(container.props.content).toEqual([
      {
        type: 'Grid',
        props: {
          id: id(2),
          visibility: {},
          datasources: {},
          content: [
            {
              type: 'Title',
              props: { id: id(3), visibility: {}, datasources: {} },
            },
          ],
        },
      },
    ]);
  });

  it('places every child at the slot path it came from, in order', () => {
    const [grid] = toPuckContent([
      {
        id: 'DynamicGrid-1',
        type: 'DynamicGrid',
        data: {
          items: [
            { span: { xs: { columnSpan: 12 } }, content: [] },
            { span: { xs: { columnSpan: 6 } }, content: [] },
          ],
        },
        children: [
          { id: 'Image-2', slot: 'items[1].content', type: 'Image', data: {} },
          { id: 'Quote-3', slot: 'items[0].content', type: 'Quote', data: {} },
          { id: 'Title-4', slot: 'items[1].content', type: 'Title', data: {} },
        ],
      },
    ]);

    expect(grid.props).toEqual({
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
    });
  });

  it('creates the slots the block data lacks', () => {
    const [slider, container] = toPuckContent([
      {
        id: 'Slider-1',
        type: 'Slider',
        data: {},
        children: [
          { id: 'Image-2', slot: 'items[0].content', type: 'Image', data: {} },
        ],
      },
      {
        id: 'Container-3',
        type: 'Container',
        data: {},
        children: [{ id: 'Title-4', type: 'Title', data: {} }],
      },
    ]);

    expect(slider.props.items).toEqual([
      { content: [{ type: 'Image', props: { id: 'Image-2' } }] },
    ]);
    expect(container.props.content).toEqual([
      { type: 'Title', props: { id: 'Title-4' } },
    ]);
  });

  it('keeps the empty slots of the block data', () => {
    const [collapsible] = toPuckContent([
      { id: 'Collapsible-1', type: 'Collapsible', data: { content: [] } },
    ]);

    expect(collapsible.props).toEqual({ id: 'Collapsible-1', content: [] });
  });

  it('passes a type prop of the data to the component, apart from its component type', () => {
    expect(
      toPuckContent([
        { id: id(1), type: 'Button', data: { type: 'submit', text: 'Send' } },
      ])
    ).toEqual([
      {
        type: 'Button',
        props: { id: id(1), type: 'submit', text: 'Send' },
      },
    ]);
  });

  it('never lets the block data override the id, lock, visibility, styling or datasources', () => {
    const [component] = toPuckContent([
      {
        id: id(1),
        datasources: { page: { type: 'list' } },
        styling: { color: 'primary.main' },
        type: 'Row',
        data: {
          id: 'other',
          locked: true,
          visibility: { disabled: true },
          styling: { color: '#000000' },
          datasources: {},
        },
      },
    ]);

    expect(component.props).toEqual({
      id: id(1),
      styling: { color: 'primary.main' },
      datasources: { page: { type: 'list' } },
    });
  });

  it('leaves out the styling when the block data holds the only one', () => {
    const [component] = toPuckContent([
      {
        id: id(1),
        type: 'Row',
        data: { styling: { color: '#000000' } },
      },
    ]);

    expect(component.props).toEqual({ id: id(1) });
  });
});

describe('visibility', () => {
  it('moves the block visibility into the component props', () => {
    const visibility = {
      disabled: true,
      timings: { weekdays: [Weekday.Monday] },
      breakpoints: ['md' as const],
    };

    expect(
      toPuckData(
        'page',
        toFlatPuckBlocks([
          { id: id(1), visibility, datasources: {}, type: 'Title', data: {} },
        ])
      ).content
    ).toEqual([
      { type: 'Title', props: { id: id(1), visibility, datasources: {} } },
    ]);
  });

  it('leaves the visibility, styling and datasources out when the block has none', () => {
    expect(
      toPuckData('page', [
        {
          id: 'Title-1',
          type: 'Title',
          position: 0,
          data: {},
          ...graphQLNulls,
        },
      ]).content
    ).toEqual([{ type: 'Title', props: { id: 'Title-1' } }]);
  });
});

describe('locked', () => {
  it('moves the block lock into the component props', () => {
    expect(
      toPuckData(
        'page',
        toFlatPuckBlocks([
          {
            id: id(1),
            locked: true,
            visibility: {},
            datasources: {},
            type: 'Title',
            data: {},
          },
        ])
      ).content
    ).toEqual([
      {
        type: 'Title',
        props: { id: id(1), locked: true, visibility: {}, datasources: {} },
      },
    ]);
  });

  it('leaves unlocked blocks without a lock prop', () => {
    expect(
      toPuckData(
        'page',
        toFlatPuckBlocks([
          {
            id: id(1),
            locked: false,
            visibility: {},
            datasources: {},
            type: 'Title',
            data: {},
          },
        ])
      ).content[0].props
    ).not.toHaveProperty('locked');
  });
});

describe('toPuckData', () => {
  it('validates the API response and puts the blocks into the root content', () => {
    expect(
      toPuckData('page', [
        {
          __typename: 'PuckBlock',
          id: id(1),
          type: 'Title',
          parentId: null,
          slot: null,
          position: 0,
          locked: null,
          visibility: { __typename: 'PuckBlockVisibility', disabled: null },
          styling: null,
          datasources: { __typename: 'PuckBlockDatasources', article: null },
          data: { title: 'Hi' },
        },
      ])
    ).toEqual({
      root: { props: {} },
      content: [
        {
          type: 'Title',
          props: { id: id(1), visibility: {}, datasources: {}, title: 'Hi' },
        },
      ],
    });
  });

  it('rebuilds the slots from the flat list the API returns', () => {
    expect(
      toPuckData('page', [
        { id: 'Container-1', type: 'Container', position: 0, data: {} },
        {
          id: 'Title-2',
          type: 'Title',
          parentId: 'Container-1',
          slot: 'content',
          position: 0,
          data: { title: 'Inside' },
        },
        { id: 'Quote-3', type: 'Quote', position: 1, data: { quote: 'Hi' } },
      ]).content
    ).toEqual([
      {
        type: 'Container',
        props: {
          id: 'Container-1',
          content: [
            { type: 'Title', props: { id: 'Title-2', title: 'Inside' } },
          ],
        },
      },
      { type: 'Quote', props: { id: 'Quote-3', quote: 'Hi' } },
    ]);
  });

  it('expects the flat list instead of the stored tree', () => {
    expect(() =>
      toPuckData('page', [
        {
          id: 'Container-1',
          type: 'Container',
          data: {},
          children: [{ id: 'Title-2', type: 'Title', data: {} }],
        },
      ])
    ).toThrow(z.ZodError);
  });

  it('rejects a block whose parent is not in the list', () => {
    expect(() =>
      toPuckData('page', [
        { id: 'Title-1', type: 'Title', position: 0, data: {} },
        {
          id: 'Title-2',
          type: 'Title',
          parentId: 'Container-9',
          position: 0,
          data: {},
        },
      ])
    ).toThrow(z.ZodError);
  });

  it('rejects blocks that share an id', () => {
    expect(() =>
      toPuckData('page', [
        { id: 'Title-1', type: 'Title', position: 0, data: {} },
        { id: 'Title-1', type: 'Title', position: 1, data: {} },
      ])
    ).toThrow(z.ZodError);
  });

  it('rejects blocks that are their own parent', () => {
    expect(() =>
      toPuckData('page', [
        {
          id: 'Container-1',
          type: 'Container',
          parentId: 'Container-1',
          position: 0,
          data: {},
        },
      ])
    ).toThrow(z.ZodError);
  });

  it('rejects blocks without a position', () => {
    expect(() =>
      toPuckData('page', [{ id: 'Title-1', type: 'Title', data: {} }])
    ).toThrow(z.ZodError);
  });

  it('rejects styling the website could not render', () => {
    expect(() =>
      toPuckData('page', [
        {
          id: 'Container-1',
          type: 'Container',
          position: 0,
          styling: { shadow: 30 },
          data: {},
        },
      ])
    ).toThrow(z.ZodError);
  });

  it('maps the page metadata onto the root props and drops empty values', () => {
    expect(
      toPuckData('page', [], {
        title: 'Page',
        hidden: false,
        seoTitle: null,
        lead: '',
        tags: ['tag-1'],
        properties: [{ key: 'theme', value: 'dark', public: true }],
      }).root
    ).toEqual({
      props: {
        title: 'Page',
        hidden: false,
        tags: ['tag-1'],
        properties: [{ key: 'theme', value: 'dark', public: true }],
      },
    });
  });

  it('maps the article metadata onto the root props of an article', () => {
    expect(
      toPuckData('article', [], {
        preTitle: 'Kicker',
        title: 'Article',
        authorIds: ['author-1', 'author-2'],
        paywallId: null,
        canonicalUrl: '',
        breaking: true,
        socialMediaAuthorIds: ['author-2'],
      }).root
    ).toEqual({
      props: {
        preTitle: 'Kicker',
        title: 'Article',
        authorIds: ['author-1', 'author-2'],
        breaking: true,
        socialMediaAuthorIds: ['author-2'],
      },
    });
  });

  it('rejects invalid article metadata', () => {
    expect(() =>
      toPuckData('article', [], { authorIds: 'author-1' })
    ).toThrow();
  });

  it('rejects invalid page metadata', () => {
    expect(() =>
      toPuckData('page', [], {
        properties: [{ value: 'dark', public: true }],
      })
    ).toThrow();
  });

  it('rejects blocks without a component type', () => {
    expect(() =>
      toPuckData('page', [
        {
          id: id(1),
          position: 0,
          visibility: {},
          datasources: {},
          data: { title: 'Hi' },
        },
      ])
    ).toThrow();
  });

  it('rejects blocks that keep the component type inside the data', () => {
    expect(() =>
      toPuckData('page', [
        { id: id(1), position: 0, data: { type: 'Title', title: 'Hi' } },
      ])
    ).toThrow();
  });

  it('rejects blocks with an empty component type', () => {
    expect(() =>
      toPuckData('page', [{ id: id(1), type: '', position: 0, data: {} }])
    ).toThrow();
  });

  it('rejects a component inside the data of a nested block', () => {
    expect(() =>
      toPuckData('page', [
        { id: 'Container-1', type: 'Container', position: 0, data: {} },
        {
          id: 'Title-2',
          type: 'Title',
          parentId: 'Container-1',
          position: 0,
          data: { content: [{ type: 'Quote', props: { id: 'Quote-3' } }] },
        },
      ])
    ).toThrow(z.ZodError);
  });
});

describe('toPuckRootProps', () => {
  it('keeps only the root props of the given document kind', () => {
    const metadata = {
      title: 'Title',
      showFooter: false,
      authorIds: ['author-1'],
    };

    expect(toPuckRootProps('page', metadata)).toEqual({
      title: 'Title',
      showFooter: false,
    });
    expect(toPuckRootProps('article', metadata)).toEqual({
      title: 'Title',
      authorIds: ['author-1'],
    });
  });

  it('starts empty without metadata', () => {
    expect(toPuckRootProps('article')).toEqual({});
  });

  it.each(['page', 'article'] as const)(
    'loads a %s whose slug breaks the slug format, so it can be fixed',
    kind => {
      ['Impressum', 'about/team', 'über-uns'].forEach(slug =>
        expect(toPuckRootProps(kind, { slug })).toEqual({ slug })
      );
    }
  );

  it.each(['page', 'article'] as const)(
    'loads a %s property without a key, so it can be fixed',
    kind => {
      const properties = [{ key: '', value: 'dark', public: true }];

      expect(toPuckRootProps(kind, { properties })).toEqual({ properties });
    }
  );

  it.each(
    Object.entries(rootSchemas).flatMap(([kind, schema]) =>
      Object.entries(schema.shape)
        .filter(([, field]) => field instanceof z.ZodString)
        .map(([key]): [PuckDocumentKind, string] => [
          kind as PuckDocumentKind,
          key,
        ])
    )
  )('loads any text the %s %s holds', (kind, key) => {
    const metadata = { [key]: 'Not / A Valid Format – ü' };

    expect(toPuckRootProps(kind, metadata)).toEqual(metadata);
  });
});

describe('toApiBlocks', () => {
  it('splits the id, lock, visibility, styling and datasources off the component props', () => {
    expect(
      toApiBlocks(
        asContent([
          puckComponent('Container', 1, {
            locked: true,
            visibility: { disabled: true },
            styling: { color: 'primary.main', padding: { top: 2 } },
            datasources: { article: { type: 'list' } },
            maxWidth: 'md',
          }),
        ])
      )
    ).toEqual([
      {
        id: 'Container-1',
        locked: true,
        visibility: { disabled: true },
        styling: { color: 'primary.main', padding: { top: 2 } },
        datasources: { article: { type: 'list' } },
        type: 'Container',
        data: { maxWidth: 'md' },
      },
    ]);
  });

  it.each([
    ['an empty styling', {}],
    ['a styling without values', { color: undefined, typography: '' }],
    ['a styling with empty groups', { margin: {}, border: { width: {} } }],
    ['a cleared styling', undefined],
  ])('leaves out %s', (_, styling) => {
    const [block] = toApiBlocks(
      asContent([puckComponent('Container', 1, { styling })])
    );

    expect(block).toStrictEqual({
      id: 'Container-1',
      type: 'Container',
      data: {},
    });
  });

  it('drops the empty values inside the styling', () => {
    const [block] = toApiBlocks(
      asContent([
        puckComponent('Container', 1, {
          styling: {
            color: '',
            margin: { top: 2, left: undefined },
            border: { width: { top: 1 }, color: null },
            padding: {},
            shadow: 0,
          },
        }),
      ])
    );

    expect(block.styling).toStrictEqual({
      margin: { top: 2 },
      border: { width: { top: 1 } },
      shadow: 0,
    });
  });

  it('stores the datasources without the data the API resolved', () => {
    const [block] = toApiBlocks(
      asContent([
        puckComponent('Grid', 1, {
          datasources: {
            article: { type: 'uniqueList', data: [{ id: 'article-1' }] },
            image: { type: 'single', id: 'image-1', data: null },
            event: { type: 'multiple', ids: ['event-1'], data: [] },
          },
        }),
      ])
    );

    expect(block.datasources).toStrictEqual({
      article: { type: 'uniqueList' },
      image: { type: 'single', id: 'image-1' },
      event: { type: 'multiple', ids: ['event-1'] },
    });
  });

  it('keeps only the record ids a datasource type uses', () => {
    const [block] = toApiBlocks(
      asContent([
        puckComponent('Grid', 1, {
          datasources: {
            article: { type: 'list', id: 'article-1', ids: ['article-2'] },
            page: { type: 'single', id: 'page-1', ids: ['page-2'] },
            event: { type: 'multiple', id: 'event-1', ids: ['event-2'] },
          },
        }),
      ])
    );

    expect(block.datasources).toStrictEqual({
      article: { type: 'list' },
      page: { type: 'single', id: 'page-1' },
      event: { type: 'multiple', ids: ['event-2'] },
    });
  });

  it('leaves unlocked blocks without a lock', () => {
    const [block] = toApiBlocks(
      asContent([puckComponent('Title', 1, { locked: false })])
    );

    expect(block).not.toHaveProperty('locked');
  });

  it('moves the components of the content slot into the unnamed children', () => {
    expect(
      toApiBlocks(
        asContent([
          puckComponent('Container', 1, {
            maxWidth: 'md',
            content: [
              puckComponent('Title', 2, { title: 'A' }),
              puckComponent('Quote', 3, { quote: 'B' }),
            ],
          }),
        ])
      )
    ).toEqual([
      {
        id: 'Container-1',
        type: 'Container',
        data: { maxWidth: 'md', content: [] },
        children: [
          { id: 'Title-2', type: 'Title', data: { title: 'A' } },
          { id: 'Quote-3', type: 'Quote', data: { quote: 'B' } },
        ],
      },
    ]);
  });

  it('names every other slot by its path, in slot then position order', () => {
    expect(
      toApiBlocks(
        asContent([
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
        ])
      )
    ).toEqual([
      {
        id: 'DynamicGrid-1',
        type: 'DynamicGrid',
        data: {
          items: [
            { span: { xs: { columnSpan: 12 } }, content: [] },
            { span: { xs: { columnSpan: 6 } }, content: [] },
          ],
        },
        children: [
          { id: 'Title-2', slot: 'items[0].content', type: 'Title', data: {} },
          { id: 'Image-3', slot: 'items[1].content', type: 'Image', data: {} },
          { id: 'Quote-4', slot: 'items[1].content', type: 'Quote', data: {} },
        ],
      },
    ]);
  });

  it('converts the slots of nested components recursively', () => {
    expect(
      toApiBlocks(
        asContent([
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
        ])
      )
    ).toEqual([
      {
        id: 'Container-1',
        type: 'Container',
        data: { content: [] },
        children: [
          {
            id: 'Grid-2',
            type: 'Grid',
            data: { content: [] },
            children: [
              {
                id: 'Container-3',
                type: 'Container',
                data: { content: [] },
                children: [{ id: 'Title-4', type: 'Title', data: {} }],
              },
            ],
          },
        ],
      },
    ]);
  });

  it('keeps empty slots in the data without adding children', () => {
    const [block] = toApiBlocks(
      asContent([
        puckComponent('Collapsible', 1, { title: 'More', content: [] }),
      ])
    );

    expect(block).toStrictEqual({
      id: 'Collapsible-1',
      type: 'Collapsible',
      data: { title: 'More', content: [] },
    });
  });

  it('leaves out undefined values so the blocks are plain JSON', () => {
    const blocks = toApiBlocks(
      asContent([
        puckComponent('Container', 1, {
          maxWidth: undefined,
          visibility: { disabled: undefined, breakpoints: ['md'] },
          datasources: { article: undefined },
          content: [puckComponent('Title', 2, { title: undefined })],
        }),
      ])
    );

    expect(blocks).toStrictEqual(asJson(blocks));
  });

  it('leaves out what only Puck needs', () => {
    const blocks = toApiBlocks(
      asContent([
        {
          type: 'Title',
          readOnly: { title: true },
          props: { id: 'Title-1', title: 'Hi' },
        },
      ])
    );

    expect(blocks).toStrictEqual([
      { id: 'Title-1', type: 'Title', data: { title: 'Hi' } },
    ]);
  });

  it('keeps the block props and the Puck shape out of every block data', () => {
    const allBlocks = (blocks: ApiBlock[]): ApiBlock[] =>
      blocks.flatMap(block => [block, ...allBlocks(block.children ?? [])]);

    const blocks = allBlocks(toApiBlocks(pageDocument.content));

    expect(blocks).toHaveLength(13);
    blocks.forEach(({ data }) =>
      [
        'id',
        'type',
        'locked',
        'visibility',
        'styling',
        'datasources',
        'props',
      ].forEach(key => expect(data).not.toHaveProperty(key))
    );
  });

  it('produces blocks the API accepts', () => {
    expect(() =>
      apiBlocksSchema.parse(toApiBlocks(pageDocument.content))
    ).not.toThrow();
  });

  it('lifts the styling of every slot bearing layout component', () => {
    const allBlocks = (blocks: ApiBlock[]): ApiBlock[] =>
      blocks.flatMap(block => [block, ...allBlocks(block.children ?? [])]);

    expect(
      Object.fromEntries(
        allBlocks(toApiBlocks(pageDocument.content))
          .filter(({ styling }) => styling)
          .map(({ id, styling }) => [id, styling])
      )
    ).toEqual({
      'Container-1': fullStyling,
      'Grid-2': { padding: { top: 2, bottom: 2 } },
      'Row-5': { background: 'background.paper' },
      'DynamicGrid-6': { maxWidth: '80%', borderRadius: { topLeft: '4px' } },
      'Slider-10': { shadow: 2, opacity: 90 },
      'Collapsible-11': {
        border: { width: { bottom: 1 }, style: 'solid' },
      },
    });
  });

  it('round trips a document with every slot bearing layout component', () => {
    expect(
      toPuckData(
        'page',
        asJson(toFlatPuckBlocks(toApiBlocks(pageDocument.content))),
        pageDocument.root.props
      )
    ).toEqual(pageDocument);
  });

  it('round trips the stored tree without the flat list', () => {
    expect(toPuckContent(asJson(toApiBlocks(pageDocument.content)))).toEqual(
      pageDocument.content
    );
  });

  it('keeps a type prop of the component in the data and round trips it', () => {
    const content = asContent([
      puckComponent('Container', 1, {
        content: [puckComponent('Button', 2, { type: 'submit', text: 'Send' })],
      }),
    ]);
    const blocks = toApiBlocks(content);

    expect(blocks[0].children).toEqual([
      {
        id: 'Button-2',
        type: 'Button',
        data: { type: 'submit', text: 'Send' },
      },
    ]);
    expect(toPuckContent(asJson(blocks))).toEqual(content);
  });
});

describe('toApiDocument', () => {
  it('splits a document into the API blocks and the root props', () => {
    expect(toApiDocument('article', articleDocument)).toEqual({
      blocks: [
        {
          id: 'Collapsible-1',
          locked: true,
          type: 'Collapsible',
          data: { title: 'More', content: [] },
          children: [
            { id: 'Title-2', type: 'Title', data: { title: 'Inside' } },
          ],
        },
      ],
      rootProps: articleDocument.root.props,
    });
  });

  it('is undone by toPuckData on the flat list the API returns', () => {
    const { blocks, rootProps } = toApiDocument('page', pageDocument);

    expect(
      toPuckData('page', asJson(toFlatPuckBlocks(blocks)), rootProps)
    ).toEqual(pageDocument);
  });

  it('rejects styling the API would not accept', () => {
    expect(() =>
      toApiDocument('page', {
        root: {},
        content: asContent([
          puckComponent('Container', 1, { styling: { opacity: 150 } }),
        ]),
      })
    ).toThrow(z.ZodError);
  });

  it('starts without root props when the document has none', () => {
    expect(toApiDocument('page', { root: {}, content: [] }).rootProps).toEqual(
      {}
    );
  });

  it('rejects documents the API could not load again', () => {
    expect(() =>
      toApiDocument('page', {
        root: {},
        content: asContent([
          puckComponent('Title', 1, {
            visibility: { timings: { weekdays: ['Funday'] } },
          }),
        ]),
      })
    ).toThrow(z.ZodError);
  });
});

const storedTree: ApiBlock[] = [
  {
    id: 'Container-1',
    type: 'Container',
    styling: { padding: { top: 2 } },
    data: { content: [] },
    children: [
      { id: 'Title-2', type: 'Title', data: { title: 'A' } },
      {
        id: 'Grid-3',
        type: 'Grid',
        locked: true,
        data: { content: [] },
        children: [{ id: 'Quote-4', type: 'Quote', data: { quote: 'B' } }],
      },
    ],
  },
  {
    id: 'DynamicGrid-5',
    type: 'DynamicGrid',
    data: { items: [{ content: [] }, { content: [] }] },
    children: [
      { id: 'Image-6', slot: 'items[0].content', type: 'Image', data: {} },
      { id: 'Title-7', slot: 'items[1].content', type: 'Title', data: {} },
      { id: 'Quote-8', slot: 'items[1].content', type: 'Quote', data: {} },
    ],
  },
];

const flatList: FlatApiBlock[] = [
  {
    id: 'Container-1',
    type: 'Container',
    parentId: null,
    slot: null,
    position: 0,
    styling: { padding: { top: 2 } },
    data: { content: [] },
  },
  {
    id: 'Title-2',
    type: 'Title',
    parentId: 'Container-1',
    slot: 'content',
    position: 0,
    data: { title: 'A' },
  },
  {
    id: 'Grid-3',
    type: 'Grid',
    parentId: 'Container-1',
    slot: 'content',
    position: 1,
    locked: true,
    data: { content: [] },
  },
  {
    id: 'Quote-4',
    type: 'Quote',
    parentId: 'Grid-3',
    slot: 'content',
    position: 0,
    data: { quote: 'B' },
  },
  {
    id: 'DynamicGrid-5',
    type: 'DynamicGrid',
    parentId: null,
    slot: null,
    position: 1,
    data: { items: [{ content: [] }, { content: [] }] },
  },
  {
    id: 'Image-6',
    type: 'Image',
    parentId: 'DynamicGrid-5',
    slot: 'items[0].content',
    position: 0,
    data: {},
  },
  {
    id: 'Title-7',
    type: 'Title',
    parentId: 'DynamicGrid-5',
    slot: 'items[1].content',
    position: 0,
    data: {},
  },
  {
    id: 'Quote-8',
    type: 'Quote',
    parentId: 'DynamicGrid-5',
    slot: 'items[1].content',
    position: 1,
    data: {},
  },
];

const ids = (blocks: { id: string }[]) => blocks.map(({ id }) => id);

describe('toFlatPuckBlocks', () => {
  it('lists every block in depth first tree order with its parent, slot and position', () => {
    expect(toFlatPuckBlocks(storedTree)).toStrictEqual(flatList);
  });

  it('keeps the block props of every block', () => {
    const [block] = toFlatPuckBlocks([
      {
        id: 'Container-1',
        type: 'Container',
        locked: true,
        visibility: { breakpoints: ['md'] },
        styling: { opacity: 50 },
        datasources: { article: { type: 'list' } },
        data: { maxWidth: 'md' },
      },
    ]);

    expect(block).toStrictEqual({
      id: 'Container-1',
      type: 'Container',
      parentId: null,
      slot: null,
      position: 0,
      locked: true,
      visibility: { breakpoints: ['md'] },
      styling: { opacity: 50 },
      datasources: { article: { type: 'list' } },
      data: { maxWidth: 'md' },
    });
  });

  it('counts the position within each slot of the parent', () => {
    expect(
      toFlatPuckBlocks(storedTree).map(({ id, slot, position }) => [
        id,
        slot,
        position,
      ])
    ).toEqual([
      ['Container-1', null, 0],
      ['Title-2', 'content', 0],
      ['Grid-3', 'content', 1],
      ['Quote-4', 'content', 0],
      ['DynamicGrid-5', null, 1],
      ['Image-6', 'items[0].content', 0],
      ['Title-7', 'items[1].content', 0],
      ['Quote-8', 'items[1].content', 1],
    ]);
  });
});

describe('fromFlatPuckBlocks', () => {
  it('rebuilds the tree from the parent, slot and position of every block', () => {
    expect(fromFlatPuckBlocks(flatList)).toStrictEqual(storedTree);
  });

  it('is undone by toFlatPuckBlocks', () => {
    const tree = toApiBlocks(pageDocument.content);

    expect(fromFlatPuckBlocks(toFlatPuckBlocks(tree))).toEqual(tree);
  });

  it('orders the blocks of a slot by their position, whatever order the list has', () => {
    const shuffled = [...flatList].reverse();

    expect(toPuckContent(fromFlatPuckBlocks(shuffled))).toEqual(
      toPuckContent(storedTree)
    );
  });

  it('orders the top level blocks by their position', () => {
    expect(
      ids(
        fromFlatPuckBlocks([
          { id: 'Title-2', type: 'Title', position: 1, data: {} },
          { id: 'Title-3', type: 'Title', position: 2, data: {} },
          { id: 'Title-1', type: 'Title', position: 0, data: {} },
        ])
      )
    ).toEqual(['Title-1', 'Title-2', 'Title-3']);
  });

  it('keeps the slots of a parent in the order the list names them', () => {
    const [grid] = fromFlatPuckBlocks([
      { id: 'DynamicGrid-1', type: 'DynamicGrid', position: 0, data: {} },
      {
        id: 'Title-3',
        type: 'Title',
        parentId: 'DynamicGrid-1',
        slot: 'items[1].content',
        position: 0,
        data: {},
      },
      {
        id: 'Title-2',
        type: 'Title',
        parentId: 'DynamicGrid-1',
        slot: 'items[0].content',
        position: 1,
        data: {},
      },
      {
        id: 'Image-4',
        type: 'Image',
        parentId: 'DynamicGrid-1',
        slot: 'items[0].content',
        position: 0,
        data: {},
      },
    ]);

    expect(grid.children?.map(({ id, slot }) => [id, slot])).toEqual([
      ['Title-3', 'items[1].content'],
      ['Image-4', 'items[0].content'],
      ['Title-2', 'items[0].content'],
    ]);
  });

  it('puts children without a slot into the content slot', () => {
    const [container] = fromFlatPuckBlocks([
      { id: 'Container-1', type: 'Container', position: 0, data: {} },
      {
        id: 'Title-2',
        type: 'Title',
        parentId: 'Container-1',
        slot: null,
        position: 0,
        data: {},
      },
    ]);

    expect(container.children).toStrictEqual([
      { id: 'Title-2', type: 'Title', data: {} },
    ]);
  });

  it('leaves the slot of top level blocks out', () => {
    expect(
      fromFlatPuckBlocks([
        {
          id: 'Title-1',
          type: 'Title',
          slot: 'items[0].content',
          position: 0,
          data: {},
        },
      ])
    ).toStrictEqual([{ id: 'Title-1', type: 'Title', data: {} }]);
  });

  it('drops what GraphQL adds to the typed block props', () => {
    expect(
      fromFlatPuckBlocks([
        {
          __typename: 'PuckBlock',
          id: 'Container-1',
          type: 'Container',
          parentId: null,
          slot: null,
          position: 0,
          locked: null,
          visibility: {
            __typename: 'PuckBlockVisibility',
            disabled: null,
            timings: {
              __typename: 'PuckBlockTimings',
              from: '2026-11-01T08:00:00.000Z',
              to: null,
              weekdays: null,
              timeOfDay: {
                __typename: 'PuckTimeOfDay',
                from: '08:00',
                to: '12:00',
              },
            },
            breakpoints: ['md'],
          },
          styling: {
            __typename: 'PuckBlockStyling',
            color: 'primary.main',
            typography: null,
            margin: {
              __typename: 'PuckSides',
              top: 2,
              right: null,
              bottom: '8px',
              left: null,
            },
            padding: null,
            border: {
              __typename: 'PuckBorder',
              width: null,
              style: null,
              color: null,
            },
            shadow: 0,
          },
          datasources: {
            __typename: 'PuckBlockDatasources',
            article: {
              __typename: 'PuckBlockDatasource',
              type: 'single',
              id: 'article-1',
              ids: null,
            },
            page: null,
            image: {
              __typename: 'PuckBlockDatasource',
              type: 'list',
              id: null,
              ids: null,
            },
          },
          data: { maxWidth: null, title: 'Kept as stored' },
        },
      ])
    ).toStrictEqual([
      {
        id: 'Container-1',
        type: 'Container',
        visibility: {
          timings: {
            from: '2026-11-01T08:00:00.000Z',
            timeOfDay: { from: '08:00', to: '12:00' },
          },
          breakpoints: ['md'],
        },
        styling: {
          color: 'primary.main',
          margin: { top: 2, bottom: '8px' },
          shadow: 0,
        },
        datasources: {
          article: { type: 'single', id: 'article-1' },
          image: { type: 'list' },
        },
        data: { maxWidth: null, title: 'Kept as stored' },
      },
    ]);
  });

  it('leaves out a styling GraphQL returns without values', () => {
    expect(
      fromFlatPuckBlocks([
        {
          id: 'Container-1',
          type: 'Container',
          position: 0,
          styling: {
            __typename: 'PuckBlockStyling',
            color: null,
            margin: { __typename: 'PuckSides', top: null },
          },
          data: {},
        },
      ])
    ).toStrictEqual([{ id: 'Container-1', type: 'Container', data: {} }]);
  });

  it('leaves out the blocks it cannot reach from the top level', () => {
    expect(
      ids(
        fromFlatPuckBlocks([
          { id: 'Title-1', type: 'Title', position: 0, data: {} },
          {
            id: 'Title-2',
            type: 'Title',
            parentId: 'Container-9',
            position: 0,
            data: {},
          },
          {
            id: 'Container-3',
            type: 'Container',
            parentId: 'Container-3',
            position: 0,
            data: {},
          },
        ])
      )
    ).toEqual(['Title-1']);
  });

  it('places a block only once when ids repeat', () => {
    expect(
      fromFlatPuckBlocks([
        { id: 'Container-1', type: 'Container', position: 0, data: {} },
        {
          id: 'Container-1',
          type: 'Container',
          parentId: 'Container-1',
          position: 0,
          data: {},
        },
      ])
    ).toStrictEqual([{ id: 'Container-1', type: 'Container', data: {} }]);
  });
});

describe('apiBlocksSchema', () => {
  it('accepts the ids Puck generates', () => {
    expect(() =>
      apiBlocksSchema.parse([
        {
          id: 'Title-1b4e28ba-2fa1-41d2-883f-0016d3cca427',
          type: 'Title',
          data: {},
        },
      ])
    ).not.toThrow();
  });

  it('accepts slot paths', () => {
    expect(() =>
      apiBlocksSchema.parse([
        {
          id: 'Slider-1',
          type: 'Slider',
          data: { items: [] },
          children: [
            {
              id: 'Title-2',
              slot: 'items[12].content',
              type: 'Title',
              data: {},
            },
          ],
        },
      ])
    ).not.toThrow();
  });

  it.each(['', 'items[0]..content', 'items[a].content', '.content'])(
    'rejects the slot path "%s"',
    slot => {
      expect(() =>
        apiBlocksSchema.parse([
          { id: 'Title-1', slot, type: 'Title', data: {} },
        ])
      ).toThrow();
    }
  );
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

describe('the stored block format, mirrored by parsePuckBlocks', () => {
  it.each(storedBlockFormat.valid)('accepts %s', (_, blocks) => {
    expect(apiBlocksSchema.safeParse(blocks).error).toBeUndefined();
  });

  it.each(storedBlockFormat.invalid)('rejects %s', (_, blocks) => {
    expect(apiBlocksSchema.safeParse(blocks).success).toBe(false);
  });
});

describe('the values the website treats apart from the stored block format', () => {
  it.each([
    ['cleared timings', timed(null)],
    [
      'timings with every value cleared',
      timed({ from: null, to: null, weekdays: null, timeOfDay: null }),
    ],
    ['a cleared datasource', sourced({ article: null })],
  ])('accepts %s the editor writes and the API drops', (_, blocks) => {
    expect(apiBlocksSchema.safeParse(blocks).error).toBeUndefined();
  });

  it.each([
    ['a null lock', [storedBlock({ locked: null })]],
    ['a null visibility', [storedBlock({ visibility: null })]],
    ['a null disabled flag', [storedBlock({ visibility: { disabled: null } })]],
    ['null breakpoints', [storedBlock({ visibility: { breakpoints: null } })]],
    ['a start with an offset', timed({ from: '2026-11-01T10:00:00+01:00' })],
    ['null datasources', sourced(null)],
    [
      'cleared datasource data',
      sourced({ image: { type: 'multiple', ids: ['image-1'], data: null } }),
    ],
    ['a null styling', styled(null)],
    ['a null slot', slotted(null)],
    ['null children', [storedBlock({ children: null })]],
  ])('rejects %s the API would normalise', (_, blocks) => {
    expect(apiBlocksSchema.safeParse(blocks).success).toBe(false);
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
  const componentFields = Object.entries(getPuckConfig('page').components).map(
    ([name, config]): [string, FieldMap] => [
      name,
      (config.fields ?? {}) as unknown as FieldMap,
    ]
  );

  it.each(componentFields)(
    'has every slot of %s detected and restored',
    (name, fields) => {
      const content = asContent([
        { type: name, props: { id: `${name}-1`, ...samplePropsOf(fields) } },
      ]);
      const blocks = toApiBlocks(content);

      expect(
        (blocks[0].children ?? []).map(({ slot = 'content' }) => slot)
      ).toEqual(slotPathsOf(fields));
      expect(toPuckContent(blocks)).toEqual(content);
      expect(
        toPuckData('page', asJson(toFlatPuckBlocks(blocks))).content
      ).toEqual(content);
    }
  );

  const styledComponents = componentFields.filter(
    ([, fields]) => fields.styling?.type === 'styling'
  );

  it.each(styledComponents)(
    'lifts the styling of %s out of the data and restores it',
    (name, fields) => {
      const content = asContent([
        { type: name, props: { id: `${name}-1`, ...samplePropsOf(fields) } },
      ]);
      const [block] = toApiDocument('page', { root: {}, content }).blocks;

      expect(block.styling).toEqual(sampleStyling);
      expect(block.data).not.toHaveProperty('styling');
      expect(
        toPuckData('page', asJson(toFlatPuckBlocks([block]))).content
      ).toEqual(content);
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
      })
    );
  });
});
