import { EventSchedule, EventScheduleDate } from './event-schedule';
import {
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_NAME_MAX_LENGTH,
  EVENT_PRINT_DESCRIPTION_MAX_LENGTH,
  EVENT_TAGS_MAX,
  EVENT_TAGS_MIN,
  eventBlocksSchema,
  eventContentInputSchema,
  eventNameSchema,
  eventPrintDescriptionSchema,
  eventRateSchema,
  eventRatesSchema,
  eventScheduleProblems,
  eventTagIdsSchema,
  isOpeningTime,
  openingTimeSchema,
  TICKETING_URL_SCHEMES,
  ticketingUrlSchema,
} from './event-input-rules';

const at = (value: string) => new Date(value);

const scheduleDate = (
  dateFrom: string,
  dateTo: string,
  overrides: Partial<EventScheduleDate> = {}
): EventScheduleDate => ({
  dateFrom: at(dateFrom),
  dateTo: at(dateTo),
  openingTime: null,
  sortOrder: 0,
  legacyEventId: null,
  ...overrides,
});

const schedule = (overrides: Partial<EventSchedule>): EventSchedule => ({
  scheduleType: 'Continuous',
  dateFrom: at('2026-11-02T18:00:00.000Z'),
  dateTo: at('2026-11-30T21:00:00.000Z'),
  weekDays: [],
  openingTime: null,
  dates: [],
  ...overrides,
});

const richTextBlock = (value: string) => ({
  type: 'richText',
  richText: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: value, marks: [{ type: 'bold' }] },
          {
            type: 'text',
            text: '',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          },
        ],
      },
    ],
  },
});

const accepts = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown
) => schema.safeParse(value).success;

describe('limits', () => {
  it('ports the BKa limits', () => {
    expect(EVENT_NAME_MAX_LENGTH).toBe(130);
    expect(EVENT_PRINT_DESCRIPTION_MAX_LENGTH).toBe(256);
    expect(EVENT_DESCRIPTION_MAX_LENGTH).toBe(6400);
    expect(EVENT_TAGS_MIN).toBe(1);
    expect(EVENT_TAGS_MAX).toBe(3);
    expect(TICKETING_URL_SCHEMES).toEqual(['http', 'https', 'mailto', 'tel']);
  });
});

describe('eventNameSchema', () => {
  it('accepts 130 characters and rejects 131', () => {
    expect(accepts(eventNameSchema, 'a'.repeat(130))).toBe(true);
    expect(accepts(eventNameSchema, 'a'.repeat(131))).toBe(false);
  });

  it('rejects a blank name', () => {
    expect(accepts(eventNameSchema, '')).toBe(false);
    expect(accepts(eventNameSchema, '   ')).toBe(false);
  });

  it('counts characters, not UTF-16 code units', () => {
    expect(accepts(eventNameSchema, '🎭'.repeat(130))).toBe(true);
    expect(accepts(eventNameSchema, '🎭'.repeat(131))).toBe(false);
  });
});

describe('eventPrintDescriptionSchema', () => {
  it('accepts 256 characters and rejects 257', () => {
    expect(accepts(eventPrintDescriptionSchema, 'a'.repeat(256))).toBe(true);
    expect(accepts(eventPrintDescriptionSchema, 'a'.repeat(257))).toBe(false);
  });

  it('accepts null and undefined', () => {
    expect(accepts(eventPrintDescriptionSchema, null)).toBe(true);
    expect(accepts(eventPrintDescriptionSchema, undefined)).toBe(true);
  });
});

describe('eventBlocksSchema', () => {
  it('accepts 6,400 characters of text and rejects 6,401', () => {
    expect(accepts(eventBlocksSchema, [richTextBlock('a'.repeat(6400))])).toBe(
      true
    );
    expect(accepts(eventBlocksSchema, [richTextBlock('a'.repeat(6401))])).toBe(
      false
    );
  });

  it('does not count marks, links or other blocks', () => {
    expect(
      accepts(eventBlocksSchema, [
        richTextBlock('a'.repeat(6400)),
        { type: 'html', html: 'b'.repeat(10000) },
      ])
    ).toBe(true);
  });

  it('sums the text of several richText blocks', () => {
    expect(
      accepts(eventBlocksSchema, [
        richTextBlock('a'.repeat(3200)),
        richTextBlock('a'.repeat(3200)),
      ])
    ).toBe(true);
    expect(
      accepts(eventBlocksSchema, [
        richTextBlock('a'.repeat(3200)),
        richTextBlock('a'.repeat(3201)),
      ])
    ).toBe(false);
  });

  it('accepts an empty list and rejects a non-list', () => {
    expect(accepts(eventBlocksSchema, [])).toBe(true);
    expect(accepts(eventBlocksSchema, 'blocks')).toBe(false);
  });
});

