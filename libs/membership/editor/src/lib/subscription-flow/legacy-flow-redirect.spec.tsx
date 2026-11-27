import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { LegacyFlowRedirect } from './legacy-flow-redirect';

const Where = () => {
  const { pathname, search } = useLocation();

  return <p>{`${pathname}${search}`}</p>;
};

const open = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="communicationflows/edit/:id"
          element={<LegacyFlowRedirect />}
        />
        <Route
          path="*"
          element={<Where />}
        />
      </Routes>
    </MemoryRouter>
  );

describe('LegacyFlowRedirect', () => {
  it('sends the old address of the default flow to its page', () => {
    open('/communicationflows/edit/default');

    expect(screen.getByText('/communicationflows/flow/default')).toBeTruthy();
  });

  it('sends the old page of a member plan to the overview narrowed to that plan', () => {
    open('/communicationflows/edit/plan-1');

    expect(
      screen.getByText('/communicationflows?memberPlan=plan-1')
    ).toBeTruthy();
  });
});
