import { render } from '@testing-library/react';
import * as stories from './image.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Image', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
