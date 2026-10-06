import {
  useNavigate,
  useParams,
  useRouterState,
  useSearch,
} from '@tanstack/react-router';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { PropsWithChildren, useMemo } from 'react';

export type QueryParams = Record<string, string | string[] | undefined>;

/**
 * `next/router`'s `router.query` was route params and search params merged into
 * one object. TanStack keeps them apart, so merge them back — several blocks in
 * `libs/block-content/website` (poll, subscribe) read the merged shape through
 * `BuilderRouterContext`.
 */
export const useQueryParams = (): QueryParams => {
  const params = useParams({ strict: false });
  const search = useSearch({ strict: false }) as QueryParams;

  return useMemo(
    () => ({ ...(params as QueryParams), ...search }),
    [params, search]
  );
};

/** `router.asPath` equivalent — pathname + search + hash. */
export const useAsPath = () =>
  useRouterState({
    select: state => state.location.href,
  });

/**
 * `router.replace({ query }, undefined, { shallow: true, scroll: true })`
 * equivalent. Only *search* params may be passed; route params are part of the
 * path in TanStack and changing them is a real navigation.
 *
 * There is no `shallow` flag: TanStack always re-runs the loaders of the
 * matches whose dependencies changed. Our list routes declare
 * `loaderDeps: ({ search }) => search`, so paging re-fetches on the server,
 * which is what the Next pages achieved by prefetching page 1 and letting
 * Apollo fetch the rest client side.
 */
export const useReplaceSearch = () => {
  const navigate = useNavigate();

  return (
    updater: (previous: Record<string, unknown>) => Record<string, unknown>,
    options?: { resetScroll?: boolean }
  ) =>
    navigate({
      to: '.',
      search: updater as never,
      replace: true,
      resetScroll: options?.resetScroll ?? true,
    });
};

/** Replacement for `withBuilderRouter` from `@wepublish/utils/website`. */
export const BuilderRouterProvider = ({ children }: PropsWithChildren) => {
  const query = useQueryParams();
  const value = useMemo(() => ({ query }), [query]);

  return (
    <BuilderRouterContext.Provider value={value}>
      {children}
    </BuilderRouterContext.Provider>
  );
};
