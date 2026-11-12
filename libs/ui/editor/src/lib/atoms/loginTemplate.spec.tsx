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

  it('puts the footer below the card, outside of it', () => {
    render(
      <ThemeProvider theme={theme}>
        <LoginTemplate footer={<button>Staff</button>}>
          <form aria-label="Login" />
        </LoginTemplate>
      </ThemeProvider>
    );

    const card = screen.getByRole('form').parentElement!;
    const footer = screen.getByRole('button', { name: 'Staff' });

    expect(screen.getByRole('main').contains(footer)).toBe(true);
    expect(card.contains(footer)).toBe(false);
    expect(
      card.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
