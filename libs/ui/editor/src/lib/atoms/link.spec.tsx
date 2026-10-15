import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Link } from './link';

const theme = createTheme({ cssVariables: true });

const renderLink = (ui: React.ReactNode) =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );

describe('Link', () => {
  it('routes rather than reloading the page', () => {
    renderLink(<Link to="/authors/edit/1">Melina</Link>);

    expect(screen.getByRole('link', { name: 'Melina' })).toHaveAttribute(
      'href',
      '/authors/edit/1'
    );
  });

  it('carries the MUI link styling', () => {
    renderLink(<Link to="/authors">Authors</Link>);

    expect(screen.getByRole('link', { name: 'Authors' })).toHaveClass(
      'MuiLink-root'
    );
  });

  it('passes its own props through', () => {
    renderLink(
      <Link
        to="/authors"
        underline="none"
        aria-label="all authors"
      >
        Authors
      </Link>
    );

    expect(screen.getByRole('link', { name: 'all authors' })).toHaveClass(
      'MuiLink-underlineNone'
    );
  });
});
