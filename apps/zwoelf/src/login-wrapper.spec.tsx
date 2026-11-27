import { ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';
import { theme } from '@wepublish/ui';
import { LoginWrapper } from './login-wrapper';

describe('LoginWrapper', () => {
  // The old login form had a checkbox under the title that spaced it from
  // the form; without it the title sat right on the email field.
  it('keeps the title apart from the login form', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <LoginWrapper>
          <h1>Login für Member</h1>
          <form />
        </LoginWrapper>
      </ThemeProvider>
    );

    expect(getComputedStyle(container.firstElementChild as Element).gap).toBe(
      theme.spacing(5)
    );
  });
});
