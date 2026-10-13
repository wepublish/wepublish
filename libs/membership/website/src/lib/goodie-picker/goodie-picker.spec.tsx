import { render } from '@testing-library/react';
import * as stories from './goodie-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('GoodiePicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
