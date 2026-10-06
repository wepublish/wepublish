import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { render, waitFor } from '@testing-library/react';
import { SessionTokenContext } from '@wepublish/authentication/website';
import {
  NavigationListDocument,
  PeerProfileDocument,
} from '@wepublish/website/api';
import { ComponentProps } from 'react';
import { NavbarContainer } from './navbar-container';
import { FooterContainer } from '../footer/footer-container';

type SessionContextValue = ComponentProps<
  typeof SessionTokenContext.Provider
>['value'];

const peerProfile = {
  __typename: 'PeerProfile',
  name: 'We.Publish',
  logo: null,
  squareLogo: null,
  themeColor: '#000000',
  themeFontColor: '#ffffff',
  hostURL: 'https://api.example.com',
  websiteURL: 'https://example.com',
  callToActionText: null,
  callToActionURL: '',
  callToActionImageURL: null,
  callToActionImage: null,
};

const renderWithFilledCache = (element: JSX.Element) => {
  const requested: string[] = [];
  const cache = new InMemoryCache();

  cache.writeQuery({
    query: NavigationListDocument,
    data: { navigations: [] },
  });
  cache.writeQuery({ query: PeerProfileDocument, data: { peerProfile } });

  const client = new ApolloClient({
    cache,
    defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network' } },
    link: new ApolloLink(operation => {
      requested.push(operation.operationName);

      return Observable.of({ data: null });
    }),
  });

  render(
    <ApolloProvider client={client}>
      <SessionTokenContext.Provider
        value={[null, false, vi.fn()] as unknown as SessionContextValue}
      >
        {element}
      </SessionTokenContext.Provider>
    </ApolloProvider>
  );

  return requested;
};

describe('navigation data on every page', () => {
  it('lets the navbar reuse navigations and peer profile from the cache', async () => {
    const requested = renderWithFilledCache(<NavbarContainer slug="main" />);

    await waitFor(() => new Promise(resolve => setTimeout(resolve, 50)));

    expect(requested).not.toContain('NavigationList');
    expect(requested).not.toContain('PeerProfile');
  });

  it('lets the footer reuse navigations from the cache', async () => {
    const requested = renderWithFilledCache(<FooterContainer slug="footer" />);

    await waitFor(() => new Promise(resolve => setTimeout(resolve, 50)));

    expect(requested).not.toContain('NavigationList');
  });
});
