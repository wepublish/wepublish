import { FlexEntry, groupShortNewsRuns } from './short-news-runs';

const teaserSlots = (blockStyle: string | null) =>
  ({
    alignment: { x: 0, y: 0, w: 12, h: 2 },
    block: { __typename: 'TeaserSlotsBlock', blockStyle },
  }) as unknown as FlexEntry;

const otherBlock = () =>
  ({
    alignment: { x: 0, y: 0, w: 12, h: 2 },
    block: { __typename: 'ImageBlock' },
  }) as unknown as FlexEntry;

const xl = () => teaserSlots('T_XLFullsizeImage');
const shortNews = () => teaserSlots('CompactNews');

describe('groupShortNewsRuns', () => {
  it('merges a consecutive mix of xl and short-news blocks', () => {
    const runs = groupShortNewsRuns([shortNews(), xl()]);

    expect(runs).toHaveLength(1);
    expect(runs[0].merged).toBe(true);
    expect(runs[0].entries).toHaveLength(2);
  });

  it('keeps surrounding blocks out of the merged run', () => {
    const runs = groupShortNewsRuns([
      otherBlock(),
      xl(),
      shortNews(),
      teaserSlots('T_NoImageAltColor'),
    ]);

    expect(runs.map(run => run.merged)).toEqual([false, true, false]);
    expect(runs[1].entries).toHaveLength(2);
  });

  it('does not merge runs of a single type', () => {
    expect(groupShortNewsRuns([xl(), xl()])[0].merged).toBe(false);
    expect(groupShortNewsRuns([shortNews()])[0].merged).toBe(false);
  });

  it('does not merge when another block interrupts the run', () => {
    const runs = groupShortNewsRuns([xl(), otherBlock(), shortNews()]);

    expect(runs.every(run => !run.merged)).toBe(true);
  });

  it('merges longer mixed runs into one grid', () => {
    const runs = groupShortNewsRuns([xl(), shortNews(), xl()]);

    expect(runs).toHaveLength(1);
    expect(runs[0].merged).toBe(true);
    expect(runs[0].entries).toHaveLength(3);
  });
});
