import { createContext } from 'react';

export type BuilderRouterNavigationEvent = {
  url: string;
  shallow?: boolean;
};

export type BuilderRouterEventMap = {
  navigationStart: BuilderRouterNavigationEvent;
  navigationComplete: BuilderRouterNavigationEvent;
  navigationError: BuilderRouterNavigationEvent & { error: unknown };
  hashChangeStart: BuilderRouterNavigationEvent;
  hashChangeComplete: BuilderRouterNavigationEvent;
};

export type BuilderRouterEventName = keyof BuilderRouterEventMap;

export type BuilderRouterEventHandler<E extends BuilderRouterEventName> = (
  event: BuilderRouterEventMap[E]
) => void;

export type BuilderRouterEvents = {
  on<E extends BuilderRouterEventName>(
    event: E,
    handler: BuilderRouterEventHandler<E>
  ): void;
  off<E extends BuilderRouterEventName>(
    event: E,
    handler: BuilderRouterEventHandler<E>
  ): void;
};

export const noopBuilderRouterEvents: BuilderRouterEvents = {
  on: () => undefined,
  off: () => undefined,
};

export const BuilderRouterContext = createContext<{
  query: Record<string, string | string[] | undefined>;
  events: BuilderRouterEvents;
}>({
  query: {},
  events: noopBuilderRouterEvents,
});
