import { screen } from '@testing-library/react';
import {
  mockEvent,
  mockEventBlock,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { RichtextJSONDocument } from '@wepublish/richtext';
import { EventBlock } from './event-block';

const longText = 'a'.repeat(300);

const description = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Programme' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: longText }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Second paragraph' }],
    },
  ],
} as RichtextJSONDocument;

describe('EventBlock', () => {
  it('lists every event and links to it', () => {
    renderWithProviders(
      <EventBlock
        {...mockEventBlock({
          events: [
            mockEvent({ name: 'Concert', url: 'https://example.com/concert' }),
            mockEvent({ name: 'Reading', url: 'https://example.com/reading' }),
          ],
        })}
      />
    );

    expect(
      screen.getAllByRole('heading').map(heading => heading.textContent)
    ).toEqual(['Concert', 'Reading']);
    expect(
      screen.getAllByRole('link').map(link => link.getAttribute('href'))
    ).toEqual(['https://example.com/concert', 'https://example.com/reading']);
  });

  it('shortens the description to the first 255 characters of its first paragraph', () => {
    renderWithProviders(
      <EventBlock
        {...mockEventBlock({
          events: [mockEvent({ name: 'Concert', lead: null, description })],
        })}
      />
    );

    expect(screen.getByText('a'.repeat(255))).toBeInTheDocument();
    expect(screen.queryByText('Programme')).not.toBeInTheDocument();
    expect(screen.queryByText('Second paragraph')).not.toBeInTheDocument();
  });
});
