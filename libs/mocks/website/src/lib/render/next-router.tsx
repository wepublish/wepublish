import type { NextRouter, RouterEvent } from 'next/router';
import type { ParsedUrlQuery } from 'querystring';
import { createContext, PropsWithChildren, useContext } from 'react';
import { Mock, vi } from 'vitest';

export type TestRouterOptions = {
  pathname?: string;
  query?: ParsedUrlQuery;
  asPath?: string;
  locale?: string;
};

export type TestRouter = Omit<
  NextRouter,
  'push' | 'replace' | 'prefetch' | 'back' | 'forward' | 'reload'
> & {
  push: Mock<NextRouter['push']>;
  replace: Mock<NextRouter['replace']>;
  prefetch: Mock<NextRouter['prefetch']>;
  back: Mock<NextRouter['back']>;
  forward: Mock<NextRouter['forward']>;
  reload: Mock<NextRouter['reload']>;
};

type Handler = (...args: unknown[]) => void;

const createEvents = (): NextRouter['events'] => {
  const handlers = new Map<RouterEvent, Set<Handler>>();

  return {
    on(type, handler) {
      handlers.set(type, (handlers.get(type) ?? new Set()).add(handler));
    },
    off(type, handler) {
      handlers.get(type)?.delete(handler);
    },
    emit(type, ...args) {
      handlers.get(type)?.forEach(handler => handler(...args));
    },
  };
};

const parseQuery = (search: string): ParsedUrlQuery => {
  const query: ParsedUrlQuery = {};

  new URLSearchParams(search).forEach((value, key) => {
    const existing = query[key];

    query[key] =
      existing === undefined ? value
      : Array.isArray(existing) ? [...existing, value]
      : [existing, value];
  });

  return query;
};

export const createTestRouter = ({
  pathname,
  query,
  asPath,
  locale = 'de',
}: TestRouterOptions = {}): TestRouter => {
  const [path, search = ''] = (asPath ?? pathname ?? '/').split('?');

  return {
    route: pathname ?? path,
    pathname: pathname ?? path,
    query: query ?? parseQuery(search),
    asPath: asPath ?? pathname ?? '/',
    basePath: '',
    locale,
    locales: ['de', 'fr'],
    defaultLocale: 'de',
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    isFallback: false,
    events: createEvents(),
    push: vi.fn<NextRouter['push']>(async () => true),
    replace: vi.fn<NextRouter['replace']>(async () => true),
    prefetch: vi.fn<NextRouter['prefetch']>(async () => undefined),
    back: vi.fn<NextRouter['back']>(),
    forward: vi.fn<NextRouter['forward']>(),
    reload: vi.fn<NextRouter['reload']>(),
    beforePopState: () => undefined,
  };
};

let fallbackRouter: TestRouter | undefined;
let currentRouter: TestRouter | undefined;

const activeRouter = () =>
  currentRouter ?? (fallbackRouter ??= createTestRouter());

const RouterContext = createContext<TestRouter | null>(null);

export const activateTestRouter = (router: TestRouter) => {
  currentRouter = router;

  return () => {
    if (currentRouter === router) {
      currentRouter = undefined;
    }
  };
};

export const TestRouterProvider = ({
  router,
  children,
}: PropsWithChildren<{ router: TestRouter }>) => (
  <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
);

export const useRouter = (): NextRouter =>
  useContext(RouterContext) ?? activeRouter();

const singletonRouter = new Proxy({} as NextRouter, {
  get: (_, key) => Reflect.get(activeRouter(), key),
});

export default singletonRouter;
