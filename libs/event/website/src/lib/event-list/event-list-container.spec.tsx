import { screen } from '@testing-library/react';
import {
  mockEvent,
  mockOperation,
  mockPaginated,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { EventListDocument } from '@wepublish/website/api';
import { EventListContainer } from './event-list-container';

describe('EventListContainer', () => {
  it('loads the events with the given variables and lists them', async () => {
    renderWithProviders(<EventListContainer variables={{ take: 2 }} />, {
      mocks: [
        mockOperation(EventListDocument, {
          variables: { take: 2 },
          data: {
            __typename: 'Query',
            events: mockPaginated('PaginatedEvents', [
              mockEvent({ name: 'Concert' }),
              mockEvent({ name: 'Reading' }),
            ]),
          },
        }),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: 'Concert' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Reading' })
    ).toBeInTheDocument();
  });
});
