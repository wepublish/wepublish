import { render } from '@testing-library/react';
import * as stories from './sound-cloud-block.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('SoundCloud Track Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
