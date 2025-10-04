import { render } from '@testing-library/react';
import * as stories from './context-box.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Context Box', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
