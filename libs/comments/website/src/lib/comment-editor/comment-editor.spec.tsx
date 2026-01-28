import { render } from '@testing-library/react';
import * as stories from './comment-editor.stories';
import { composeStories } from '@storybook/react';
import { ThemeProvider } from '@mui/material/styles';
import { MockedProvider } from '@apollo/client/testing';
import { theme } from '@wepublish/ui';

// Compose stories
const storiesCmp = composeStories(stories);

describe('CommentEditor', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(
        <MockedProvider>
          <ThemeProvider theme={theme}>
            <Component />
          </ThemeProvider>
        </MockedProvider>
      );
    });
  });
});