describe('eventTagIdsSchema', () => {
  it('requires one to three tags', () => {
    expect(accepts(eventTagIdsSchema, [])).toBe(false);
    expect(accepts(eventTagIdsSchema, ['a'])).toBe(true);
    expect(accepts(eventTagIdsSchema, ['a', 'b', 'c'])).toBe(true);
    expect(accepts(eventTagIdsSchema, ['a', 'b', 'c', 'd'])).toBe(false);
  });

  it('rejects a tag listed twice', () => {
    expect(accepts(eventTagIdsSchema, ['a', 'a'])).toBe(false);
  });
});

describe('ticketingUrlSchema', () => {
  it.each([
    'http://example.com/tickets',
    'https://example.com/tickets?id=1',
    'mailto:tickets@example.com',
    'tel:+41311234567',
    'HTTPS://EXAMPLE.COM',
  ])('accepts %s', value => {
    expect(accepts(ticketingUrlSchema, value)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'ftp://example.com/file',
    'example.com',
    'www.example.com/tickets',
    '',
    'https://',
  ])('rejects %s', value => {
    expect(accepts(ticketingUrlSchema, value)).toBe(false);
  });

  it('accepts null and undefined', () => {
    expect(accepts(ticketingUrlSchema, null)).toBe(true);
    expect(accepts(ticketingUrlSchema, undefined)).toBe(true);
  });
});

describe('openingTime', () => {
  it.each(['00:00', '07:30', '19:30', '23:59'])('accepts %s', value => {
    expect(isOpeningTime(value)).toBe(true);
    expect(accepts(openingTimeSchema, value)).toBe(true);
  });

  it.each(['24:00', '7:30', '19:60', '19:30:00', '1930', ''])(
    'rejects %s',
    value => {
      expect(isOpeningTime(value)).toBe(false);
      expect(accepts(openingTimeSchema, value)).toBe(false);
    }
  );

  it('accepts null in the schema', () => {
    expect(accepts(openingTimeSchema, null)).toBe(true);
  });
});

describe('eventRateSchema', () => {
  it('accepts a free-text price with an optional designation', () => {
    expect(accepts(eventRateSchema, { price: 'CHF 25.–' })).toBe(true);
    expect(
      accepts(eventRateSchema, { price: 'Kollekte', designation: 'Kinder' })
    ).toBe(true);
    expect(accepts(eventRateSchema, { price: '15', designation: null })).toBe(
      true
    );
  });

  it('rejects a blank price', () => {
    expect(accepts(eventRateSchema, { price: '' })).toBe(false);
    expect(accepts(eventRateSchema, { price: '   ' })).toBe(false);
  });

  it('checks every rate in a list', () => {
    expect(accepts(eventRatesSchema, [])).toBe(true);
    expect(accepts(eventRatesSchema, [{ price: '10' }, { price: ' ' }])).toBe(
      false
    );
  });
});

describe('eventContentInputSchema', () => {
  it('accepts valid prose', () => {
    expect(
      accepts(eventContentInputSchema, {
        name: 'Konzert',
        printDescription: null,
        blocks: [richTextBlock('Beschreibung')],
      })
    ).toBe(true);
  });

  it('rejects prose that breaks any rule', () => {
    expect(
      accepts(eventContentInputSchema, {
        name: 'a'.repeat(131),
        blocks: [],
      })
    ).toBe(false);
    expect(
      accepts(eventContentInputSchema, {
        name: 'Konzert',
        printDescription: 'a'.repeat(257),
        blocks: [],
      })
    ).toBe(false);
    expect(
      accepts(eventContentInputSchema, {
        name: 'Konzert',
        blocks: [richTextBlock('a'.repeat(6401))],
      })
    ).toBe(false);
  });
});

describe('eventScheduleProblems', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const now = at('2026-10-23T10:00:00.000Z');

  it('returns nothing for a valid Continuous schedule', () => {
    expect(eventScheduleProblems(schedule({}), now)).toEqual([]);
  });

  it('reports a Continuous schedule without dateTo', () => {
    expect(eventScheduleProblems(schedule({ dateTo: null }), now)).toEqual([
      'MissingDateRange',
    ]);
  });

  it('reports a Weekly schedule without dateFrom', () => {
    expect(
      eventScheduleProblems(
        schedule({ scheduleType: 'Weekly', weekDays: [1], dateFrom: null }),
        now
      )
    ).toEqual(['MissingDateRange']);
  });

  it('accepts dateFrom equal to dateTo', () => {
    expect(
      eventScheduleProblems(
        schedule({
          dateFrom: at('2026-11-02T18:00:00.000Z'),
          dateTo: at('2026-11-02T18:00:00.000Z'),
        }),
        now
      )
    ).toEqual([]);
  });

  it('reports a span that ends before it starts', () => {
    expect(
      eventScheduleProblems(
        schedule({
          dateFrom: at('2026-11-02T18:00:00.000Z'),
          dateTo: at('2026-11-02T17:59:59.999Z'),
        }),
        now
      )
    ).toEqual(['DateToBeforeDateFrom']);
  });

  it('reports an Explicit schedule without dates', () => {
    expect(
      eventScheduleProblems(
        schedule({
          scheduleType: 'Explicit',
          dateFrom: null,
          dateTo: null,
          dates: [],
        }),
        now
      )
    ).toEqual(['MissingDates']);
  });

  it('does not require a span for an Explicit schedule', () => {
    expect(
      eventScheduleProblems(
        schedule({
          scheduleType: 'Explicit',
          dateFrom: null,
          dateTo: null,
          dates: [
            scheduleDate(
              '2026-11-02T18:00:00.000Z',
              '2026-11-02T21:00:00.000Z'
            ),
          ],
        }),
        now
      )
    ).toEqual([]);
  });

  it('reports one inverted explicit date among valid ones', () => {
    expect(
      eventScheduleProblems(
        schedule({
          scheduleType: 'Explicit',
          dateFrom: null,
          dateTo: null,
          dates: [
            scheduleDate(
              '2026-11-02T18:00:00.000Z',
              '2026-11-02T21:00:00.000Z'
            ),
            scheduleDate(
              '2026-11-05T21:00:00.000Z',
              '2026-11-05T18:00:00.000Z'
            ),
          ],
        }),
        now
      )
    ).toEqual(['DateToBeforeDateFrom']);
  });

  it('accepts a well-formed opening time', () => {
    expect(
      eventScheduleProblems(schedule({ openingTime: '19:30' }), now)
    ).toEqual([]);
  });

  it.each(['24:00', '7:30'])('reports the opening time %s', openingTime => {
    expect(eventScheduleProblems(schedule({ openingTime }), now)).toEqual([
      'InvalidOpeningTime',
    ]);
  });

  it('reports a malformed opening time on an explicit date', () => {
    expect(
      eventScheduleProblems(
        schedule({
          scheduleType: 'Explicit',
          dateFrom: null,
          dateTo: null,
          dates: [
            scheduleDate(
              '2026-11-02T18:00:00.000Z',
              '2026-11-02T21:00:00.000Z',
              {
                openingTime: '19:30',
              }
            ),
            scheduleDate(
              '2026-11-05T18:00:00.000Z',
              '2026-11-05T21:00:00.000Z',
              {
                openingTime: '7:30',
              }
            ),
          ],
        }),
        now
      )
    ).toEqual(['InvalidOpeningTime']);
  });

  it('delegates the weekday rules to validateScheduleInput', () => {
    expect(
      eventScheduleProblems(
        schedule({ scheduleType: 'Weekly', weekDays: [] }),
        now
      )
    ).toEqual(['MissingWeekDays']);
    expect(
      eventScheduleProblems(
        schedule({ scheduleType: 'Weekly', weekDays: [0, 8] }),
        now
      )
    ).toEqual(['InvalidWeekDays']);
  });

  it('enforces the horizon at Zurich midnight two years on, with frozen time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(at('2026-10-23T10:00:00.000Z'));

    expect(
      eventScheduleProblems(
        schedule({ dateTo: at('2028-10-23T21:59:00.000Z') }),
        new Date()
      )
    ).toEqual([]);
    expect(
      eventScheduleProblems(
        schedule({ dateTo: at('2028-10-23T22:00:00.000Z') }),
        new Date()
      )
    ).toEqual(['BeyondScheduleHorizon']);
  });

  it('reports every problem at once, each code once', () => {
    expect(
      eventScheduleProblems(
        schedule({
          scheduleType: 'Explicit',
          dateFrom: null,
          dateTo: null,
          openingTime: '25:00',
          dates: [
            scheduleDate(
              '2031-01-02T21:00:00.000Z',
              '2031-01-02T18:00:00.000Z',
              {
                openingTime: '7:30',
              }
            ),
            scheduleDate(
              '2031-01-05T21:00:00.000Z',
              '2031-01-05T18:00:00.000Z'
            ),
          ],
          weekDays: [9],
        }),
        now
      )
    ).toEqual([
      'DateToBeforeDateFrom',
      'InvalidOpeningTime',
      'InvalidWeekDays',
      'BeyondScheduleHorizon',
    ]);
  });
});
