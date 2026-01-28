import { render } from '@testing-library/react';
import * as stories from './youtube-video-block.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('YouTube Video Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
