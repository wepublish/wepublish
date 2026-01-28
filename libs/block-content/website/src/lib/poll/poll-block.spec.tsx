import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';

import * as stories from './poll-block.stories';

const storiesCmp = composeStories(stories);

describe('Poll Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
