import {
  BuilderRouterContext,
  noopBuilderRouterEvents,
} from '@wepublish/website/builder';
import { ComponentProps, ComponentType } from 'react';

export const WithRouterDecorator =
  ({
    query = {},
    events = noopBuilderRouterEvents,
  }: Partial<
    ComponentProps<typeof BuilderRouterContext.Provider>['value']
  > = {}) =>
  (Story: ComponentType) => {
    return (
      <BuilderRouterContext.Provider value={{ query, events }}>
        <Story />
      </BuilderRouterContext.Provider>
    );
  };
