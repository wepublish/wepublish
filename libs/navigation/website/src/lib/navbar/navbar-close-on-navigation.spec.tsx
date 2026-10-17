import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { ThemeProvider } from '@mui/material';
import { fireEvent, render, screen } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import { Button, H4, H6, IconButton, Link, theme } from '@wepublish/ui';
import { NavigationListQuery } from '@wepublish/website/api';
import {
  BuilderRouterContext,
  BuilderRouterEventHandler,
  BuilderRouterEventName,
  BuilderRouterEvents,
  WebsiteBuilderProvider,
} from '@wepublish/website/builder';
import { ComponentProps, act } from 'react';

import { Navbar } from './navbar';

type SessionContextValue = ComponentProps<
  typeof SessionTokenContext.Provider
>['value'];

const data = {
  navigations: [
    {
      id: '1',
      key: 'main',
      name: 'main',
      links: [
        {
          __typename: 'ExternalNavigationLink',
          label: 'Main Link',
          url: '/main-link',
        },
      ],
    },
  ],
} as unknown as NavigationListQuery;

const createEvents = () => {
  const handlers = new Map<
    BuilderRouterEventName,
    Set<BuilderRouterEventHandler<never>>
  >();

  const events: BuilderRouterEvents = {
    on: (event, handler) => {
      handlers.set(
        event,
        (handlers.get(event) ?? new Set()).add(
          handler as BuilderRouterEventHandler<never>
        )
      );
    },
    off: (event, handler) => {
      handlers.get(event)?.delete(handler as BuilderRouterEventHandler<never>);
    },
  };

  const emit = (event: BuilderRouterEventName) =>
    act(() => {
      handlers.get(event)?.forEach(handler =>
        (handler as BuilderRouterEventHandler<'navigationStart'>)({
          url: '/main-link',
        })
      );
    });

  return { events, emit };
};

const renderNavbar = (events: BuilderRouterEvents) => {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.empty(),
  });

  return render(
    <ApolloProvider client={client}>
      <SessionTokenContext.Provider
        value={[null, false, vi.fn()] as unknown as SessionContextValue}
      >
        <ThemeProvider theme={theme}>
          <WebsiteBuilderProvider
            elements={{ Button, H4, H6, IconButton, Link }}
          >
            <BuilderRouterContext.Provider value={{ query: {}, events }}>
              <Navbar
                slug="main"
                headerSlug="header"
                categorySlugs={[]}
                data={data}
                loading={false}
                error={undefined}
                hasRunningSubscription={false}
                hasUnpaidInvoices={false}
              />
            </BuilderRouterContext.Provider>
          </WebsiteBuilderProvider>
        </ThemeProvider>
      </SessionTokenContext.Provider>
    </ApolloProvider>
  );
};

const openMenu = () => {
  fireEvent.click(screen.getByLabelText('Menu'));
};

describe('Navbar close on navigation', () => {
  it('closes the menu when a navigation starts', () => {
    const { events, emit } = createEvents();

    renderNavbar(events);
    openMenu();

    expect(screen.queryByText('Main Link')).toBeTruthy();

    emit('navigationStart');

    expect(screen.queryByText('Main Link')).toBeNull();
  });

  it('keeps the menu open when a link is clicked without navigating', () => {
    const { events } = createEvents();

    renderNavbar(events);
    openMenu();

    fireEvent.click(screen.getByText('Main Link'));

    expect(screen.queryByText('Main Link')).toBeTruthy();
  });
});
