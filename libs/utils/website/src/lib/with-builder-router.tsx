import { ComponentType, createElement, memo, useMemo } from 'react';
import {
  BuilderRouterContext,
  BuilderRouterEventHandler,
  BuilderRouterEventName,
  BuilderRouterEvents,
} from '@wepublish/website/builder';
import { NextRouter, useRouter } from 'next/router';

type NextRouterEvents = NextRouter['events'];
type NextRouterEventName = Parameters<NextRouterEvents['on']>[0];
type NextRouterEventHandler = Parameters<NextRouterEvents['on']>[1];
type NextRouterEventOptions = { shallow?: boolean } | undefined;

const nextEventNames: Record<BuilderRouterEventName, NextRouterEventName> = {
  navigationStart: 'routeChangeStart',
  navigationComplete: 'routeChangeComplete',
  navigationError: 'routeChangeError',
  hashChangeStart: 'hashChangeStart',
  hashChangeComplete: 'hashChangeComplete',
};

const toNextHandler = <E extends BuilderRouterEventName>(
  event: E,
  handler: BuilderRouterEventHandler<E>
): NextRouterEventHandler => {
  const emit = handler as BuilderRouterEventHandler<BuilderRouterEventName>;

  if (event === 'navigationError') {
    return (error: unknown, url: string, options?: NextRouterEventOptions) =>
      emit({ url, shallow: options?.shallow, error });
  }

  return (url: string, options?: NextRouterEventOptions) =>
    emit({ url, shallow: options?.shallow });
};

const subscriptions = new Map<
  BuilderRouterEventName,
  Map<BuilderRouterEventHandler<never>, NextRouterEventHandler>
>();

export const withBuilderRouter = <P extends object>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const { query, events: nextEvents } = useRouter();

    const events = useMemo<BuilderRouterEvents>(
      () => ({
        on(event, handler) {
          const handlers = subscriptions.get(event) ?? new Map();
          const nextHandler =
            handlers.get(handler) ?? toNextHandler(event, handler);

          handlers.set(handler, nextHandler);
          subscriptions.set(event, handlers);
          nextEvents.on(nextEventNames[event], nextHandler);
        },
        off(event, handler) {
          const handlers = subscriptions.get(event);
          const nextHandler = handlers?.get(handler);

          if (!nextHandler) {
            return;
          }

          handlers?.delete(handler);
          nextEvents.off(nextEventNames[event], nextHandler);
        },
      }),
      [nextEvents]
    );

    const contextValue = useMemo(() => ({ query, events }), [query, events]);

    return (
      <BuilderRouterContext.Provider value={contextValue}>
        {createElement(ControlledComponent, props as P)}
      </BuilderRouterContext.Provider>
    );
  });
