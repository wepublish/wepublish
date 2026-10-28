import { screen } from '@testing-library/react';
import {
  mockEvent,
  mockImage,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullEventFragment } from '@wepublish/website/api';
import { Event } from './event';

const renderEvent = (event: FullEventFragment | null) =>
  renderWithProviders(
    <Event
      data={event ? { __typename: 'Query', event } : undefined}
      loading={false}
      error={undefined}
    />
  );

const times = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('time'), time =>
    time.getAttribute('dateTime')
  );

describe('Event', () => {
  it('shows the name, location, description and image of the event', () => {
    renderEvent(
      mockEvent({
        name: 'Cool concert',
        location: 'Kaserne Basel',
        description: mockRichTextParagraph('Bring your friends.'),
        image: mockImage({ description: 'Band on stage' }),
      })
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cool concert' })
    ).toBeInTheDocument();
    expect(screen.getByText('Kaserne Basel')).toBeInTheDocument();
    expect(screen.getByText('Bring your friends.')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Band on stage' })
    ).toBeInTheDocument();
  });

  it('shows when the event starts and ends', () => {
    const { container } = renderEvent(
      mockEvent({
        startsAt: '2023-01-01T18:00:00.000Z',
        endsAt: '2023-01-01T23:00:00.000Z',
      })
    );

    expect(times(container)).toEqual([
      '2023-01-01T18:00:00.000Z',
      '2023-01-01T23:00:00.000Z',
    ]);
  });

  it('shows only the start when the event has no end', () => {
    const { container } = renderEvent(
      mockEvent({ startsAt: '2023-01-01T18:00:00.000Z', endsAt: null })
    );

    expect(times(container)).toEqual(['2023-01-01T18:00:00.000Z']);
  });

  it('says the venue is not known yet when the event has no location', () => {
    renderEvent(mockEvent({ location: null }));

    expect(
      screen.getByText('Veranstaltungsort noch nicht bekannt')
    ).toBeInTheDocument();
  });

  it('leaves out the image when the event has none', () => {
    const { container } = renderEvent(mockEvent({ image: null }));

    expect(container.querySelector('img')).toBeNull();
  });
});
