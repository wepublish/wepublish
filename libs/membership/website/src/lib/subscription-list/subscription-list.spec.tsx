import { render } from '@testing-library/react';
import * as stories from './subscription-list.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('SubscriptionList', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
