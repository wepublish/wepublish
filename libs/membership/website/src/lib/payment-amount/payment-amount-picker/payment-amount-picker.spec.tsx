import { render } from '@testing-library/react';
import * as stories from './payment-amount-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('PaymentAmountPicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
