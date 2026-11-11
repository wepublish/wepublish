import { screen } from '@testing-library/react';
import {
  mockEvent,
  mockImage,
  mockPaginated,
  mockRichTextParagraph,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { FullEventFragment } from '@wepublish/website/api';
import { EventList } from './event-list';

const renderList = (
  events: FullEventFragment[] | null,
  descriptionMaxLength?: number
) =>
  renderWithProviders(
    <EventList
      data={
        events ?
          {
            __typename: 'Query',
            events: mockPaginated('PaginatedEvents', events),
          }
        : undefined
      }
      loading={!events}
      error={undefined}
      descriptionMaxLength={descriptionMaxLength}
    />
  );

describe('EventList', () => {
  it('lists every event in order, each linking to its page', () => {
    renderList([
      mockEvent({ name: 'Concert', url: 'https://example.com/concert' }),
      mockEvent({ name: 'Reading', url: 'https://example.com/reading' }),
      mockEvent({ name: 'Market', url: 'https://example.com/market' }),
    ]);

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Concert', 'Reading', 'Market']);
    expect(
      screen.getAllByRole('link').map(link => link.getAttribute('href'))
    ).toEqual([
      'https://example.com/concert',
      'https://example.com/reading',
      'https://example.com/market',
    ]);
  });

  it('shows images only for events that have one', () => {
    renderList([
      mockEvent({ image: mockImage({ description: 'Poster' }) }),
      mockEvent({ image: null }),
      mockEvent({ image: null }),
    ]);

    expect(screen.getAllByRole('img', { name: 'Poster' })).toHaveLength(1);
    expect(document.querySelectorAll('img')).toHaveLength(1);
  });

  it('cuts the description shown in place of a missing lead to the maximum length', () => {
    renderList(
      [
        mockEvent({
          lead: null,
          description: mockRichTextParagraph('Bring your friends and family.'),
        }),
      ],
      16
    );

    expect(screen.getByText('Bring your frien')).toBeInTheDocument();
    expect(
      screen.queryByText('Bring your friends and family.')
    ).not.toBeInTheDocument();
  });

  it('lists nothing while the events are loading', () => {
    renderList(null);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
