import { screen } from '@testing-library/react';
import {
  mockEvent,
  mockImage,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullEventFragment } from '@wepublish/website/api';
import { EventListItem } from './event-list-item';

const renderItem = (event: FullEventFragment) =>
  renderWithProviders(<EventListItem {...event} />);

const times = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('time'), time =>
    time.getAttribute('dateTime')
  );

describe('EventListItem', () => {
  it('links the whole entry to the event and shows name, lead and image', () => {
    renderItem(
      mockEvent({
        name: 'Cool concert',
        lead: 'An evening of jazz.',
        url: 'https://example.com/event/cool-concert',
        image: mockImage({ description: 'Band on stage' }),
      })
    );

    const link = screen.getByRole('link');

    expect(link).toHaveAttribute(
      'href',
      'https://example.com/event/cool-concert'
    );
    expect(
      screen.getByRole('heading', { name: 'Cool concert' })
    ).toBeInTheDocument();
    expect(screen.getByText('An evening of jazz.')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Band on stage' })
    ).toBeInTheDocument();
  });

  it('shows the description instead of the lead when there is no lead', () => {
    renderItem(
      mockEvent({
        lead: null,
        description: mockRichTextParagraph('Bring your friends.'),
      })
    );

    expect(screen.getByText('Bring your friends.')).toBeInTheDocument();
  });

  it('prefers the lead over the description', () => {
    renderItem(
      mockEvent({
        lead: 'An evening of jazz.',
        description: mockRichTextParagraph('Bring your friends.'),
      })
    );

    expect(screen.queryByText('Bring your friends.')).not.toBeInTheDocument();
  });

  it('shows when the event starts and ends', () => {
    const { container } = renderItem(
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
    const { container } = renderItem(
      mockEvent({ startsAt: '2023-01-01T18:00:00.000Z', endsAt: null })
    );

    expect(times(container)).toEqual(['2023-01-01T18:00:00.000Z']);
  });

  it('leaves out the image when the event has none', () => {
    const { container } = renderItem(mockEvent({ image: null }));

    expect(container.querySelector('img')).toBeNull();
  });
});
