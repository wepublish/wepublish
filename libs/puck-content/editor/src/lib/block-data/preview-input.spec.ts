import * as EditorApi from '@wepublish/editor/api';
import {
  PuckBlockKind,
  PuckBreakpoint,
  PuckDatasourceType,
  PuckListDatasourceType,
  PuckWeekday,
} from '@wepublish/website/api';

import { getPuckConfig } from '../config';
import { toPreviewInput, toPreviewVariables } from './preview-input';
import { PreviewSkeleton } from './preview-skeleton';

const skeleton: PreviewSkeleton = {
  puckBlocks: [
    {
      id: 'Grid-1',
      kind: EditorApi.PuckBlockKind.Puck,
      type: 'Grid',
      props: {},
      visibility: {
        disabled: true,
        breakpoints: [EditorApi.PuckBreakpoint.Md, EditorApi.PuckBreakpoint.Xl],
        timings: {
          from: '2026-11-01T08:00:00.000Z',
          weekdays: [EditorApi.PuckWeekday.Monday],
          timeOfDay: { from: '08:00', to: '18:00' },
        },
      },
      datasources: {
        article: { type: EditorApi.PuckDatasourceType.UniqueList },
        page: { type: EditorApi.PuckDatasourceType.Single, id: 'page-1' },
        image: {
          type: EditorApi.PuckDatasourceType.Multiple,
          ids: ['image-1', 'image-2'],
        },
        userSubscription: { type: EditorApi.PuckListDatasourceType.List },
      },
      children: [
        {
          id: 'Hero-2',
          kind: EditorApi.PuckBlockKind.Generated,
          type: 'Hero',
          props: {},
          puckSlot: 'items[0].content',
          datasources: {
            event: { type: EditorApi.PuckDatasourceType.Slot },
          },
        },
      ],
    },
  ],
  puckRegistry: { components: { Hero: { html: '' } } },
};

describe('toPreviewInput', () => {
  it('asks the API for the skeleton with the values of the website API', () => {
    expect(toPreviewInput(skeleton)).toStrictEqual({
      puckBlocks: [
        {
          id: 'Grid-1',
          kind: PuckBlockKind.Puck,
          type: 'Grid',
          props: {},
          visibility: {
            disabled: true,
            breakpoints: [PuckBreakpoint.Md, PuckBreakpoint.Xl],
            timings: {
              from: '2026-11-01T08:00:00.000Z',
              weekdays: [PuckWeekday.Monday],
              timeOfDay: { from: '08:00', to: '18:00' },
            },
          },
          datasources: {
            article: { type: PuckDatasourceType.UniqueList },
            page: { type: PuckDatasourceType.Single, id: 'page-1' },
            image: {
              type: PuckDatasourceType.Multiple,
              ids: ['image-1', 'image-2'],
            },
            userSubscription: { type: PuckListDatasourceType.List },
          },
          children: [
            {
              id: 'Hero-2',
              kind: PuckBlockKind.Generated,
              type: 'Hero',
              props: {},
              puckSlot: 'items[0].content',
              datasources: { event: { type: PuckDatasourceType.Slot } },
            },
          ],
        },
      ],
      puckRegistry: { components: { Hero: { html: '' } } },
    });
  });

  it('leaves out what the skeleton does not have', () => {
    expect(
      toPreviewInput({
        puckBlocks: [
          {
            id: 'Title-1',
            kind: EditorApi.PuckBlockKind.Puck,
            type: 'Title',
            props: {},
          },
        ],
        puckRegistry: null,
      })
    ).toStrictEqual({
      puckBlocks: [
        { id: 'Title-1', kind: PuckBlockKind.Puck, type: 'Title', props: {} },
      ],
      puckRegistry: null,
    });
  });

  it('asks for as many records as a block consumes from its own list', () => {
    expect(
      toPreviewInput({
        puckBlocks: [
          {
            id: 'Event-1',
            kind: EditorApi.PuckBlockKind.Puck,
            type: 'Event',
            props: {},
            consumes: 3,
            datasources: {
              event: { type: EditorApi.PuckDatasourceType.List },
            },
          },
        ],
        puckRegistry: null,
      }).puckBlocks
    ).toStrictEqual([
      {
        id: 'Event-1',
        kind: PuckBlockKind.Puck,
        type: 'Event',
        props: {},
        consumes: 3,
        datasources: { event: { type: PuckDatasourceType.List } },
      },
    ]);
  });
});

describe('toPreviewVariables', () => {
  const config = getPuckConfig('page');

  it('asks for the blocks of a document with datasources', () => {
    expect(
      toPreviewVariables(
        {
          root: { props: {} },
          content: [
            {
              type: 'Container',
              props: {
                id: 'Container-1',
                maxWidth: 'md',
                datasources: { page: { type: 'list' } },
              },
            },
          ],
        },
        config
      )
    ).toStrictEqual({
      puckBlocks: [
        {
          id: 'Container-1',
          kind: PuckBlockKind.Puck,
          type: 'Container',
          props: {},
          datasources: { page: { type: PuckDatasourceType.List } },
        },
      ],
      puckRegistry: null,
    });
  });

  it('asks nothing for a document without datasources', () => {
    expect(
      toPreviewVariables(
        {
          root: { props: {} },
          content: [{ type: 'Title', props: { id: 'Title-1', title: 'Hi' } }],
        },
        config
      )
    ).toBeNull();
  });
});
