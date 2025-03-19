import {DefaultOptions, InMemoryCache} from '@apollo/client'
import {MockedProvider} from '@apollo/client/testing'
import {Preview} from '@storybook/react'
import {possibleTypes} from '@wepublish/website/api'
import i18 from './i18next'

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  },
  mutate: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all'
  }
}

const cache = new InMemoryCache({
  possibleTypes: possibleTypes.possibleTypes,
  resultCaching: false,
  addTypename: true,
  canonizeResults: true,
  resultCacheMaxSize: 0
})

export const parameters = {
  apolloClient: {
    MockedProvider,
    cache,
    showWarnings: false,
    assumeImmutableResults: true,
    defaultOptions
  },
  i18
} as Preview['parameters']
