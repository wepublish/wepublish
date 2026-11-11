import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { RedirectMoved } from './redirect-moved';

const Where = () => {
  const { pathname, search } = useLocation();

  return <p>{pathname + search}</p>;
};

const visit = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="articles/paywalls/*"
          element={
            <RedirectMoved
              from="/articles/paywalls"
              to="/audience-engagement/paywalls"
            />
          }
        />
        <Route
          path="*"
          element={<Where />}
        />
      </Routes>
    </MemoryRouter>
  );

describe('RedirectMoved', () => {
  it.each([
    ['/articles/paywalls', '/audience-engagement/paywalls'],
    ['/articles/paywalls/edit/abc', '/audience-engagement/paywalls/edit/abc'],
    [
      '/articles/paywalls/create?enforced=true',
      '/audience-engagement/paywalls/create?enforced=true',
    ],
  ])('sends %s on to %s', (from, to) => {
    visit(from);

    expect(screen.getByText(to)).toBeInTheDocument();
  });
});
