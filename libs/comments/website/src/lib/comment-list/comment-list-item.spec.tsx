import { act, render } from '@testing-library/react';
import * as stories from './comment-list-item.stories';
import { composeStories } from '@storybook/react';

// Excluded because of a bug. See more here https://github.com/storybookjs/storybook/issues/23410
const { CommentingWithError, EditingWithError, ...storiesCmp } =
  composeStories(stories);

describe('Comment List Item', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
