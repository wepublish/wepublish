import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './tsri-v2-navbar.stories';

const storiesCmp = composeStories(stories);

describe('Navbar', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
