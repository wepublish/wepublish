import { render } from '@testing-library/react';
import * as stories from './comment-editor.stories';
import { composeStories } from '@storybook/react';
import { MockedProvider } from '@apollo/client/testing';

// Compose stories
const storiesCmp = composeStories(stories);

describe('CommentEditor', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(
        <MockedProvider>
          <Component />
        </MockedProvider>
      );
    });
  });
});
