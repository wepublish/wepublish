import { render } from '@testing-library/react';
import * as stories from './article-author.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('ArticleAuthor', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
