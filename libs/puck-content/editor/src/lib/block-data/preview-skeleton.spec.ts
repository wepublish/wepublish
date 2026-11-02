import { ComponentData, Data } from '@puckeditor/core';
import {
  PuckBlockKind,
  PuckDatasourceType,
  PuckWeekday,
  Weekday,
} from '@wepublish/editor/api';

import { getPuckConfig } from '../config';
import { DerivedDatasources } from '../document/puck-blocks';
import { hasPreviewDatasources, toPreviewSkeleton } from './preview-skeleton';

const config = getPuckConfig('page');

const puckComponent = (
  type: string,
  n: number,
  props: Record<string, unknown> = {}
): ComponentData => ({ type, props: { id: `${type}-${n}`, ...props } });

const document = (
  content: ComponentData[],
  rootProps: Record<string, unknown> = {}
): Data => ({ root: { props: rootProps }, content });

const derivedDatasources: DerivedDatasources = {
  Lightbox: props => ({
    image: {
      type: 'multiple',
      ids: (props.images as { imageId: string }[]).map(
        ({ imageId }) => imageId
      ),
    },
  }),
};

const grid = (titles: string[]) =>
  document([
    puckComponent('Grid', 1, {
      layout: { xs: { columns: [6, 6] } },
      styling: { xs: { color: 'primary.main' } },
      locked: true,
      datasources: { article: { type: 'uniqueList' } },
      content: titles.map((title, index) =>
        puckComponent('Container', index + 2, {
          datasources: { article: { type: 'slot' } },
          content: [puckComponent('TeaserTitle', index + 10, { title })],
        })
      ),
    }),
  ]);

describe('toPreviewSkeleton', () => {
  it('keeps the tree and the datasources of the blocks without their props', () => {
    expect(toPreviewSkeleton(grid(['First']), config)).toStrictEqual({
      puckBlocks: [
        {
          id: 'Grid-1',
          kind: PuckBlockKind.Puck,
          type: 'Grid',
          props: {},
          datasources: { article: { type: PuckDatasourceType.UniqueList } },
          children: [
            {
              id: 'Container-2',
              kind: PuckBlockKind.Puck,
              type: 'Container',
              props: {},
              datasources: { article: { type: PuckDatasourceType.Slot } },
              children: [
                {
                  id: 'TeaserTitle-10',
                  kind: PuckBlockKind.Puck,
                  type: 'TeaserTitle',
                  props: {},
                },
              ],
            },
          ],
        },
      ],
      puckRegistry: null,
    });
  });

  it('is the same for documents that differ in their props only', () => {
    expect(toPreviewSkeleton(grid(['First']), config)).toEqual(
      toPreviewSkeleton(grid(['Changed']), config)
    );
  });

  it('keeps the slot of every block', () => {
    const [slider] = toPreviewSkeleton(
      document([
        puckComponent('Slider', 1, {
          items: [
            { content: [puckComponent('Image', 2)] },
            { content: [puckComponent('Image', 3)] },
          ],
        }),
      ]),
      config
    ).puckBlocks;

    expect(slider.children?.map(({ puckSlot }) => puckSlot)).toEqual([
      'items[0].content',
      'items[1].content',
    ]);
  });

  it('carries the datasources derived from the props', () => {
    const skeletonOf = (imageIds: string[]) =>
      toPreviewSkeleton(
        document([
          puckComponent('Lightbox', 1, {
            images: imageIds.map(imageId => ({ imageId })),
          }),
        ]),
        config,
        derivedDatasources
      );

    expect(skeletonOf(['image-1']).puckBlocks[0].datasources).toEqual({
      image: { type: PuckDatasourceType.Multiple, ids: ['image-1'] },
    });
    expect(skeletonOf(['image-1'])).not.toEqual(
      skeletonOf(['image-1', 'image-2'])
    );
  });

  it('carries how many records a block consumes from its own list', () => {
    const skeletonOf = (count: number) =>
      toPreviewSkeleton(
        document([
          puckComponent('Event', 1, {
            count,
            datasources: { event: { type: 'list' } },
          }),
        ]),
        config
      );

    expect(skeletonOf(3).puckBlocks).toStrictEqual([
      {
        id: 'Event-1',
        kind: PuckBlockKind.Puck,
        type: 'Event',
        props: {},
        consumes: 3,
        datasources: { event: { type: PuckDatasourceType.List } },
      },
    ]);
    expect(skeletonOf(3)).not.toEqual(skeletonOf(4));
  });

  it('keeps the timings the API accepts', () => {
    const [title] = toPreviewSkeleton(
      document([
        puckComponent('Title', 1, {
          visibility: {
            disabled: true,
            timings: {
              from: '2026-11-01T08:00:00.000Z',
              to: '2026-11-30T08:00:00.000Z',
              weekdays: [Weekday.Monday],
              timeOfDay: { from: '08:00', to: '18:00' },
            },
          },
        }),
      ]),
      config
    ).puckBlocks;

    expect(title.visibility).toEqual({
      disabled: true,
      timings: {
        from: '2026-11-01T08:00:00.000Z',
        to: '2026-11-30T08:00:00.000Z',
        weekdays: [PuckWeekday.Monday],
        timeOfDay: { from: '08:00', to: '18:00' },
      },
    });
  });

  it.each([
    [
      'that end before they start',
      { from: '2026-11-30T08:00:00.000Z', to: '2026-11-01T08:00:00.000Z' },
    ],
    [
      'that end when they start',
      { from: '2026-11-01T08:00:00.000Z', to: '2026-11-01T08:00:00.000Z' },
    ],
    ['without a time zone', { from: '2026-11-01T08:00:00' }],
    ['that are no date', { to: 'tomorrow' }],
    [
      'with a half typed time of day',
      { timeOfDay: { from: '8:', to: '18:00' } },
    ],
  ])('drops timings %s instead of failing the whole preview', (_, timings) => {
    const [title] = toPreviewSkeleton(
      document([
        puckComponent('Title', 1, { visibility: { disabled: true, timings } }),
      ]),
      config
    ).puckBlocks;

    expect(title.visibility).toStrictEqual({ disabled: true });
  });

  it('drops a top level block it cannot send and keeps the others', () => {
    expect(
      toPreviewSkeleton(
        document([
          puckComponent('Title', 1, {
            visibility: { timings: { weekdays: ['Funday'] } },
          }),
          puckComponent('Title', 2),
        ]),
        config
      ).puckBlocks.map(({ id }) => id)
    ).toEqual(['Title-2']);
  });

  it('names the generated components it uses so the API accepts them', () => {
    expect(
      toPreviewSkeleton(
        document([puckComponent('Hero', 1, { title: 'Hi' })], {
          _dynamicConfig: {
            components: {
              Hero: { html: '<section>…</section>', script: 'alert(1)' },
              Unused: { html: '<p/>' },
            },
            styles: '.hero {}',
          },
        }),
        config
      )
    ).toEqual({
      puckBlocks: [
        {
          id: 'Hero-1',
          kind: PuckBlockKind.Generated,
          type: 'Hero',
          props: {},
        },
      ],
      puckRegistry: { components: { Hero: { html: '' } } },
    });
  });
});

