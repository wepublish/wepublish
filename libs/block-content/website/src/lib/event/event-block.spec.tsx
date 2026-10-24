import { render } from '@testing-library/react';
import * as stories from './event-block.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Event Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });

  it('renders nothing when no event is left', () => {
    const { container } = render(<storiesCmp.WithoutEvents />);

    expect(container.querySelector('aside')).toBeNull();
  });
});
