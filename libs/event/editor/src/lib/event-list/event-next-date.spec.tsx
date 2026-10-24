import { render, screen } from '@testing-library/react';
import { EventScheduleType } from '@wepublish/editor/api';

import { EventNextDate } from './event-next-date';
import { listItem, renderWith, translate } from './test-helpers';

vi.mock('react-i18next', async () =>
  (await import('./test-translate')).i18nMock()
);

const now = new Date('2026-10-23T12:00:00.000Z');

const renderDate = (overrides: Parameters<typeof listItem>[0]) =>
  render(
    renderWith(
      <EventNextDate
        event={listItem(overrides)}
        now={now}
      />
    )
  );

describe('EventNextDate', () => {
  it('shows the next date in Zurich time and the remaining dates inline', () => {
    renderDate({ upcomingOccurrenceCount: 4 });

    expect(screen.getByText('Wed 26 May, 19:00')).toBeTruthy();
    expect(
      screen.getByText(translate('agenda.list.moreDates', { count: 3 }))
    ).toBeTruthy();
  });

  it('says nothing about more dates for a single date', () => {
    renderDate({ upcomingOccurrenceCount: 1 });

    expect(screen.queryByText(/agenda\.list\.moreDates/)).toBeNull();
  });

  it('says so when no date is left', () => {
    renderDate({ nextOccurrence: null, upcomingOccurrenceCount: 0 });

    expect(screen.getByText('agenda.list.noUpcomingDates')).toBeTruthy();
  });

  it('warns when a weekly series ends within 30 days', () => {
    renderDate({
      scheduleType: EventScheduleType.Weekly,
      lastDateAt: '2026-11-04T12:00:00.000Z',
    });

    expect(
      screen.getByText(translate('agenda.list.endsIn', { count: 12 }))
    ).toBeTruthy();
  });

  it('says a weekly series ends today on its last day', () => {
    renderDate({
      scheduleType: EventScheduleType.Weekly,
      lastDateAt: '2026-10-23T18:00:00.000Z',
    });

    expect(screen.getByText('agenda.list.endsToday')).toBeTruthy();
  });

  it('gives no warning for a single concert ending soon', () => {
    renderDate({ lastDateAt: '2026-11-04T12:00:00.000Z' });

    expect(screen.queryByText(/agenda\.list\.endsIn/)).toBeNull();
  });
});
