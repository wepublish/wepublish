import { MockedProvider } from '@apollo/client/testing';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';

import * as stories from './tsri-v2-navbar.stories';

jest.mock('next/font/google', () => ({
  Hanken_Grotesk: () => ({
    style: {
      fontFamily: 'mocked',
    },
  }),
}));

const storiesCmp = composeStories(stories);

describe('TsriV2Navbar', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      );
    });
  });
});
