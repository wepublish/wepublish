import { Config } from '@puckeditor/core';

import {
  acceptingZones,
  insertZones,
  slotZones,
  stopPointerDown,
} from './insert.helpers';

const config = {
  components: {
    Title: { label: 'Title', render: () => null },
    RichText: { render: () => null },
    Image: { label: 'Image', render: () => null },
    Container: {
      label: 'Container',
      fields: { content: { type: 'slot' } },
      render: () => null,
    },
    Slider: {
      fields: {
        items: {
          type: 'array',
          label: 'Slides',
          getItemSummary: (_item: unknown, index = 0) => `Slide ${index + 1}`,
          arrayFields: { content: { type: 'slot' } },
        },
      },
      render: () => null,
    },
    Grid: {
      fields: {
        main: { type: 'slot', label: 'Main', allow: ['Title'] },
        aside: { type: 'slot', disallow: ['Image'] },
      },
      render: () => null,
    },
  },
} as unknown as Config;

describe('slotZones', () => {
  it('has no zones for a block without slots', () => {
    expect(
      slotZones(config, { type: 'Title', props: { id: 'title-1' } })
    ).toEqual([]);
  });

  it('lists a slot with its current number of blocks', () => {
    expect(
      slotZones(config, {
        type: 'Container',
        props: { id: 'c1', content: [{ type: 'Title', props: { id: 't' } }] },
      })
    ).toEqual([{ zone: 'c1:content', label: 'content', count: 1 }]);
  });

  it('lists the slots of every array item', () => {
    expect(
      slotZones(config, {
        type: 'Slider',
        props: { id: 's1', items: [{ content: [] }, {}] },
      })
    ).toEqual([
      { zone: 's1:items[0].content', label: 'Slide 1', count: 0 },
      { zone: 's1:items[1].content', label: 'Slide 2', count: 0 },
    ]);
  });

  it('keeps allow and disallow of a slot', () => {
    expect(slotZones(config, { type: 'Grid', props: { id: 'g1' } })).toEqual([
      { zone: 'g1:main', label: 'Main', count: 0, allow: ['Title'] },
      { zone: 'g1:aside', label: 'aside', count: 0, disallow: ['Image'] },
    ]);
  });
});

describe('acceptingZones', () => {
  it('keeps the zones a component may be inserted into', () => {
    const zones = slotZones(config, { type: 'Grid', props: { id: 'g1' } });

    expect(acceptingZones(zones, 'Title').map(({ zone }) => zone)).toEqual([
      'g1:main',
      'g1:aside',
    ]);
    expect(acceptingZones(zones, 'Image')).toEqual([]);
    expect(acceptingZones(zones, 'RichText').map(({ zone }) => zone)).toEqual([
      'g1:aside',
    ]);
  });
});

describe('insertZones', () => {
  it('targets the document root when no block is selected', () => {
    expect(insertZones(config, null, { count: 3, label: 'Article' })).toEqual([
      { zone: 'root:default-zone', label: 'Article', count: 3 },
    ]);
  });

  it('targets the slots of the selected block', () => {
    expect(
      insertZones(
        config,
        { type: 'Container', props: { id: 'c1' } },
        { count: 3, label: 'Page' }
      )
    ).toEqual([{ zone: 'c1:content', label: 'content', count: 0 }]);
  });
});

describe('stopPointerDown', () => {
  it('keeps a pointerdown from reaching the draggable around it', () => {
    const draggable = document.createElement('div');
    const button = document.createElement('button');
    const onDragStart = vi.fn();

    draggable.append(button);
    draggable.addEventListener('pointerdown', onDragStart);
    stopPointerDown(button);

    button.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(onDragStart).not.toHaveBeenCalled();
  });
});
