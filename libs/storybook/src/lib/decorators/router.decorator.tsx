import { BuilderRouterContext } from '@wepublish/website/builder';
import { ComponentProps, ComponentType } from 'react';

export const WithRouterDecorator =
  (
    props: ComponentProps<typeof BuilderRouterContext.Provider>['value'] = {
      query: {},
    }
  ) =>
  (Story: ComponentType) => {
    return (
      <BuilderRouterContext.Provider value={props}>
        <Story />
      </BuilderRouterContext.Provider>
    );
  };
