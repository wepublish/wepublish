import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './tsri-tabbed-content.stories';

const storiesCmp = composeStories(stories);

describe('Tabbed Content', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
