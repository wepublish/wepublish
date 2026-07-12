import { render } from '@testing-library/react';
import * as stories from './memberplan-offer-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('MemberPlanOfferPicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
