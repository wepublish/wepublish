import { render } from '@testing-library/react';
import * as stories from './lightbox.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Lightbox', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
