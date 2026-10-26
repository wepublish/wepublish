import { EditorBlockType, EventScheduleType } from '@wepublish/editor/api';
import {
  EVENT_NAME_MAX_LENGTH,
  EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
} from '@wepublish/event/schedule';

import {
  CONTENT_FIELDS,
  emptyEventForm,
  EventFormValues,
  eventFormSchema,
  FACT_FIELDS,
  formErrorValues,
} from './event-form-schema';

const NOW = new Date('2026-10-23T08:00:00.000Z');

const valid = (): EventFormValues => ({
  ...emptyEventForm(),
  name: 'Qui-vive',
  tagIds: ['tag-1'],
  schedule: {
    ...emptyEventForm().schedule,
    scheduleType: EventScheduleType.Continuous,
    continuous: {
      dateFrom: '2027-03-09',
      timeFrom: '20:00',
      dateTo: '2027-03-09',
      timeTo: '22:00',
      openingTime: '',
    },
  },
});

const issuesOf = (values: EventFormValues) => {
  const result = eventFormSchema(NOW).safeParse(values);

  return result.success ?
      []
    : result.error.issues.map(({ path, message }) => ({
        path: path.join('.'),
        message,
      }));
};

const paragraph = (text: string): EventFormValues['blocks'][number] => ({
  key: 'block-1',
  type: EditorBlockType.RichText,
  value: {
    richText: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    } as never,
  },
});

describe('eventFormSchema', () => {
  it('accepts a complete event', () => {
    expect(issuesOf(valid())).toEqual([]);
  });

  it('refuses a 131-character name and accepts 130', () => {
    expect(
      issuesOf({ ...valid(), name: 'x'.repeat(EVENT_NAME_MAX_LENGTH + 1) })
    ).toEqual([{ path: 'name', message: 'agenda.form.errors.nameTooLong' }]);
    expect(
      issuesOf({ ...valid(), name: 'x'.repeat(EVENT_NAME_MAX_LENGTH) })
    ).toEqual([]);
  });

  it('refuses a blank name', () => {
    expect(issuesOf({ ...valid(), name: '   ' })).toEqual([
      { path: 'name', message: 'agenda.form.errors.nameRequired' },
    ]);
  });

  it('refuses a 257-character print blurb', () => {
    expect(
      issuesOf({
        ...valid(),
        printDescription: 'x'.repeat(EVENT_PRINT_DESCRIPTION_MAX_LENGTH + 1),
      })
    ).toEqual([
      {
        path: 'printDescription',
        message: 'agenda.form.errors.printDescriptionTooLong',
      },
    ]);
  });

  it('refuses an ftp:// ticketing URL and accepts none', () => {
    expect(
      issuesOf({ ...valid(), ticketingUrl: 'ftp://tickets.example.com' })
    ).toEqual([
      { path: 'ticketingUrl', message: 'agenda.form.errors.ticketingUrl' },
    ]);
    expect(issuesOf({ ...valid(), ticketingUrl: '' })).toEqual([]);
  });

  it('refuses a door time of 25:00 at the door time field', () => {
    const values = valid();

    expect(
      issuesOf({
        ...values,
        schedule: {
          ...values.schedule,
          continuous: { ...values.schedule.continuous, openingTime: '25:00' },
        },
      })
    ).toEqual([
      {
        path: 'schedule.continuous.openingTime',
        message: 'agenda.schedule.problems.InvalidOpeningTime',
      },
    ]);
  });

  it('refuses a weekly series with no day at the day toggles', () => {
    const values = valid();

    expect(
      issuesOf({
        ...values,
        schedule: {
          ...values.schedule,
          scheduleType: EventScheduleType.Weekly,
          weekly: { ...values.schedule.continuous, weekDays: [] },
        },
      })
    ).toEqual([
      {
        path: 'schedule.weekly.weekDays',
        message: 'agenda.schedule.problems.MissingWeekDays',
      },
    ]);
  });

  it('needs one to three tags', () => {
    expect(issuesOf({ ...valid(), tagIds: [] })).toEqual([
      { path: 'tagIds', message: 'agenda.form.errors.tagsRequired' },
    ]);
    expect(issuesOf({ ...valid(), tagIds: ['a', 'b', 'c', 'd'] })).toEqual([
      { path: 'tagIds', message: 'agenda.form.errors.tagsTooMany' },
    ]);
  });

  it('needs a price on every rate', () => {
    expect(
      issuesOf({
        ...valid(),
        rates: [{ id: 'r', value: { price: ' ', designation: 'Reduced' } }],
      })
    ).toEqual([
      { path: 'rates.0.value.price', message: 'agenda.form.errors.ratePrice' },
    ]);
  });

  it('refuses an image caption over 125 characters', () => {
    expect(
      issuesOf({
        ...valid(),
        images: [
          {
            id: 'i',
            value: {
              image: { id: 'img-1' },
              caption: 'x'.repeat(126),
              altText: '',
              isMain: true,
            },
          },
        ],
      })
    ).toEqual([
      {
        path: 'images.0.value.caption',
        message: 'agenda.form.errors.captionTooLong',
      },
    ]);
  });

  it('refuses a description over 6,400 characters', () => {
    expect(
      issuesOf({ ...valid(), blocks: [paragraph('x'.repeat(6401))] })
    ).toEqual([
      { path: 'blocks', message: 'agenda.form.errors.descriptionTooLong' },
    ]);
  });

  it('accepts a block an article may hold, such as a poll', () => {
    expect(
      issuesOf({
        ...valid(),
        blocks: [
          {
            key: 'poll',
            type: EditorBlockType.Poll,
            value: {},
          } as unknown as EventFormValues['blocks'][number],
        ],
      })
    ).toEqual([]);
  });

  it('gives each length message its limit', () => {
    expect(formErrorValues('agenda.form.errors.nameTooLong')).toEqual({
      max: EVENT_NAME_MAX_LENGTH,
    });
    expect(formErrorValues('agenda.form.errors.ratePrice')).toEqual({});
  });

  it('puts every field in exactly one of the fact and content groups', () => {
    const fields = Object.keys(eventFormSchema(NOW).shape).sort();
    const grouped = [...FACT_FIELDS, ...CONTENT_FIELDS];

    expect([...grouped].sort()).toEqual(fields);
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(Object.keys(emptyEventForm()).sort()).toEqual(fields);
  });
});
