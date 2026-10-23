import { z } from 'zod';
import { blocksTextLength, characterCount } from './blocks-plain-text';
import { EventSchedule } from './event-schedule';
import { ScheduleInputError, validateScheduleInput } from './schedule-input';

export const EVENT_NAME_MAX_LENGTH = 130;
export const EVENT_PRINT_DESCRIPTION_MAX_LENGTH = 256;
export const EVENT_DESCRIPTION_MAX_LENGTH = 6400;
export const EVENT_TAGS_MIN = 1;
export const EVENT_TAGS_MAX = 3;
export const TICKETING_URL_SCHEMES = [
  'http',
  'https',
  'mailto',
  'tel',
] as const;

const OPENING_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const atMostCharacters = (limit: number) => (value: string) =>
  characterCount(value) <= limit;

const tooLong = (limit: number) => ({
  message: `Must be at most ${limit} characters`,
});

export const isOpeningTime = (value: string): boolean =>
  OPENING_TIME_PATTERN.test(value);

const hasTicketingScheme = (value: string) => {
  try {
    const scheme = new URL(value).protocol.slice(0, -1);

    return (TICKETING_URL_SCHEMES as readonly string[]).includes(scheme);
  } catch {
    return false;
  }
};

export const eventNameSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    atMostCharacters(EVENT_NAME_MAX_LENGTH),
    tooLong(EVENT_NAME_MAX_LENGTH)
  );

export const eventPrintDescriptionSchema = z
  .string()
  .refine(
    atMostCharacters(EVENT_PRINT_DESCRIPTION_MAX_LENGTH),
    tooLong(EVENT_PRINT_DESCRIPTION_MAX_LENGTH)
  )
  .nullish();

export const eventBlocksSchema = z
  .array(z.unknown())
  .refine(
    blocks => blocksTextLength(blocks) <= EVENT_DESCRIPTION_MAX_LENGTH,
    tooLong(EVENT_DESCRIPTION_MAX_LENGTH)
  );

export const eventTagIdsSchema = z
  .array(z.string())
  .min(EVENT_TAGS_MIN)
  .max(EVENT_TAGS_MAX)
  .refine(tagIds => new Set(tagIds).size === tagIds.length, {
    message: 'Tags must be distinct',
  });

export const ticketingUrlSchema = z
  .string()
  .refine(hasTicketingScheme, {
    message: `Must start with ${TICKETING_URL_SCHEMES.join(', ')}`,
  })
  .nullish();

export const openingTimeSchema = z
  .string()
  .regex(OPENING_TIME_PATTERN, { message: 'Must be HH:MM' })
  .nullish();

export const eventRateSchema = z.object({
  price: z.string().trim().min(1),
  designation: z.string().nullish(),
});

export const eventRatesSchema = z.array(eventRateSchema);

export const eventContentInputSchema = z.object({
  name: eventNameSchema,
  printDescription: eventPrintDescriptionSchema,
  blocks: eventBlocksSchema,
});

export type EventScheduleProblem =
  | 'MissingDateRange'
  | 'MissingDates'
  | 'DateToBeforeDateFrom'
  | 'InvalidOpeningTime'
  | ScheduleInputError;

type Span = { dateFrom: Date | null; dateTo: Date | null };

const isInverted = ({ dateFrom, dateTo }: Span) =>
  !!dateFrom && !!dateTo && dateTo.getTime() < dateFrom.getTime();

const isMalformedOpeningTime = (openingTime: string | null) =>
  openingTime !== null && !isOpeningTime(openingTime);

export const eventScheduleProblems = (
  schedule: EventSchedule,
  now: Date
): EventScheduleProblem[] => {
  const explicit = schedule.scheduleType === 'Explicit';
  const spans = [schedule, ...schedule.dates];

  return [
    ...(!explicit && (!schedule.dateFrom || !schedule.dateTo) ?
      ['MissingDateRange' as const]
    : []),
    ...(explicit && schedule.dates.length === 0 ?
      ['MissingDates' as const]
    : []),
    ...(spans.some(isInverted) ? ['DateToBeforeDateFrom' as const] : []),
    ...(spans.some(({ openingTime }) => isMalformedOpeningTime(openingTime)) ?
      ['InvalidOpeningTime' as const]
    : []),
    ...validateScheduleInput(schedule, now),
  ];
};
