import { render } from '@testing-library/react';
import { composeStories } from '@storybook/react';
import * as stories from './block-template-block.stories';

const storiesCmp = composeStories(stories);

describe('Block Template Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
