import { render } from '@testing-library/react';
import * as stories from './transaction-fee.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('TransactionFee', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      render(<Component />);
    });
  });
});
