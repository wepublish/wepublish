import { fireEvent, render, screen } from '@testing-library/react';

import { ErrorPage } from './error-page';

const reportError = vi.fn();

vi.mock('../sentry/report-error', () => ({
  reportRenderError: (...args: unknown[]) => reportError(...args),
}));

vi.mock('@wepublish/website/builder', () => ({
  useWebsiteBuilder: () => ({
    elements: {
      H3: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
      Paragraph: ({ children }: { children: React.ReactNode }) => (
        <p>{children}</p>
      ),
      Button: ({
        children,
        onClick,
      }: {
        children: React.ReactNode;
        onClick?: () => void;
      }) => <button onClick={onClick}>{children}</button>,
    },
  }),
}));

describe('ErrorPage', () => {
  beforeEach(() => reportError.mockReset());

  it('tells the reader something went wrong', () => {
    render(
      <ErrorPage
        error={new Error('boom')}
        reset={vi.fn()}
      />
    );

    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('does not leak the error message to the reader', () => {
    render(
      <ErrorPage
        error={new Error('ECONNREFUSED 10.0.0.4:5432')}
        reset={vi.fn()}
      />
    );

    expect(screen.queryByText(/ECONNREFUSED/)).not.toBeInTheDocument();
  });

  it('reports the error so it is not silently swallowed', () => {
    const error = new Error('boom');

    render(
      <ErrorPage
        error={error}
        reset={vi.fn()}
      />
    );

    expect(reportError).toHaveBeenCalledWith(error);
  });

  it('lets the reader retry, which is what `reset` is for', () => {
    const reset = vi.fn();

    render(
      <ErrorPage
        error={new Error('boom')}
        reset={reset}
      />
    );
    fireEvent.click(screen.getByRole('button'));

    expect(reset).toHaveBeenCalled();
  });
});
