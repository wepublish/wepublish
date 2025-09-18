import { render } from '@testing-library/react';
import * as stories from './author-links.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Author Links', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
