import { render } from '@testing-library/react';
import * as stories from './event.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Event', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
