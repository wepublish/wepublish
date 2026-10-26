import { mockEvent } from '@wepublish/storybook/mocks';
import { EventScheduleType, EventStatus } from '@wepublish/website/api';

import { getEventSEO } from './event-seo';

describe('getEventSEO', () => {
  it('strips query params from the url used for canonical and og:url', () => {
    const seo = getEventSEO({
      ...mockEvent(),
      url: 'https://example.com/event/abc?from=newsletter',
    });

    expect(seo.url).toBe('https://example.com/event/abc');
  });

  it('emits a duration for a continuous event', () => {
    const seo = getEventSEO(
      mockEvent({
        scheduleType: EventScheduleType.Continuous,
        startsAt: '2026-11-01T18:00:00.000Z',
        endsAt: '2026-11-01T20:00:00.000Z',
      })
    );

    expect(seo.schema.duration).toBe('P0Y0M0DT2H0M0S');
  });

  it.each([EventScheduleType.Weekly, EventScheduleType.Explicit])(
    'emits no duration for a %s event',
    scheduleType => {
      const seo = getEventSEO(mockEvent({ scheduleType }));

      expect(seo.schema.duration).toBeUndefined();
      expect(seo.schema.startDate).toBeDefined();
    }
  );

  it('does not throw without dates', () => {
    const seo = getEventSEO(mockEvent({ startsAt: null, endsAt: null }));

    expect(seo.schema.startDate).toBeUndefined();
    expect(seo.schema.endDate).toBeUndefined();
    expect(seo.schema.duration).toBeUndefined();
  });

  it('describes the event with the first paragraph of its description', () => {
    const seo = getEventSEO(
      mockEvent({
        description: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Ein Abend voller Musik.' }],
            },
          ],
        },
      })
    );

    expect(seo.description).toBe('Ein Abend voller Musik.');
  });

  it('works without a url or name', () => {
    const seo = getEventSEO(mockEvent({ url: null, name: null }));

    expect(seo.url).toBeUndefined();
    expect(seo.title).toBeUndefined();
  });

  it.each([
    [EventStatus.Confirmed, 'https://schema.org/EventScheduled'],
    [EventStatus.Cancelled, 'https://schema.org/EventCancelled'],
    [EventStatus.Postponed, 'https://schema.org/EventPostponed'],
    [EventStatus.SoldOut, 'https://schema.org/EventScheduled'],
  ])('maps %s to %s', (status, eventStatus) => {
    const seo = getEventSEO(mockEvent({ status }));

    expect(seo.schema.eventStatus).toBe(eventStatus);
  });

  it('marks a sold out event as sold out in its offers', () => {
    expect(
      getEventSEO(mockEvent({ status: EventStatus.SoldOut })).schema.offers
    ).toEqual({
      '@type': 'Offer',
      availability: 'https://schema.org/SoldOut',
    });
    expect(
      getEventSEO(mockEvent({ status: EventStatus.Confirmed })).schema.offers
    ).toBeUndefined();
  });
});
