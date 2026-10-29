import { Weekday } from '@wepublish/editor/api';

import {
  blockVisibilityFlags,
  blockVisibilitySchema,
  collectBlockVisibility,
  outlineVisibilityCss,
} from './block-visibility.field';

const labels = { disabled: 'Disabled', timed: 'Timed' };

describe('blockVisibilitySchema', () => {
  it('accepts the disabled flag, a timing window and breakpoints', () => {
    expect(
      blockVisibilitySchema.safeParse({
        disabled: true,
        timings: {
          from: '2026-01-01T00:00:00.000Z',
          weekdays: [Weekday.Monday],
          timeOfDay: { from: '08:00', to: '12:00' },
        },
        breakpoints: ['md', 'lg'],
      }).success
    ).toBe(true);
  });

  it('rejects malformed times of day', () => {
    expect(
      blockVisibilitySchema.safeParse({
        timings: { timeOfDay: { from: '8 am', to: '12:00' } },
      }).success
    ).toBe(false);
  });
});

describe('blockVisibilityFlags', () => {
  it('reports what restricts a block', () => {
    expect(blockVisibilityFlags(undefined)).toEqual({
      disabled: false,
      timed: false,
      breakpoints: undefined,
    });
    expect(
      blockVisibilityFlags({
        disabled: true,
        timings: { weekdays: [Weekday.Friday] },
        breakpoints: ['xs'],
      })
    ).toEqual({ disabled: true, timed: true, breakpoints: ['xs'] });
  });

  it('ignores an empty timing window', () => {
    expect(blockVisibilityFlags({ timings: { weekdays: [] } }).timed).toBe(
      false
    );
  });
});

describe('collectBlockVisibility', () => {
  it('finds restricted blocks in slots and array items', () => {
    expect(
      collectBlockVisibility([
        {
          type: 'Container',
          props: {
            id: 'container',
            content: [
              {
                type: 'Title',
                props: { id: 'title', visibility: { disabled: true } },
              },
            ],
          },
        },
        {
          type: 'Slider',
          props: {
            id: 'slider',
            visibility: {},
            items: [
              {
                content: [
                  {
                    type: 'Image',
                    props: { id: 'image', visibility: { breakpoints: ['md'] } },
                  },
                ],
              },
            ],
          },
        },
      ])
    ).toEqual([
      { id: 'title', value: { disabled: true } },
      { id: 'image', value: { breakpoints: ['md'] } },
    ]);
  });
});

describe('outlineVisibilityCss', () => {
  it('labels and dims the outline entry of a restricted block', () => {
    const css = outlineVisibilityCss(
      [
        {
          id: 'title',
          value: {
            disabled: true,
            timings: { from: '2026-01-01T00:00:00.000Z' },
            breakpoints: ['md', 'lg'],
          },
        },
      ],
      labels
    );

    expect(css).toContain('[data-puck-layer-tree-id="title"]');
    expect(css).toContain('content: "Disabled · Timed · MD LG"');
    expect(css).toContain('opacity');
  });

  it('only labels blocks that are still enabled', () => {
    const css = outlineVisibilityCss(
      [{ id: 'title', value: { breakpoints: ['xs'] } }],
      labels
    );

    expect(css).toContain('content: "XS"');
    expect(css).not.toContain('opacity');
  });
});
