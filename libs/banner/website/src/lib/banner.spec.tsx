import { render } from '@testing-library/react';
import * as stories from './banner.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Banner', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
