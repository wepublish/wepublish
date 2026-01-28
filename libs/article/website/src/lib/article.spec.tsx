import { render } from '@testing-library/react';
import * as stories from './article.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Article', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
