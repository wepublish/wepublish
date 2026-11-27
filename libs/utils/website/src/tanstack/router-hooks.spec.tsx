import { renderHook } from '@testing-library/react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { PropsWithChildren, useContext } from 'react';

import { BuilderRouterProvider } from './router-hooks';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useParams: () => ({ slug: 'foo' }),
  useSearch: () => ({ page: '2' }),
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { href: '/a/foo?page=2' } }),
}));

const wrapper = ({ children }: PropsWithChildren) => (
  <BuilderRouterProvider>{children}</BuilderRouterProvider>
);

const renderRouter = () =>
  renderHook(() => useContext(BuilderRouterContext), { wrapper }).result
    .current;

describe('BuilderRouterProvider', () => {
  beforeEach(() => navigate.mockClear());

  it('merges params and search into the query and exposes the path', () => {
    expect(renderRouter()).toMatchObject({
      query: { slug: 'foo', page: '2' },
      asPath: '/a/foo?page=2',
    });
  });

  it('navigates to an href by splitting it into path, search and hash', () => {
    renderRouter().navigate?.('/mitmachen?upgradeSubscriptionId=sub-1#form', {
      replace: true,
    });

    expect(navigate).toHaveBeenCalledWith({
      to: '/mitmachen',
      search: { upgradeSubscriptionId: 'sub-1' },
      hash: 'form',
      replace: true,
    });
  });

  it('pushes a plain path without search by default', () => {
    renderRouter().navigate?.('/a/foo');

    expect(navigate).toHaveBeenCalledWith({
      to: '/a/foo',
      search: {},
      replace: false,
    });
  });
});
