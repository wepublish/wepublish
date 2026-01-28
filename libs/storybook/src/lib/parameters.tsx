import { DefaultOptions, InMemoryCache } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { Preview } from '@storybook/react';
import { possibleTypes } from '@wepublish/website/api';
import i18 from './i18next';

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
  mutate: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
};

const cache = new InMemoryCache({
  possibleTypes: possibleTypes.possibleTypes,
  resultCaching: false,
  resultCacheMaxSize: 0,
  addTypename: true,
  canonizeResults: true,
});

export const parameters = {
  initialGlobals: {
    locale: 'en',
    locales: {
      en: 'English',
    },
  },
  apolloClient: {
    MockedProvider,
    cache,
    showWarnings: false,
    assumeImmutableResults: true,
    defaultOptions,
  },
  i18,
} as Preview['parameters'];
