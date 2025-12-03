import { MockedProvider } from '@apollo/client/testing';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import { WithWebsiteBuilderProvider } from '../with-website-builder-provider';
import * as stories from './tsri-v2-navbar.stories';

jest.mock('next/font/google', () => ({
  Hanken_Grotesk: () => ({
    style: {
      fontFamily: 'mocked',
    },
  }),
}));

const storiesCmp = composeStories(stories);

describe('Navbar', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <WithWebsiteBuilderProvider>
            <Component />
          </WithWebsiteBuilderProvider>
        </MockedProvider>
      );
    });
  });
});
