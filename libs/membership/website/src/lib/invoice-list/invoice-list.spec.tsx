import { render } from '@testing-library/react';
import * as stories from './invoice-list.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('InvoiceList', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
