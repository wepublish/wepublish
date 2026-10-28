import { ComponentType, createElement, memo, useMemo } from 'react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { useRouter } from 'next/router';

export const withBuilderRouter = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const { query } = useRouter();

    const contextValue = useMemo(() => ({ query }), [query]);

    return (
      <BuilderRouterContext.Provider value={contextValue}>
        {createElement(ControlledComponent, props as P)}
      </BuilderRouterContext.Provider>
    );
  });
