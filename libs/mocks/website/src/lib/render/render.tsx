import { ApolloClient } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import type { MockLink } from '@apollo/client/testing';
import '@testing-library/jest-dom/vitest';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import {
  PollBlockContext,
  PollBlockContextProps,
  SubscribeBlockContext,
  SubscribeBlockContextProps,
} from '@wepublish/block-content/website';
import {
  CommentRatingContext,
  CommentRatingContextProps,
} from '@wepublish/comments/website';
import { theme } from '@wepublish/ui';
import { FullSensitiveDataUserFragment } from '@wepublish/website/api';
import { TenantProviders } from '@wepublish/website';
import {
  BuilderRouterContext,
  WebsiteBuilderProps,
  WebsiteTenantConfig,
} from '@wepublish/website/builder';
import { de } from 'date-fns/locale';
import {
  Context,
  Fragment,
  PropsWithChildren,
  ReactElement,
  ReactNode,
} from 'react';
import { PartialDeep } from 'type-fest';
import { onTestFinished } from 'vitest';
import { createTestApolloClient } from './apollo';
import { setTestLocale, TestLocale } from './locale';
import {
  activateTestRouter,
  createTestRouter,
  TestRouter,
  TestRouterOptions,
  TestRouterProvider,
} from './next-router';
import { createSetToken, TestSessionProvider } from './session';
import { TestHead, TestScript } from './test-script';

export const defaultTestTenant: WebsiteTenantConfig = {
  id: 'default',
  name: 'We.Publish',
  createTheme: () => theme,
  builder: {},
  translations: { lng: 'de' },
  dateLocale: de,
};

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  apolloDefaultOptions?: ApolloClient.DefaultOptions;
  user?: FullSensitiveDataUserFragment | null;
  tenant?: WebsiteTenantConfig;
  builder?: PartialDeep<WebsiteBuilderProps>;
  router?: TestRouterOptions;
  locale?: TestLocale;
  poll?: PollBlockContextProps;
  commentRating?: CommentRatingContextProps;
  subscribeBlock?: SubscribeBlockContextProps;
};

const Optional = <T,>({
  Context,
  value,
  children,
}: {
  Context: Context<T>;
  value: T | undefined;
  children: ReactNode;
}) =>
  value === undefined ? children : (
    <Context.Provider value={value}>{children}</Context.Provider>
  );

export const renderWithProviders = (
  ui: ReactElement,
  {
    mocks,
    apolloDefaultOptions,
    user = null,
    tenant = defaultTestTenant,
    builder,
    router: routerOptions,
    locale,
    poll,
    commentRating,
    subscribeBlock,
    ...renderOptions
  }: RenderWithProvidersOptions = {}
): RenderResult & {
  client: ApolloClient;
  router: TestRouter;
  setToken: ReturnType<typeof createSetToken>;
} => {
  const { client, assertAllOperationsMocked } = createTestApolloClient({
    mocks,
    defaultOptions: apolloDefaultOptions,
  });
  const router: TestRouter = createTestRouter(routerOptions);
  const setToken = createSetToken();

  onTestFinished(assertAllOperationsMocked);
  onTestFinished(activateTestRouter(router));

  if (locale) {
    setTestLocale(locale);
  }

  const Wrapper = ({ children }: PropsWithChildren) => (
    <TenantProviders
      config={tenant}
      extra={{ Head: TestHead, Script: TestScript, ...builder }}
    >
      <ApolloProvider client={client}>
        <TestRouterProvider router={router}>
          <BuilderRouterContext.Provider
            value={{ query: router.query, asPath: router.asPath }}
          >
            <TestSessionProvider
              user={user}
              setToken={setToken}
            >
              <Optional
                Context={PollBlockContext}
                value={poll}
              >
                <Optional
                  Context={CommentRatingContext}
                  value={commentRating}
                >
                  <Optional
                    Context={SubscribeBlockContext}
                    value={subscribeBlock}
                  >
                    <Fragment key={locale}>{children}</Fragment>
                  </Optional>
                </Optional>
              </Optional>
            </TestSessionProvider>
          </BuilderRouterContext.Provider>
        </TestRouterProvider>
      </ApolloProvider>
    </TenantProviders>
  );

  return {
    ...render(ui, { ...renderOptions, wrapper: Wrapper }),
    client,
    router,
    setToken,
  };
};
