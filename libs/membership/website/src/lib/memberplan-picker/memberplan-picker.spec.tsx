import { render } from '@testing-library/react';
import * as stories from './memberplan-picker.stories';
import { composeStories } from '@storybook/react';

const storiesCmp = composeStories(stories);

describe('MemberPlanPicker', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
