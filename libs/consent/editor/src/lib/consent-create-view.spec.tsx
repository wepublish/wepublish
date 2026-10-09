import React from 'react';
import { render } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';

import { ConsentCreateView } from './consent-create-view';
import { BrowserRouter } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme();

vi.mock('node-fetch', () => ({ default: vi.fn() }));

describe('ConsentCreateView', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <MockedProvider>
            <ConsentCreateView />
          </MockedProvider>
        </BrowserRouter>
      </ThemeProvider>
    );
    expect(baseElement).toBeTruthy();
  });
});
