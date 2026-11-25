import { screen } from '@testing-library/react';
import { mockEvent, renderWithProviders } from '@wepublish/mocks/website';

import { ganzgrazConfig } from '../ganzgraz-config';
import { GanzGrazEvent } from './ganzgraz-event';
import { GanzGrazEventListItem } from './ganzgraz-event-list-item';

// Tests run with TZ=UTC, like the server render. Dates must still be local
// (Graz/Zurich) time, or the server HTML and the browser render disagree.
const justAfterMidnightLocally = mockEvent({
  startsAt: '2026-11-27T23:30:00.000Z',
  endsAt: '2026-11-28T01:00:00.000Z',
});

describe('GanzGrazEvent', () => {
  it('shows day and times in local time', () => {
    renderWithProviders(
      <GanzGrazEvent
        data={{ __typename: 'Query', event: justAfterMidnightLocally }}
        loading={false}
        error={undefined}
      />,
      { tenant: ganzgrazConfig }
    );

    expect(screen.getByText('28. November 2026')).toBeInTheDocument();
    expect(screen.getByText('00:30')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });
});

describe('GanzGrazEventListItem', () => {
  it('shows the local start day and no end day when both are the same day there', () => {
    const { container } = renderWithProviders(
      <GanzGrazEventListItem
        {...justAfterMidnightLocally}
        url="/event/1"
      />,
      { tenant: ganzgrazConfig }
    );

    expect(
      Array.from(container.querySelectorAll('time'), time => time.textContent)
    ).toEqual(['28. November 2026']);
  });
});
