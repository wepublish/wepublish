import { render, act } from '@testing-library/react';
import * as stories from './navbar.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Navbar', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);
      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
