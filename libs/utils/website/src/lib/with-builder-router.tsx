import {
  ComponentType,
  createElement,
  memo,
  useCallback,
  useMemo,
} from 'react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { useRouter } from 'next/router';

export const withBuilderRouter = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const router = useRouter();
    const { query } = router;

    const replaceQuery = useCallback(
      (changes: Record<string, string | undefined>) => {
        const nextQuery = { ...router.query };

        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined) {
            delete nextQuery[key];
          } else {
            nextQuery[key] = value;
          }
        }

        router.replace(
          { pathname: router.pathname, query: nextQuery },
          undefined,
          { shallow: true, scroll: false }
        );
      },
      [router]
    );

    const contextValue = useMemo(
      () => ({ query, replaceQuery }),
      [query, replaceQuery]
    );

    return (
      <BuilderRouterContext.Provider value={contextValue}>
        {createElement(ControlledComponent, props as P)}
      </BuilderRouterContext.Provider>
    );
  });
