import { render } from '@testing-library/react';
import * as stories from './html-block.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('HTML Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
