import { render } from '@testing-library/react';
import * as stories from './tik-tok-video-block.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('TikTok Video Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
