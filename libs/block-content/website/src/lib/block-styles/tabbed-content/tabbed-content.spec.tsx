import { render } from '@testing-library/react';
import * as stories from './tabbed-content.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Tabbed Content', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
