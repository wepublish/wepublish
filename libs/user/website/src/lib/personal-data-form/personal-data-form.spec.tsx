import { act, render } from '@testing-library/react';
import * as stories from './personal-data-form.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('Registration Form', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(<Component />);

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
