import { BadRequestException } from '@nestjs/common';
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
  EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
  EVENT_TAGS_MAX,
  EVENT_TAGS_MIN,
  EventSchedule,
  EventScheduleProblem,
  eventBlocksSchema,
  eventNameSchema,
  eventPrintDescriptionSchema,
  eventRatesSchema,
  eventScheduleProblems,
  eventTagIdsSchema,
  isWithinScheduleHorizon,
  lastSchedulableDay,
  ticketingUrlSchema,
  TICKETING_URL_SCHEMES,
} from '@wepublish/event/schedule';
import { ZodTypeAny } from 'zod';

const SCHEDULE_PROBLEM_MESSAGES: Record<EventScheduleProblem, string> = {
  MissingDateRange:
    'A continuous or weekly schedule needs both dateFrom and dateTo.',
  MissingDates: 'An explicit schedule needs at least one date.',
  DateToBeforeDateFrom: 'dateTo must not be before dateFrom.',
  InvalidOpeningTime: 'openingTime must be written as HH:MM.',
  MissingWeekDays: 'A weekly schedule needs at least one weekday.',
  InvalidWeekDays: 'weekDays must be distinct integers from 1 to 7.',
  BeyondScheduleHorizon: 'The last date must fall within the next two years.',
};

const describeProblems = (problems: EventScheduleProblem[], now: Date) =>
  problems
    .map(problem =>
      problem === 'BeyondScheduleHorizon' ?
        `${problem}: The last date must fall on or before ${formatDay(now)}.`
      : `${problem}: ${SCHEDULE_PROBLEM_MESSAGES[problem]}`
    )
    .join(' ');

const formatDay = (now: Date) => {
  const { year, month, day } = lastSchedulableDay(now);

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const assertValidSchedule = (schedule: EventSchedule, now: Date) => {
  const problems = eventScheduleProblems(schedule, now);

  if (problems.length) {
    throw new BadRequestException(describeProblems(problems, now));
  }
};

export const assertWithinHorizon = (schedule: EventSchedule, now: Date) => {
  if (!isWithinScheduleHorizon(schedule, now)) {
    throw new BadRequestException(
      describeProblems(['BeyondScheduleHorizon'], now)
    );
  }
};

const assertMatches = (schema: ZodTypeAny, value: unknown, message: string) => {
  if (!schema.safeParse(value).success) {
    throw new BadRequestException(message);
  }
};

export type EventFacts = {
  tagIds?: string[] | null;
  ticketingUrl?: string | null;
  rates?: { price: string; designation?: string | null }[] | null;
};

export const assertValidFacts = ({
  tagIds,
  ticketingUrl,
  rates,
}: EventFacts) => {
  if (tagIds !== undefined && tagIds !== null) {
    assertMatches(
      eventTagIdsSchema,
      tagIds,
      `An event needs between ${EVENT_TAGS_MIN} and ${EVENT_TAGS_MAX} distinct tags.`
    );
  }

  assertMatches(
    ticketingUrlSchema,
    ticketingUrl,
    `ticketingUrl must start with ${TICKETING_URL_SCHEMES.join(', ')}.`
  );

  if (rates) {
    assertMatches(eventRatesSchema, rates, 'Every rate needs a price.');
  }
};

export type EventContent = {
  name: string;
  printDescription?: string | null;
  blocks: unknown[];
  images?: { imageId: string; isMain?: boolean | null }[] | null;
};

export const assertValidContent = ({
  name,
  printDescription,
  blocks,
  images,
}: EventContent) => {
  assertMatches(
    eventNameSchema,
    name,
    `name must be between 1 and ${EVENT_NAME_MAX_LENGTH} characters.`
  );
  assertMatches(
    eventPrintDescriptionSchema,
    printDescription,
    `printDescription must be at most ${EVENT_PRINT_DESCRIPTION_MAX_LENGTH} characters.`
  );
  assertMatches(
    eventBlocksSchema,
    blocks,
    `The description must be at most ${EVENT_DESCRIPTION_MAX_LENGTH} characters of text.`
  );

  const imageIds = (images ?? []).map(({ imageId }) => imageId);

  if (new Set(imageIds).size !== imageIds.length) {
    throw new BadRequestException('An image can only be added once.');
  }

  if ((images ?? []).filter(({ isMain }) => isMain).length > 1) {
    throw new BadRequestException('Only one image can be the main image.');
  }
};
