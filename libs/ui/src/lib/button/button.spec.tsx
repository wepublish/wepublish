import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './button.stories';

const storiesCmp = composeStories(stories);

describe('Button', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
