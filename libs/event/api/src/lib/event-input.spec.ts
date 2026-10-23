import { BadRequestException } from '@nestjs/common';
import { EventSchedule } from '@wepublish/event/schedule';
import {
  assertValidContent,
  assertValidFacts,
  assertValidSchedule,
  assertWithinHorizon,
} from './event-input';

const continuous = (
  dateFrom: string | null,
  dateTo: string | null
): EventSchedule => ({
  scheduleType: 'Continuous',
  dateFrom: dateFrom ? new Date(dateFrom) : null,
  dateTo: dateTo ? new Date(dateTo) : null,
  weekDays: [],
  openingTime: null,
  dates: [],
});

const now = new Date('2026-10-23T10:00:00.000Z');

const richText = (text: string) => ({
  type: 'richText',
  richText: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  },
});

const rejection = (run: () => void) => {
  try {
    run();
  } catch (error) {
    return error;
  }

  return null;
};

describe('assertValidSchedule', () => {
  it('accepts a valid schedule', () => {
    expect(() =>
      assertValidSchedule(
        continuous('2026-11-01T18:00:00.000Z', '2026-11-01T18:00:00.000Z'),
        now
      )
    ).not.toThrow();
  });

  it.each<[string, EventSchedule]>([
    ['MissingDateRange', continuous('2026-11-01T18:00:00.000Z', null)],
    [
      'DateToBeforeDateFrom',
      continuous('2026-11-02T18:00:00.000Z', '2026-11-01T18:00:00.000Z'),
    ],
    ['MissingDates', { ...continuous(null, null), scheduleType: 'Explicit' }],
    [
      'InvalidOpeningTime',
      {
        ...continuous('2026-11-01T18:00:00.000Z', '2026-11-01T20:00:00.000Z'),
        openingTime: '7:30',
      },
    ],
    [
      'MissingWeekDays',
      {
        ...continuous('2026-11-01T18:00:00.000Z', '2026-11-30T20:00:00.000Z'),
        scheduleType: 'Weekly',
      },
    ],
    [
      'InvalidWeekDays',
      {
        ...continuous('2026-11-01T18:00:00.000Z', '2026-11-30T20:00:00.000Z'),
        scheduleType: 'Weekly',
        weekDays: [0, 8],
      },
    ],
    [
      'BeyondScheduleHorizon',
      continuous('2026-11-01T18:00:00.000Z', '2028-10-23T22:00:00.000Z'),
    ],
  ])('turns %s into a BadRequestException naming it', (code, schedule) => {
    const error = rejection(() => assertValidSchedule(schedule, now));

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as Error).message).toContain(code);
  });

  it('accepts the last minute of the horizon day', () => {
    expect(() =>
      assertValidSchedule(
        continuous('2026-11-01T18:00:00.000Z', '2028-10-23T21:59:00.000Z'),
        now
      )
    ).not.toThrow();
  });
});

describe('assertWithinHorizon', () => {
  it('only checks the horizon, so a stored weekly schedule without days passes', () => {
    expect(() =>
      assertWithinHorizon(
        {
          ...continuous('2026-11-01T18:00:00.000Z', '2026-11-30T20:00:00.000Z'),
          scheduleType: 'Weekly',
        },
        now
      )
    ).not.toThrow();
  });

  it('rejects a schedule that has drifted past the horizon', () => {
    const error = rejection(() =>
      assertWithinHorizon(
        continuous('2026-11-01T18:00:00.000Z', '2028-10-24T10:00:00.000Z'),
        now
      )
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as Error).message).toContain('BeyondScheduleHorizon');
  });
});

describe('assertValidFacts', () => {
  it('accepts the documented values', () => {
    expect(() =>
      assertValidFacts({
        tagIds: ['a'],
        ticketingUrl: 'https://tickets.example.com',
        rates: [{ price: '15.-' }],
      })
    ).not.toThrow();
  });

  it('accepts omitted values, as an update leaves them alone', () => {
    expect(() => assertValidFacts({})).not.toThrow();
  });

  it.each([
    [{ tagIds: [] }],
    [{ tagIds: ['a', 'b', 'c', 'd'] }],
    [{ ticketingUrl: 'javascript:alert(1)' }],
    [{ ticketingUrl: 'tickets.example.com' }],
    [{ rates: [{ price: '  ' }] }],
  ])('rejects %j', facts => {
    expect(rejection(() => assertValidFacts(facts))).toBeInstanceOf(
      BadRequestException
    );
  });
});

describe('assertValidContent', () => {
  it('accepts a name of 130 characters and a description of 6,400', () => {
    expect(() =>
      assertValidContent({
        name: 'n'.repeat(130),
        printDescription: 'p'.repeat(256),
        blocks: [richText('d'.repeat(6400))],
        images: [],
      })
    ).not.toThrow();
  });

  it.each([
    ['a name over 130 characters', { name: 'n'.repeat(131) }],
    ['a print description over 256', { printDescription: 'p'.repeat(257) }],
    ['a description over 6,400', { blocks: [richText('d'.repeat(6401))] }],
    ['an empty name', { name: '  ' }],
    [
      'two main images',
      {
        images: [
          { imageId: 'a', isMain: true },
          { imageId: 'b', isMain: true },
        ],
      },
    ],
    [
      'the same image twice',
      {
        images: [{ imageId: 'a' }, { imageId: 'a' }],
      },
    ],
  ])('rejects %s', (_name, change) => {
    expect(
      rejection(() =>
        assertValidContent({
          name: 'Concert',
          blocks: [],
          images: [],
          ...change,
        })
      )
    ).toBeInstanceOf(BadRequestException);
  });

  it('names the block type the agenda cannot show', () => {
    const error = rejection(() =>
      assertValidContent({
        name: 'Concert',
        blocks: [richText('ok'), { type: 'teaserGrid', teasers: [] }],
        images: [],
      })
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as Error).message).toContain('teaserGrid');
  });
});
