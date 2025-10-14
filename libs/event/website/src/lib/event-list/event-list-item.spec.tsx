import { render } from '@testing-library/react';
import * as stories from './event-list-item.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('EventListItem', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
