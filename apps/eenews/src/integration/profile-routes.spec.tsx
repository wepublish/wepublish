import { render, screen } from '@testing-library/react';
import { ComponentType } from 'react';

import { Route as Profile } from '../routes/profile/index';
import { Route as Rechnungen } from '../routes/profile/rechnungen';
import { Route as Subscription } from '../routes/profile/subscription/$id';

/**
 * The Next profile pages rendered ee-news's own components inside
 * `EenewsPageShell` (which gives them their spacing below the navbar), behind
 * the auth guard. Both mocks render a marker so the nesting can be asserted
 * without a router, a session or data.
 */
vi.mock(
  '../../../../libs/utils/website/src/tanstack/auth-guard',
  async importOriginal => ({
    ...(await importOriginal<object>()),
    withAuthGuard: (Cmp: ComponentType) =>
      function Guarded() {
        return (
          <div data-testid="auth-guard">
            <Cmp />
          </div>
        );
      },
  })
);

vi.mock('@wepublish/tenant/eenews', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/tenant/eenews')>()),
  EenewsPageShell: () => <div data-testid="eenews-page-shell" />,
}));

describe('ee-news profile routes', () => {
  it.each([
    ['/profile', Profile],
    ['/profile/rechnungen', Rechnungen],
    ['/profile/subscription/$id', Subscription],
  ])('renders %s inside EenewsPageShell behind the auth guard', (_, route) => {
    const Component = route.options.component as ComponentType;

    render(<Component />);

    expect(
      screen
        .getByTestId('auth-guard')
        .contains(screen.getByTestId('eenews-page-shell'))
    ).toBe(true);
  });
});
