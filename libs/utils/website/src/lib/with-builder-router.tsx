import { ComponentType, memo } from 'react';
import { BuilderRouterContext } from '@wepublish/website/builder';
import { useRouter } from 'next/router';

export const withBuilderRouter = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const { query } = useRouter();

    return (
      <BuilderRouterContext.Provider value={{ query }}>
        <ControlledComponent {...(props as P)} />
      </BuilderRouterContext.Provider>
    );
  });
