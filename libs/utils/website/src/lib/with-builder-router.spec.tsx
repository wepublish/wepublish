import { render } from '@testing-library/react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { useContext, useEffect } from 'react';
import { withBuilderRouter } from './with-builder-router';

const router = {
  pathname: '/[...slug]',
  query: { slug: ['abo'], periodicity: 'yearly' } as Record<
    string,
    string | string[]
  >,
  replace: vi.fn(),
};

vi.mock('next/router', () => ({
  useRouter: () => router,
}));

describe('withBuilderRouter', () => {
  it('provides the router query', () => {
    let query: unknown;

    const Component = withBuilderRouter(() => {
      query = useContext(BuilderRouterContext).query;

      return null;
    });

    render(<Component />);

    expect(query).toEqual(router.query);
  });

  it('replaces query params shallowly and removes undefined ones', () => {
    const Component = withBuilderRouter(() => {
      const { replaceQuery } = useContext(BuilderRouterContext);

      useEffect(() => {
        replaceQuery?.({ mode: 'gift', periodicity: undefined });
      }, [replaceQuery]);

      return null;
    });

    render(<Component />);

    expect(router.replace).toHaveBeenCalledWith(
      { pathname: '/[...slug]', query: { slug: ['abo'], mode: 'gift' } },
      undefined,
      { shallow: true, scroll: false }
    );
  });
});
