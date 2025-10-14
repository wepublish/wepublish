import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './text-to-icon.stories';

const storiesCmp = composeStories(stories);

describe('TextToIcon', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
