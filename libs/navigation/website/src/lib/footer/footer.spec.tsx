import { render } from '@testing-library/react';
import * as stories from './footer.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Footer', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
