import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './author-list-item.stories';

const storiesCmp = composeStories(stories);

describe('AuthorList Item', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      render(<Component />);
    });
  });
});
