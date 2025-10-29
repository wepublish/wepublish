import { render } from '@testing-library/react';
import * as stories from './blocks.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Blocks', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
