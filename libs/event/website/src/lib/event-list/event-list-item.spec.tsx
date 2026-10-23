import { render, screen } from '@testing-library/react';
import * as stories from './event-list-item.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('EventListItem', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('shows no status badge for a confirmed event', () => {
    const { container } = render(<storiesCmp.Default />);

    expect(container.querySelector('[data-event-status]')).toBeNull();
  });

  it.each([
    ['Cancelled', 'Abgesagt'],
    ['Postponed', 'Verschoben'],
    ['SoldOut', 'Ausverkauft'],
  ] as const)('labels a %s event as %s', (story, label) => {
    const Component = storiesCmp[story];
    render(<Component />);

    expect(screen.getByText(label)).toBeTruthy();
  });

  it('renders no date when the event has none', () => {
    const { container } = render(<storiesCmp.WithoutDates />);

    expect(container.querySelector('time')).toBeNull();
  });
});
