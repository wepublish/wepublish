import { render, screen } from '@testing-library/react';
import { ComponentType } from 'react';

import { Route as PageById } from '../routes/id/$id';
import { Route as Login } from '../routes/login';
import { Route as Mitmachen } from '../routes/mitmachen';
import { Route as Deactivated } from '../routes/profile/subscription/deactivated';
import { Route as PageBySlug } from '../routes/$slug';
import { Route as Search } from '../routes/search';
import { Route as Signup } from '../routes/signup';

/**
 * The Next pages wrapped these in `EenewsPageShell` (max width + padding);
 * without it the content runs edge to edge. The mock drops the children so the
 * route components render without a router or their data.
 */
vi.mock('@wepublish/tenant/eenews', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/tenant/eenews')>()),
  EenewsPageShell: () => <div data-testid="eenews-page-shell" />,
}));

describe('ee-news page shell', () => {
  it.each([
    ['/mitmachen', Mitmachen],
    ['/login', Login],
    ['/signup', Signup],
    ['/$slug', PageBySlug],
    ['/id/$id', PageById],
    ['/profile/subscription/deactivated', Deactivated],
    ['/search', Search],
  ])('wraps %s in EenewsPageShell', (_path, route) => {
    const Component = route.options.component as ComponentType;

    render(<Component />);

    expect(screen.getByTestId('eenews-page-shell')).toBeDefined();
  });
});
