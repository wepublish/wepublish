import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './icon-button.stories';

const storiesCmp = composeStories(stories);

describe('IconButton', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
