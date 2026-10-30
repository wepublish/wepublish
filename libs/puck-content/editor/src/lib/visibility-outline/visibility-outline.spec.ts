import {
  collectBlockVisibility,
  outlineBadges,
  outlineVisibilityCss,
} from './visibility-outline.helpers';

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

describe('outlineBadges', () => {
  it('lists the restrictions and the visible breakpoints in theme order', () => {
    expect(
      outlineBadges({
        disabled: true,
        timings: { from: '2026-01-01T00:00:00.000Z' },
        breakpoints: ['lg', 'md'],
      })
    ).toEqual({ disabled: true, timed: true, breakpoints: ['MD', 'LG'] });
  });

  it('shows no breakpoints when the block is visible everywhere', () => {
    expect(outlineBadges({ disabled: false }).breakpoints).toEqual([]);
  });
});

describe('outlineVisibilityCss', () => {
  it('dims the outline entry of a disabled block', () => {
    const css = outlineVisibilityCss([
      { id: 'title', value: { disabled: true } },
      { id: 'image', value: { breakpoints: ['xs'] } },
    ]);

    expect(css).toContain('[data-puck-layer-tree-id="title"]');
    expect(css).toContain('opacity');
    expect(css).not.toContain('"image"');
  });
});
