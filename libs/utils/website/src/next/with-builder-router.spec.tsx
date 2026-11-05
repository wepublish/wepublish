import { renderHook } from '@testing-library/react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { PropsWithChildren, useContext } from 'react';

import { withBuilderRouter } from './with-builder-router';

const router = {
  query: { slug: 'foo' },
  asPath: '/a/foo?page=2',
  push: vi.fn(async () => true),
  replace: vi.fn(async () => true),
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

const Wrapper = withBuilderRouter(({ children }: PropsWithChildren) => (
  <>{children}</>
));

const renderRouter = () =>
  renderHook(() => useContext(BuilderRouterContext), { wrapper: Wrapper })
    .result.current;

describe('withBuilderRouter', () => {
  beforeEach(() => {
    router.push.mockClear();
    router.replace.mockClear();
  });

  it('exposes the query and the path of next/router', () => {
    expect(renderRouter()).toMatchObject({
      query: { slug: 'foo' },
      asPath: '/a/foo?page=2',
    });
  });

  it('pushes an href by default', async () => {
    await renderRouter().navigate?.('/mitmachen?tag=news');

    expect(router.push).toHaveBeenCalledWith('/mitmachen?tag=news');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('replaces the history entry when asked to', async () => {
    await renderRouter().navigate?.('/profile', { replace: true });

    expect(router.replace).toHaveBeenCalledWith('/profile');
    expect(router.push).not.toHaveBeenCalled();
  });
});
