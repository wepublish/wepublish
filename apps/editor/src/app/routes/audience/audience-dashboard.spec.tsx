import '@testing-library/jest-dom';

import { MockedProvider } from '@apollo/client/testing';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { composeStories } from '@storybook/react';
import { act, render } from '@testing-library/react';
import { theme } from '@wepublish/ui';
import {
  actWait,
  AuthContext,
  FacebookProvider,
  InstagramProvider,
  sessionWithPermissions,
  TwitterProvider,
} from '@wepublish/ui/editor';
import { IconContext } from 'react-icons';
import { BrowserRouter } from 'react-router-dom';

import * as stories from './audience-dashboard.stories';

const storiesCmp = composeStories(stories);

describe('Audience dashboard', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const { container } = render(
        <IconContext.Provider value={{ className: 'rs-icon' }}>
          <FacebookProvider sdkLanguage={'en_US'}>
            <InstagramProvider>
              <TwitterProvider>
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <AuthContext.Provider value={sessionWithPermissions}>
                    <MockedProvider {...Component.parameters?.apolloClient}>
                      <BrowserRouter>
                        <Component />
                      </BrowserRouter>
                    </MockedProvider>
                  </AuthContext.Provider>
                </ThemeProvider>
              </TwitterProvider>
            </InstagramProvider>
          </FacebookProvider>
        </IconContext.Provider>
      );

      await actWait();

      if (Component.play) {
        await act(() => Component.play?.({ canvasElement: container }));
      }
    });
  });
});
