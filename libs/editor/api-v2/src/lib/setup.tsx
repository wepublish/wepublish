import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client';
import { removeTypenameFromVariables } from '@apollo/client/link/remove-typename';

import possibleTypes from './graphql';
import { ComponentType, memo } from 'react';

export enum ElementID {
  Settings = 'settings',
  ReactRoot = 'react-root',
}

export interface ClientSettings {
  readonly apiURL: string;
  readonly peerByDefault: boolean;
  readonly imgMinSizeToCompress: number;
}

export enum LocalStorageKey {
  SessionToken = 'sessionToken',
  ImageListLayout = 'imageListLayout',
}

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem(LocalStorageKey.SessionToken);
  const context = operation.getContext();

  operation.setContext({
    headers: {
      authorization: token ? `Bearer ${token}` : '',
      preview: 'preview',
      ...context.headers,
    },
    credentials: 'include',
    ...context,
  });

  return forward(operation);
});

let settings: ClientSettings;

export function getSettings(): ClientSettings {
  if (!settings) {
    const defaultSettings = {
      apiURL: 'http://localhost:4000',
      imgMinSizeToCompress: 10,
    };

    const settingsJson = document.getElementById(ElementID.Settings);

    settings = settingsJson
      ? JSON.parse(document.getElementById(ElementID.Settings)!.textContent!)
      : defaultSettings;
  }

  return settings;
}

let client: ApolloClient<NormalizedCacheObject>;

export function getApiClientV2() {
  const { apiURL } = getSettings();

  if (!client) {
    client = new ApolloClient({
      link: authLink
        .concat(removeTypenameFromVariables({}))
        .concat(createHttpLink({ uri: `${apiURL}/v1`, fetch })),
      cache: new InMemoryCache({
        possibleTypes: possibleTypes.possibleTypes,
      }),
    });
  }

  return client;
}

export const createWithV2ApiClient = <
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends object
>(
  ControlledComponent: ComponentType<P>
) =>
  memo<P>(props => {
    const client = getApiClientV2();

    return (
      <ApolloProvider client={client}>
        <ControlledComponent {...(props as P)} />
      </ApolloProvider>
    );
  });
