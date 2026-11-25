import { screen } from '@testing-library/react';
import { mockEvent, renderWithProviders } from '@wepublish/mocks/website';

import { tsriTenant } from '../tsri-tenant';
import { TsriEvent } from './tsri-event';
import { TsriEventListItem } from './tsri-event-list-item';

// Tests run with TZ=UTC, like the server render. Dates must still be Zurich time,
// or the server HTML and the browser render disagree.
const justAfterMidnightInZurich = mockEvent({
  startsAt: '2026-11-27T23:30:00.000Z',
  endsAt: '2026-11-28T01:00:00.000Z',
});

describe('TsriEvent', () => {
  it('shows start and end in Zurich time', () => {
    renderWithProviders(
      <TsriEvent
        data={{ __typename: 'Query', event: justAfterMidnightInZurich }}
        loading={false}
        error={undefined}
      />,
      { tenant: tsriTenant }
    );

    expect(screen.getByText('28. November 2026 | 00:30')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });
});

describe('TsriEventListItem', () => {
  it('shows the Zurich start day and no end day when both are the same day there', () => {
    const { container } = renderWithProviders(
      <TsriEventListItem
        {...justAfterMidnightInZurich}
        url="/event/1"
      />,
      { tenant: tsriTenant }
    );

    expect(
      Array.from(container.querySelectorAll('time'), time => time.textContent)
    ).toEqual(['28. November 2026']);
  });
});
