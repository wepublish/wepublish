import { render } from '@testing-library/react';
import * as stories from './periodicity-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('PeriodicityPicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
