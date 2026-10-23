import { render, screen } from '@testing-library/react';
import * as stories from './event.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Event', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('renders the blocks of the latest revision', () => {
    render(<storiesCmp.Default />);

    expect(screen.getByText('Text aus den Blöcken')).toBeTruthy();
  });

  it('falls back to the description without a revision', () => {
    const { container } = render(<storiesCmp.WithoutRevision />);

    expect(screen.queryByText('Text aus den Blöcken')).toBeNull();
    expect(container.textContent?.length).toBeGreaterThan(0);
  });

  it('renders no date without dates', () => {
    const { container } = render(<storiesCmp.WithoutNameAndDates />);

    expect(container.querySelector('time')).toBeNull();
  });

  it('shows the status of a cancelled event', () => {
    render(<storiesCmp.Cancelled />);

    expect(screen.getByText('Abgesagt')).toBeTruthy();
  });
});
