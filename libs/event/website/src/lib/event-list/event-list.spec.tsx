import { render } from '@testing-library/react';
import * as stories from './event-list.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('EventList', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
