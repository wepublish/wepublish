import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';

import { PageTitle } from './pageTitle';

const theme = createTheme({
  cssVariables: true,
  typography: { h1: { fontSize: '30px' }, h2: { fontSize: '24px' } },
});

describe('PageTitle', () => {
  it('is the page heading at the h2 size', () => {
    render(
      <ThemeProvider theme={theme}>
        <PageTitle>Tags</PageTitle>
      </ThemeProvider>
    );

    const heading = screen.getByRole('heading', { name: 'Tags', level: 1 });

    expect(getComputedStyle(heading).fontSize).toBe('24px');
  });
});