describe('linked block templates in the preview', () => {
  const linkedDocument = document([
    puckComponent('LinkedTemplate', 1, {
      templateId: 'tpl',
      styling: { xs: { color: 'primary.main' } },
    }),
  ]);

  it('keeps the template id, as the API resolves the template from it', () => {
    expect(toPreviewSkeleton(linkedDocument, config).puckBlocks).toEqual([
      expect.objectContaining({
        type: 'LinkedTemplate',
        props: { templateId: 'tpl' },
      }),
    ]);
  });

  it('asks for a preview even when nothing in the document has a datasource', () => {
    expect(
      hasPreviewDatasources(toPreviewSkeleton(linkedDocument, config))
    ).toBe(true);
  });

  it('asks for a linked block nested in a slot', () => {
    expect(
      hasPreviewDatasources(
        toPreviewSkeleton(
          document([
            puckComponent('Container', 1, {
              content: [
                puckComponent('LinkedTemplate', 2, { templateId: 'tpl' }),
              ],
            }),
          ]),
          config
        )
      )
    ).toBe(true);
  });
});

describe('hasPreviewDatasources', () => {
  it('is true when a block anywhere in the tree has a datasource', () => {
    expect(
      hasPreviewDatasources(toPreviewSkeleton(grid(['First']), config))
    ).toBe(true);
  });

  it('is false when no block has a datasource', () => {
    expect(
      hasPreviewDatasources(
        toPreviewSkeleton(
          document([
            puckComponent('Container', 1, {
              content: [puckComponent('Title', 2, { datasources: {} })],
            }),
          ]),
          config
        )
      )
    ).toBe(false);
  });

  it('is false for an empty document', () => {
    expect(hasPreviewDatasources(toPreviewSkeleton(document([]), config))).toBe(
      false
    );
  });
});
