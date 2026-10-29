import { screen } from '@testing-library/react';
import {
  mockEvent,
  mockOperation,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { EventDocument } from '@wepublish/website/api';
import { EventContainer } from './event-container';

describe('EventContainer', () => {
  it('loads the event by id', async () => {
    const event = mockEvent({ name: 'Cool concert' });

    renderWithProviders(<EventContainer id={event.id} />, {
      mocks: [
        mockOperation(EventDocument, {
          variables: { id: event.id },
          data: { __typename: 'Query', event },
        }),
      ],
    });

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cool concert' })
    ).toBeInTheDocument();
  });
});
