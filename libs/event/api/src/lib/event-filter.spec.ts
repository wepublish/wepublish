import { BadRequestException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import {
  createEventWhere,
  createOccurrenceWhere,
  eventAttributeClauses,
  occurrenceTimeWhere,
} from './event-filter';

const NOW = new Date('2026-10-23T10:00:00.000Z');
const SCOPE = { published: { isNot: null } };

describe('eventAttributeClauses', () => {
  it('adds nothing for an empty filter', () => {
    expect(eventAttributeClauses(undefined)).toEqual([]);
    expect(eventAttributeClauses({})).toEqual([]);
    expect(
      eventAttributeClauses({
        ids: [],
        tagIds: [],
        organizationIds: [],
        placeIds: [],
        accessibilityProInfirmis: [],
        eventStatus: [],
      })
    ).toEqual([]);
  });

  it.each([
    ['ids', { ids: ['e1'] }, { id: { in: ['e1'] } }],
    [
      'tagIds',
      { tagIds: ['t1', 't2'] },
      { tags: { some: { tagId: { in: ['t1', 't2'] } } } },
    ],
    ['audienceId', { audienceId: 'a1' }, { audienceId: 'a1' }],
    ['regionId', { regionId: 'r1' }, { place: { is: { regionId: 'r1' } } }],
    [
      'organizationIds',
      { organizationIds: ['o1'] },
      { organizationId: { in: ['o1'] } },
    ],
    ['placeIds', { placeIds: ['p1'] }, { placeId: { in: ['p1'] } }],
    [
      'wheelchairAccessible true',
      { wheelchairAccessible: true },
      { place: { is: { wheelchairAccessible: true } } },
    ],
    [
      'wheelchairAccessible false',
      { wheelchairAccessible: false },
      { NOT: { place: { is: { wheelchairAccessible: true } } } },
    ],
    [
      'accessibilityProInfirmis',
      { accessibilityProInfirmis: [8, 10] },
      {
        place: {
          is: {
            OR: [
              { proInfirmisPictograms: { array_contains: [{ Id: 8 }] } },
              { proInfirmisPictograms: { array_contains: [{ Id: 10 }] } },
            ],
          },
        },
      },
    ],
    [
      'partner true',
      { partner: true },
      { organization: { is: { partner: true } } },
    ],
    [
      'partner false',
      { partner: false },
      { NOT: { organization: { is: { partner: true } } } },
    ],
    ['showInPrint true', { showInPrint: true }, { showInPrint: true }],
    ['showInPrint false', { showInPrint: false }, { showInPrint: false }],
    [
      'eventStatus',
      { eventStatus: [EventStatus.Cancelled, EventStatus.SoldOut] },
      { status: { in: [EventStatus.Cancelled, EventStatus.SoldOut] } },
    ],
  ])('matches %s on the event', (_, filter, clause) => {
    expect(eventAttributeClauses(filter)).toEqual([clause]);
  });

  it('matches a bounding box on the venue coordinates', () => {
    expect(
      eventAttributeClauses({
        geoBoundingBox: {
          southWest: { latitude: 46.9, longitude: 7.3 },
          northEast: { latitude: 47.0, longitude: 7.5 },
        },
      })
    ).toEqual([
      {
        place: {
          is: {
            latitude: { gte: 46.9, lte: 47.0 },
            longitude: { gte: 7.3, lte: 7.5 },
          },
        },
      },
    ]);
  });

  it('refuses a bounding box with one corner', () => {
    expect(() =>
      eventAttributeClauses({
        geoBoundingBox: {
          southWest: { latitude: 46.9, longitude: 7.3 },
        } as never,
      })
    ).toThrow(BadRequestException);
  });

  it('needs no permission for partner, so an anonymous filter keeps it', () => {
    expect(eventAttributeClauses({ partner: true })).toHaveLength(1);
  });

  it('leaves time to the occurrence clauses', () => {
    expect(
      eventAttributeClauses({ upcoming: true, from: NOW, to: NOW })
    ).toEqual([]);
  });
});

describe('occurrenceTimeWhere', () => {
  it('adds nothing without time', () => {
    expect(occurrenceTimeWhere({}, NOW)).toEqual({});
    expect(occurrenceTimeWhere(undefined, NOW)).toEqual({});
  });

  it('reads upcoming as an occurrence that has not ended', () => {
    expect(occurrenceTimeWhere({ upcoming: true }, NOW)).toEqual({
      dateTo: { gte: NOW },
    });
  });

  it('keeps the later of from and now as the lower bound', () => {
    const past = new Date('2026-01-01T00:00:00.000Z');
    const future = new Date('2026-12-01T00:00:00.000Z');

    expect(occurrenceTimeWhere({ upcoming: true, from: past }, NOW)).toEqual({
      dateTo: { gte: NOW },
    });
    expect(occurrenceTimeWhere({ upcoming: true, from: future }, NOW)).toEqual({
      dateTo: { gte: future },
    });
  });

  it('matches from and to as an overlap with the occurrence', () => {
    const from = new Date('2026-11-01T00:00:00.000Z');
    const to = new Date('2026-11-30T00:00:00.000Z');

    expect(occurrenceTimeWhere({ from, to }, NOW)).toEqual({
      dateTo: { gte: from },
      dateFrom: { lte: to },
    });
  });
});

describe('createEventWhere', () => {
  it('nests time under the occurrences of the event', () => {
    const to = new Date('2026-11-30T00:00:00.000Z');

    expect(
      createEventWhere({ tagIds: ['t1'], upcoming: true, to }, NOW)
    ).toEqual({
      AND: [
        { tags: { some: { tagId: { in: ['t1'] } } } },
        {
          occurrences: {
            some: { dateTo: { gte: NOW }, dateFrom: { lte: to } },
          },
        },
      ],
    });
  });

  it('adds no clause for an empty filter', () => {
    expect(createEventWhere({}, NOW)).toEqual({ AND: [] });
  });
});

describe('createOccurrenceWhere', () => {
  it('keeps time flat on the occurrence and puts the rest on its event behind the scope', () => {
    expect(
      createOccurrenceWhere(
        { upcoming: true, eventStatus: [EventStatus.Confirmed] },
        NOW,
        SCOPE
      )
    ).toEqual({
      AND: [
        { dateTo: { gte: NOW } },
        {
          event: {
            is: {
              AND: [SCOPE, { status: { in: [EventStatus.Confirmed] } }],
            },
          },
        },
      ],
    });
  });

  it('still scopes the event for an empty filter', () => {
    expect(createOccurrenceWhere({}, NOW, SCOPE)).toEqual({
      AND: [{ event: { is: { AND: [SCOPE] } } }],
    });
  });
});
