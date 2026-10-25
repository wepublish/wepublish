import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { LoginTemplate } from './loginTemplate';

const theme = createTheme({ cssVariables: true });

describe('LoginTemplate', () => {
  it('puts the form into the main landmark', () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginTemplate>
          <form aria-label="Login" />
        </LoginTemplate>
      </ThemeProvider>
    );

    expect(screen.getByRole('main').contains(screen.getByRole('form'))).toBe(
      true
    );
  });

  it('renders the title as the page heading', () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginTemplate title="Login">
          <form aria-label="Login" />
        </LoginTemplate>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Login' })
    ).toBeTruthy();
  });
});
