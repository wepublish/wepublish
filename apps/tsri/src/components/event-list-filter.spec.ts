import {
  detectActiveEventFilter,
  eventListPageSchema,
  getDateBounds,
  getEventListFilter,
} from './event-list-filter';

describe('event-list-filter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-11T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDateBounds', () => {
    it('returns local midnight to end of day for today', () => {
      const bounds = getDateBounds('today');

      expect(new Date(bounds.from).getHours()).toBe(0);
      expect(new Date(bounds.from).getMinutes()).toBe(0);
      expect(new Date(bounds.to).getHours()).toBe(23);
      expect(new Date(bounds.to).getMinutes()).toBe(59);
      expect(new Date(bounds.from).getDate()).toBe(new Date().getDate());
    });

    it('offsets tomorrow by one day', () => {
      const bounds = getDateBounds('tomorrow');

      expect(new Date(bounds.from).getDate()).toBe(new Date().getDate() + 1);
      expect(new Date(bounds.to).getDate()).toBe(new Date().getDate() + 1);
    });

    it('spans 7 and 30 days from today', () => {
      const next7 = getDateBounds('next7');
      const next30 = getDateBounds('next30');
      const dayMs = 24 * 60 * 60 * 1000;

      expect(
        Math.round(
          (new Date(next7.to).getTime() - new Date(next7.from).getTime()) /
            dayMs
        )
      ).toBe(7);
      expect(
        Math.round(
          (new Date(next30.to).getTime() - new Date(next30.from).getTime()) /
            dayMs
        )
      ).toBe(30);
    });
  });

  describe('detectActiveEventFilter', () => {
    it('detects a preset range from exact bounds', () => {
      const bounds = getDateBounds('next7');

      expect(
        detectActiveEventFilter({
          from: new Date(bounds.from),
          to: new Date(bounds.to),
        })
      ).toBe('next7');
    });

    it('returns null for a custom range', () => {
      expect(
        detectActiveEventFilter({
          from: new Date('2026-01-01T00:00:00.000Z'),
          to: new Date('2026-02-01T00:00:00.000Z'),
        })
      ).toBeNull();
    });

    it('distinguishes all from upcoming', () => {
      expect(detectActiveEventFilter({ upcomingOnly: false })).toBe('all');
      expect(detectActiveEventFilter({ upcomingOnly: true })).toBe('upcoming');
      expect(detectActiveEventFilter({})).toBe('upcoming');
    });
  });

  describe('getEventListFilter', () => {
    it('prefers a date range over upcomingOnly', () => {
      const from = new Date('2026-09-11T00:00:00.000Z');
      const to = new Date('2026-09-12T00:00:00.000Z');

      expect(getEventListFilter({ from, to, upcomingOnly: false })).toEqual({
        from: from.toISOString(),
        to: to.toISOString(),
      });
    });

    it('returns an empty filter for all events', () => {
      expect(getEventListFilter({ upcomingOnly: false })).toEqual({});
    });

    it('defaults to upcoming only', () => {
      expect(getEventListFilter({})).toEqual({ upcomingOnly: true });
      expect(getEventListFilter({ upcomingOnly: true })).toEqual({
        upcomingOnly: true,
      });
    });
  });

  describe('eventListPageSchema', () => {
    it('defaults upcomingOnly to true and parses overrides', () => {
      expect(eventListPageSchema.parse({}).upcomingOnly).toBe(true);
      expect(
        eventListPageSchema.parse({ upcomingOnly: 'false' }).upcomingOnly
      ).toBe(false);
      expect(eventListPageSchema.parse({ page: '3' }).page).toBe(3);
    });
  });
});
