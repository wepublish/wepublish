import { MockedProvider } from '@apollo/client/testing';
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './event-container.stories';

const storiesCmp = composeStories(stories);

describe('Event Container', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      );
    });
  });
});
