import { createTheme, ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { ReactNode } from 'react';

import { RouteErrorBoundary } from './routeErrorBoundary';

const CONTENT = 'the page';

const Boom = (): ReactNode => {
  throw new Error('the panel exploded');
};

const renderBoundary = (children: ReactNode) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <RouteErrorBoundary>{children}</RouteErrorBoundary>
    </ThemeProvider>
  );

describe('RouteErrorBoundary', () => {
  beforeEach(() =>
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  );
  afterEach(() => vi.restoreAllMocks());

  it('shows what it was given when nothing goes wrong', () => {
    renderBoundary(<p>{CONTENT}</p>);

    expect(screen.getByText(CONTENT)).toBeInTheDocument();
  });

  it('keeps the rest of the editor on screen when a route throws', () => {
    renderBoundary(<Boom />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('names the error so it can be reported', () => {
    renderBoundary(<Boom />);

    expect(screen.getByRole('alert')).toHaveTextContent('the panel exploded');
  });

  it('offers a way out', () => {
    renderBoundary(<Boom />);

    expect(
      screen.getByRole('button', { name: /errorBoundary.reload/ })
    ).toBeInTheDocument();
  });
});
