import type { ApiBlock } from '@wepublish/puck-content/api';

import { displayedPuckBlocks, nextPuckBlocksTimingChange } from './puck-timing';

const ZURICH = 'Europe/Zurich';
const now = new Date('2026-01-05T09:00:00Z');

const block = (
  id: string,
  visibility?: unknown,
  children?: ApiBlock[]
): ApiBlock => ({
  id,
  type: 'Heading',
  data: {},
  ...(visibility === undefined ?
    {}
  : { visibility: visibility as ApiBlock['visibility'] }),
  ...(children ? { children } : {}),
});

const ids = (blocks: ApiBlock[]) => blocks.map(entry => entry.id);

describe('displayedPuckBlocks', () => {
  it('returns the same blocks when every block displays', () => {
    const blocks = [
      block('a'),
      block('b', { disabled: false, breakpoints: ['md'] }),
    ];

    expect(displayedPuckBlocks(blocks, now, ZURICH)).toBe(blocks);
  });

  it('drops disabled blocks', () => {
    expect(
      displayedPuckBlocks(
        [block('a'), block('b', { disabled: true })],
        now,
        ZURICH
      )
    ).toEqual([block('a')]);
  });

  it('drops blocks outside their timing, as stored in the database', () => {
    const blocks = JSON.parse(
      JSON.stringify([
        block('ended', { timings: { to: '2026-01-05T08:00:00Z' } }),
        block('running', {
          timings: {
            from: '2026-01-05T08:00:00Z',
            to: '2026-01-05T10:00:00Z',
          },
        }),
        block('upcoming', { timings: { from: '2026-01-06T00:00:00Z' } }),
        block('weekend', { timings: { weekdays: ['Saturday'] } }),
        block('morning', {
          timings: { timeOfDay: { from: '09:00', to: '11:00' } },
        }),
      ])
    );

    expect(ids(displayedPuckBlocks(blocks, now, ZURICH))).toEqual([
      'running',
      'morning',
    ]);
  });

  it('reads the weekdays by the names the editor stores', () => {
    const blocks = [
      block('monday', { timings: { weekdays: ['Monday'] } }),
      block('weekend', { timings: { weekdays: ['Saturday', 'Sunday'] } }),
    ];

    expect(ids(displayedPuckBlocks(blocks, now, ZURICH))).toEqual(['monday']);
  });

  it('drops blocks with an invalid timing', () => {
    const blocks = [
      block('a', { timings: { from: 'not a date' } }),
      block('b'),
    ];

    expect(ids(displayedPuckBlocks(blocks, now, ZURICH))).toEqual(['b']);
  });

  it('drops hidden children together with their own children', () => {
    const blocks = [
      block('grid', undefined, [
        block('a', undefined, [block('c', { disabled: true }), block('d')]),
        block('b', { disabled: true }, [block('e')]),
      ]),
    ];

    expect(displayedPuckBlocks(blocks, now, ZURICH)).toEqual([
      block('grid', undefined, [block('a', undefined, [block('d')])]),
    ]);
  });

  it('ignores breakpoints, the website hides those', () => {
    const blocks = [block('a', { breakpoints: [] })];

    expect(displayedPuckBlocks(blocks, now, ZURICH)).toBe(blocks);
  });
});

describe('nextPuckBlocksTimingChange', () => {
  it('is null while no block is timed', () => {
    expect(
      nextPuckBlocksTimingChange(
        [block('a'), block('b', { disabled: true })],
        now,
        ZURICH
      )
    ).toBeNull();
  });

  it('finds the next moment a block appears or disappears', () => {
    const blocks = [
      block('a', { timings: { to: '2026-01-05T12:00:00Z' } }),
      block('b', { timings: { from: '2026-01-05T10:00:00Z' } }),
    ];

    expect(nextPuckBlocksTimingChange(blocks, now, ZURICH)).toEqual(
      new Date('2026-01-05T10:00:00Z')
    );
  });

  it('finds the end of a weekday timing', () => {
    const blocks = [block('a', { timings: { weekdays: ['Monday'] } })];

    expect(nextPuckBlocksTimingChange(blocks, now, ZURICH)).toEqual(
      new Date('2026-01-05T23:00:00Z')
    );
  });

  it('finds timings of children', () => {
    const blocks = [
      block('grid', undefined, [
        block('a', { timings: { from: '2026-01-05T11:00:00Z' } }),
        block('b', undefined, [
          block('c', { timings: { from: '2026-01-05T10:30:00Z' } }),
        ]),
      ]),
    ];

    expect(nextPuckBlocksTimingChange(blocks, now, ZURICH)).toEqual(
      new Date('2026-01-05T10:30:00Z')
    );
  });

  it('ignores timings inside a disabled block', () => {
    const blocks = [
      block('grid', { disabled: true }, [
        block('a', { timings: { from: '2026-01-05T10:00:00Z' } }),
      ]),
    ];

    expect(nextPuckBlocksTimingChange(blocks, now, ZURICH)).toBeNull();
  });
});
