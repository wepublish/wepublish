import {
  EditorBlockType,
  EventScheduleType,
  EventSpecialRate,
  EventStatus,
} from '@wepublish/editor/api';
import {
  blocksTextLength,
  characterCount,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
  EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
  EVENT_TAGS_MAX,
  EVENT_TAGS_MIN,
  eventNameSchema,
  eventPrintDescriptionSchema,
  eventRateSchema,
  eventScheduleProblems,
  eventTagIdsSchema,
  isEventBlockType,
  TICKETING_URL_SCHEMES,
  ticketingUrlSchema,
} from '@wepublish/event/schedule';
import { z } from 'zod';

import { eventBlockApiType, EventBlockValue } from './event-block-map';
import { SchedulePreviewProblem } from './schedule/occurrence-preview';
import { emptyScheduleForm, scheduleFromForm } from './schedule/schedule-form';
import {
  scheduleProblemKey,
  scheduleProblemPath,
} from './schedule/schedule-problems';

export const EVENT_IMAGE_CAPTION_MAX_LENGTH = 125;
export const EVENT_IMAGE_ALT_TEXT_MAX_LENGTH = 125;

export type EventImageRef = {
  id: string;
  thumbURL?: string | null;
  squareURL?: string | null;
  title?: string | null;
  filename?: string | null;
  description?: string | null;
};

export type EventOrganizationOption = { id: string; name: string };
export type EventOwnerOption = { id: string; name: string };
export type EventPlaceOption = {
  id: string;
  name: string;
  zip?: string | null;
  city?: string | null;
};

const ERROR_VALUES: Record<string, Record<string, unknown>> = {
  'agenda.form.errors.nameTooLong': { max: EVENT_NAME_MAX_LENGTH },
  'agenda.form.errors.printDescriptionTooLong': {
    max: EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
  },
  'agenda.form.errors.descriptionTooLong': {
    max: EVENT_DESCRIPTION_MAX_LENGTH,
  },
  'agenda.form.errors.captionTooLong': {
    max: EVENT_IMAGE_CAPTION_MAX_LENGTH,
  },
  'agenda.form.errors.tagsRequired': { min: EVENT_TAGS_MIN },
  'agenda.form.errors.tagsTooMany': { max: EVENT_TAGS_MAX },
  'agenda.form.errors.ticketingUrl': {
    schemes: TICKETING_URL_SCHEMES.join(', '),
  },
};

export const formErrorValues = (message: string): Record<string, unknown> =>
  ERROR_VALUES[message] ?? {};

const fail = (ctx: z.RefinementCtx, message: string, path: string[] = []) =>
  ctx.addIssue({ code: z.ZodIssueCode.custom, message, path });

const nameField = z.string().superRefine((name, ctx) => {
  if (!eventNameSchema.safeParse(name).success) {
    fail(
      ctx,
      name.trim() ?
        'agenda.form.errors.nameTooLong'
      : 'agenda.form.errors.nameRequired'
    );
  }
});

const printDescriptionField = z.string().superRefine((value, ctx) => {
  if (!eventPrintDescriptionSchema.safeParse(value).success) {
    fail(ctx, 'agenda.form.errors.printDescriptionTooLong');
  }
});

const richTextOf = (block: EventBlockValue) =>
  block.type === EditorBlockType.RichText ?
    [{ type: 'richText', richText: block.value.richText }]
  : [];

export const eventDescriptionLength = (blocks: EventBlockValue[]) =>
  blocksTextLength(blocks.flatMap(richTextOf));

const blocksField = z
  .array(z.custom<EventBlockValue>())
  .superRefine((blocks, ctx) => {
    if (blocks.some(({ type }) => !isEventBlockType(eventBlockApiType(type)))) {
      fail(ctx, 'agenda.form.errors.blockNotAllowed');
    }

    if (eventDescriptionLength(blocks) > EVENT_DESCRIPTION_MAX_LENGTH) {
      fail(ctx, 'agenda.form.errors.descriptionTooLong');
    }
  });

const imageRow = z.object({
  id: z.string(),
  value: z.object({
    image: z.custom<EventImageRef>(),
    caption: z.string().superRefine((caption, ctx) => {
      if (characterCount(caption) > EVENT_IMAGE_CAPTION_MAX_LENGTH) {
        fail(ctx, 'agenda.form.errors.captionTooLong');
      }
    }),
    altText: z.string(),
    isMain: z.boolean(),
  }),
});

