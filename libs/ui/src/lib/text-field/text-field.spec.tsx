import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './text-field.stories';

const storiesCmp = composeStories(stories);

describe('TextField', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
