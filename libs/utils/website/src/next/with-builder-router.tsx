import { ComponentType, createElement, memo, useMemo } from 'react';
import {
  BuilderRouterContext,
  BuilderRouterNavigateOptions,
} from '@wepublish/website/builder';
import { useRouter } from 'next/router';

export const withBuilderRouter = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const { query, asPath, push, replace } = useRouter();

    const contextValue = useMemo(
      () => ({
        query,
        asPath,
        navigate: (href: string, options: BuilderRouterNavigateOptions = {}) =>
          options.replace ? replace(href) : push(href),
      }),
      [query, asPath, push, replace]
    );

    return (
      <BuilderRouterContext.Provider value={contextValue}>
        {createElement(ControlledComponent, props as P)}
      </BuilderRouterContext.Provider>
    );
  });