const tagIdsField = z.array(z.string()).superRefine((tagIds, ctx) => {
  if (eventTagIdsSchema.safeParse(tagIds).success) {
    return;
  }

  fail(
    ctx,
    tagIds.length < EVENT_TAGS_MIN ? 'agenda.form.errors.tagsRequired'
    : tagIds.length > EVENT_TAGS_MAX ? 'agenda.form.errors.tagsTooMany'
    : 'agenda.form.errors.tagsDistinct'
  );
});

const rateRow = z.object({
  id: z.string(),
  value: z.object({
    price: z.string().superRefine((price, ctx) => {
      if (!eventRateSchema.shape.price.safeParse(price).success) {
        fail(ctx, 'agenda.form.errors.ratePrice');
      }
    }),
    designation: z.string(),
  }),
});

const ticketingUrlField = z.string().superRefine((url, ctx) => {
  if (url.trim() && !ticketingUrlSchema.safeParse(url.trim()).success) {
    fail(ctx, 'agenda.form.errors.ticketingUrl');
  }
});

const spanFields = {
  dateFrom: z.string(),
  timeFrom: z.string(),
  dateTo: z.string(),
  timeTo: z.string(),
  openingTime: z.string(),
};

const scheduleShape = z.object({
  scheduleType: z.nativeEnum(EventScheduleType),
  continuous: z.object(spanFields),
  weekly: z.object({ ...spanFields, weekDays: z.array(z.number()) }),
  explicit: z.array(
    z.object({
      id: z.string(),
      value: z.object({
        date: z.string(),
        timeFrom: z.string(),
        timeTo: z.string(),
        openingTime: z.string(),
      }),
    })
  ),
});

const scheduleField = (now: Date) =>
  scheduleShape.superRefine((schedule, ctx) => {
    const { schedule: input, incomplete } = scheduleFromForm(schedule);
    const problems: SchedulePreviewProblem[] =
      incomplete ? ['IncompleteDates'] : eventScheduleProblems(input, now);

    for (const problem of problems) {
      fail(
        ctx,
        scheduleProblemKey(problem),
        scheduleProblemPath(problem, schedule.scheduleType)
      );
    }
  });

export const eventFormSchema = (now: Date) =>
  z.object({
    name: nameField,
    printDescription: printDescriptionField,
    blocks: blocksField,
    images: z.array(imageRow),
    status: z.nativeEnum(EventStatus),
    organization: z.custom<EventOrganizationOption>().nullable(),
    owner: z.custom<EventOwnerOption>().nullable(),
    place: z.custom<EventPlaceOption>().nullable(),
    tagIds: tagIdsField,
    audienceId: z.string().nullable(),
    schedule: scheduleField(now),
    rates: z.array(rateRow),
    specialRate: z.nativeEnum(EventSpecialRate).nullable(),
    ticketingUrl: ticketingUrlField,
    showInPrint: z.boolean(),
    slug: z.string(),
    seoTitle: z.string(),
    seoDescription: z.string(),
    socialMediaTitle: z.string(),
    socialMediaDescription: z.string(),
    socialMediaImage: z.custom<EventImageRef>().nullable(),
  });

export type EventFormValues = z.infer<ReturnType<typeof eventFormSchema>>;

export const CONTENT_FIELDS = [
  'name',
  'printDescription',
  'blocks',
  'images',
] as const satisfies readonly (keyof EventFormValues)[];

export const FACT_FIELDS = [
  'status',
  'organization',
  'owner',
  'place',
  'tagIds',
  'audienceId',
  'schedule',
  'rates',
  'specialRate',
  'ticketingUrl',
  'showInPrint',
  'slug',
  'seoTitle',
  'seoDescription',
  'socialMediaTitle',
  'socialMediaDescription',
  'socialMediaImage',
] as const satisfies readonly (keyof EventFormValues)[];

export const emptyEventForm = (): EventFormValues => ({
  name: '',
  printDescription: '',
  blocks: [],
  images: [],
  status: EventStatus.Confirmed,
  organization: null,
  owner: null,
  place: null,
  tagIds: [],
  audienceId: null,
  schedule: emptyScheduleForm(),
  rates: [],
  specialRate: null,
  ticketingUrl: '',
  showInPrint: true,
  slug: '',
  seoTitle: '',
  seoDescription: '',
  socialMediaTitle: '',
  socialMediaDescription: '',
  socialMediaImage: null,
});
