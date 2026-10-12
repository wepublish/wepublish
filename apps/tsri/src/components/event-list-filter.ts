import { z } from 'zod';

export const DATE_RANGES = ['today', 'tomorrow', 'next7', 'next30'] as const;
export type DateRange = (typeof DATE_RANGES)[number];
export type ActiveEventFilter = DateRange | 'upcoming' | 'all' | null;

const DAY_OFFSETS: Record<DateRange, { from: number; to: number }> = {
  today: { from: 0, to: 0 },
  tomorrow: { from: 1, to: 1 },
  next7: { from: 0, to: 6 },
  next30: { from: 0, to: 29 },
};

export const eventListPageSchema = z.object({
  page: z.coerce.number().gte(1).optional(),
  upcomingOnly: z
    .string()
    .toLowerCase()
    .transform(string => JSON.parse(string))
    .pipe(z.boolean())
    .optional()
    .default('true'),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export function getDateBounds(range: DateRange): { from: string; to: string } {
  const { from, to } = DAY_OFFSETS[range];
  const fromDate = new Date();
  fromDate.setHours(0, 0, 0, 0);
  fromDate.setDate(fromDate.getDate() + from);
  const toDate = new Date();
  toDate.setHours(23, 59, 59, 999);
  toDate.setDate(toDate.getDate() + to);

  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

export function detectActiveEventFilter(params: {
  from?: Date;
  to?: Date;
  upcomingOnly?: boolean;
}): ActiveEventFilter {
  if (params.from && params.to) {
    const fromIso = params.from.toISOString();
    const toIso = params.to.toISOString();

    for (const range of DATE_RANGES) {
      const bounds = getDateBounds(range);

      if (bounds.from === fromIso && bounds.to === toIso) {
        return range;
      }
    }

    return null;
  }

  if (params.upcomingOnly === false) {
    return 'all';
  }

  return 'upcoming';
}

export function getEventListFilter(params: {
  from?: Date;
  to?: Date;
  upcomingOnly?: boolean;
}): { from?: string; to?: string; upcomingOnly?: boolean } {
  if (params.from && params.to) {
    return { from: params.from.toISOString(), to: params.to.toISOString() };
  }

  if (params.upcomingOnly === false) {
    return {};
  }

  return { upcomingOnly: true };
}
