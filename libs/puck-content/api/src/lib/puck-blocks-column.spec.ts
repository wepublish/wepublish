import { Prisma } from '@prisma/client';

import { puckBlocksColumn } from './puck-blocks-column';
import { PuckBlocksError } from './puck-blocks';

describe('puckBlocksColumn', () => {
  it.each([undefined, null])('stores %s as a database null', value => {
    expect(puckBlocksColumn(value)).toBe(Prisma.DbNull);
  });

  it('stores valid blocks as they are', () => {
    const blocks = [{ id: 'heading-1', type: 'Heading', data: {} }];

    expect(puckBlocksColumn(blocks)).toEqual(blocks);
  });

  it('stores the blocks as parsed, with timings as ISO strings', () => {
    expect(
      puckBlocksColumn([
        {
          id: 'heading-1',
          type: 'Heading',
          data: {},
          locked: null,
          visibility: { timings: { from: new Date('2026-01-05T08:00:00Z') } },
        },
      ])
    ).toEqual([
      {
        id: 'heading-1',
        type: 'Heading',
        data: {},
        visibility: { timings: { from: '2026-01-05T08:00:00.000Z' } },
      },
    ]);
  });

  it('stores an empty list', () => {
    expect(puckBlocksColumn([])).toEqual([]);
  });

  it('refuses invalid blocks', () => {
    expect(() => puckBlocksColumn({ root: {}, content: [] })).toThrow(
      PuckBlocksError
    );
  });
});
