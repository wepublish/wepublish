import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './layout-slots.stories';

jest.mock('next/font/google', () => ({
  Hanken_Grotesk: () => ({
    style: {
      fontFamily: 'mocked',
    },
  }),
}));

const storiesCmp = composeStories(stories);

describe('Teaser Layouts/No Image Alt Color (', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />);
    });
  });
});
