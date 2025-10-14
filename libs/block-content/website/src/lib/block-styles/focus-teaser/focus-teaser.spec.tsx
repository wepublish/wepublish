import { render } from '@testing-library/react';
import * as stories from './focus-teaser.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Focus Teaser', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
