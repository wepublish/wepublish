import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import { WithWebsiteBuilderProvider } from '../with-website-builder-provider';
import * as stories from './tsri-tabbed-content.stories';

jest.mock('next/font/google', () => ({
  Hanken_Grotesk: () => ({
    style: {
      fontFamily: 'mocked',
    },
  }),
}));

const storiesCmp = composeStories(stories);

describe('Tabbed Content', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(
        <WithWebsiteBuilderProvider>
          <Component />
        </WithWebsiteBuilderProvider>
      );
    });
  });
});
