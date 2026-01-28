import { act, render } from '@testing-library/react';
import * as stories from './comment-list.stories';
import { composeStories } from '@storybook/react';

// Excluded because of a bug. See more here https://github.com/storybookjs/storybook/issues/23410
const { AnonymousCommentingOpen, CommentingOpen, ...storiesCmp } =
  composeStories(stories);

describe('Comment List', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
