import { Config } from '@puckeditor/core';

import {
  acceptingZones,
  collectBlockIds,
  initialSelectionMemory,
  insertZones,
  nextSelectionMemory,
  slotZones,
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
  it('targets the page root when no block is selected', () => {
    expect(insertZones(config, null, 3)).toEqual([
      { zone: 'root:default-zone', label: 'Page', count: 3 },
    ]);
  });

  it('targets the slots of the selected block', () => {
    expect(
      insertZones(config, { type: 'Container', props: { id: 'c1' } }, 3)
    ).toEqual([{ zone: 'c1:content', label: 'content', count: 0 }]);
  });
});

describe('collectBlockIds', () => {
  it('collects the ids of all nested blocks', () => {
    expect(
      collectBlockIds([
        {
          type: 'Container',
          props: {
            id: 'c1',
            content: [{ type: 'Title', props: { id: 't1' } }],
          },
        },
        {
          type: 'Slider',
          props: {
            id: 's1',
            items: [{ content: [{ type: 'Image', props: { id: 'i1' } }] }],
          },
        },
      ])
    ).toEqual(new Set(['c1', 't1', 's1', 'i1']));
  });
});

describe('nextSelectionMemory', () => {
  const step = (
    memory: ReturnType<typeof initialSelectionMemory>,
    selectedId: string | null,
    ids: string[],
    isDragging = false
  ) =>
    nextSelectionMemory(memory, {
      selectedId,
      ids: new Set(ids),
      isDragging,
    });

  it('restores the selection from before a drag when the dropped block gets selected', () => {
    let result = step(initialSelectionMemory(), 'c1', ['c1']);
    expect(result.restore).toBeUndefined();

    result = step(result.memory, null, ['c1'], true);
    result = step(result.memory, null, ['c1', 'new'], true);
    result = step(result.memory, 'new', ['c1', 'new']);

    expect(result.restore).toEqual({ id: 'c1' });
  });

  it('restores the root when nothing was selected before the drag', () => {
    let result = step(initialSelectionMemory(), null, ['c1']);
    result = step(result.memory, null, ['c1'], true);
    result = step(result.memory, null, ['c1', 'new']);
    result = step(result.memory, 'new', ['c1', 'new']);

    expect(result.restore).toEqual({ id: null });
  });

  it('keeps the selection of a moved block', () => {
    let result = step(initialSelectionMemory(), 'c1', ['c1', 't1']);
    result = step(result.memory, null, ['c1', 't1'], true);
    result = step(result.memory, 't1', ['c1', 't1']);

    expect(result.restore).toBeUndefined();
  });

  it('keeps a duplicated block selected', () => {
    let result = step(initialSelectionMemory(), 'c1', ['c1']);
    result = step(result.memory, 'copy', ['c1', 'copy']);

    expect(result.restore).toBeUndefined();
  });

  it('lets the user select the inserted block afterwards', () => {
    let result = step(initialSelectionMemory(), 'c1', ['c1']);
    result = step(result.memory, null, ['c1'], true);
    result = step(result.memory, 'new', ['c1', 'new']);
    result = step(result.memory, 'c1', ['c1', 'new']);
    result = step(result.memory, 'new', ['c1', 'new']);

    expect(result.restore).toBeUndefined();
  });
});
