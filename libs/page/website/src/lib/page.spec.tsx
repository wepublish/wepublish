import { render } from '@testing-library/react';
import * as stories from './page.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Page', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
