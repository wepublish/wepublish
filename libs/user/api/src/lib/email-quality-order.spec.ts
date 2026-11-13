import { EmailQualityLevel } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';
import {
  emailQualitySinceSlices,
  emailQualitySlices,
  findAcrossSlices,
  OrderedSlice,
} from './email-quality-order';

type Row = { id: string; slice: number };

/** Slices of the given sizes, each finding rows `<slice>-<index>`. */
const fakeSlices = (sizes: number[]) => {
  const slices: OrderedSlice[] = sizes.map((_, index) => ({
    where: { id: { startsWith: `${index}-` } },
    orderBy: [{ id: 'asc' }],
  }));
  const count = vi.fn(async ({ AND: [, slice] }: any) =>
    Number(sizes[Number(slice.id.startsWith[0])])
  );
  const find = vi.fn(
    async ({
      where: {
        AND: [, slice],
      },
      skip,
      take,
    }: any): Promise<Row[]> => {
      const index = Number(slice.id.startsWith[0]);

      return Array.from({ length: sizes[index] }, (_, i) => ({
        id: `${index}-${i}`,
        slice: index,
      })).slice(skip, skip + take);
    }
  );

  return { slices, count, find };
};

describe('findAcrossSlices', () => {
  it('cuts a page across slice boundaries in slice order', async () => {
    const { slices, count, find } = fakeSlices([2, 3, 4]);

    const { nodes, totalCount } = await findAcrossSlices(
      {},
      slices,
      { skip: 1, take: 5 },
      count,
      find
    );

    expect(totalCount).toBe(9);
    expect(nodes.map(({ id }) => id)).toEqual([
      '0-1',
      '1-0',
      '1-1',
      '1-2',
      '2-0',
    ]);
  });

  it('skips whole slices and leaves empty ones alone', async () => {
    const { slices, count, find } = fakeSlices([2, 0, 4]);

    const { nodes } = await findAcrossSlices(
      {},
      slices,
      { skip: 3, take: 10 },
      count,
      find
    );

    expect(nodes.map(({ id }) => id)).toEqual(['2-1', '2-2', '2-3']);
    // only the slice that holds rows of the page is queried
    expect(find).toHaveBeenCalledTimes(1);
  });

  it('combines the list filter with each slice', async () => {
    const { slices, count, find } = fakeSlices([1]);
    const where = { roleIDs: { hasSome: ['editor'] } };

    await findAcrossSlices(where, slices, { skip: 0, take: 1 }, count, find);

    expect(count).toHaveBeenCalledWith({ AND: [where, slices[0].where] });
    expect(find).toHaveBeenCalledWith({
      where: { AND: [where, slices[0].where] },
      orderBy: slices[0].orderBy,
      skip: 0,
      take: 1,
    });
  });
});

describe('emailQualitySlices', () => {
  const levelsOf = (slices: OrderedSlice[]) =>
    slices.map(({ where }) => JSON.stringify(where));

  it('orders best to worst, with people never evaluated among unknown', () => {
    const slices = emailQualitySlices(SortOrder.Ascending);

    expect(slices.map(({ where }) => where)).toEqual([
      { emailQuality: { is: { level: EmailQualityLevel.active } } },
      {
        OR: [
          { emailQuality: { is: { level: EmailQualityLevel.unknown } } },
          { emailQuality: { is: null } },
        ],
      },
      { emailQuality: { is: { level: EmailQualityLevel.unresponsive } } },
      { emailQuality: { is: { level: EmailQualityLevel.dead } } },
    ]);
    slices.forEach(({ orderBy }) => expect(orderBy).toEqual([{ id: 'asc' }]));
  });

  it('orders worst to best when descending', () => {
    expect(levelsOf(emailQualitySlices(SortOrder.Descending))).toEqual(
      levelsOf(emailQualitySlices(SortOrder.Ascending)).reverse()
    );
    emailQualitySlices(SortOrder.Descending).forEach(({ orderBy }) =>
      expect(orderBy).toEqual([{ id: 'desc' }])
    );
  });
});

describe('emailQualitySinceSlices', () => {
  it.each([
    [SortOrder.Ascending, 'asc'],
    [SortOrder.Descending, 'desc'],
  ] as const)(
    'puts people without a level last when %s',
    (order, direction) => {
      expect(emailQualitySinceSlices(order)).toEqual([
        {
          where: { emailQuality: { isNot: null } },
          orderBy: [{ emailQuality: { since: direction } }, { id: direction }],
        },
        {
          where: { emailQuality: { is: null } },
          orderBy: [{ id: direction }],
        },
      ]);
    }
  );
});
