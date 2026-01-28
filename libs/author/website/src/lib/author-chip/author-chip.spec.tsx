import { render } from '@testing-library/react';
import * as stories from './author-chip.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Author Chip', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
