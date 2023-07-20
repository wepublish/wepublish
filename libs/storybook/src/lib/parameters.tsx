import {InMemoryCache} from '@apollo/client'
import {MockedProvider} from '@apollo/client/testing'
import {Preview} from '@storybook/react'
import {possibleTypes} from '@wepublish/website/api'

const cache = new InMemoryCache({
  possibleTypes: possibleTypes.possibleTypes,
  resultCaching: false,
  addTypename: false,
  canonizeResults: true,
  resultCacheMaxSize: 0
})

export const parameters = {
  apolloClient: {
    MockedProvider,
    cache,
    showWarnings: false
  },
  options: {
    storySort: {
      includeName: true,
      method: 'alphabetical',
      order: [
        'Getting Started',
        'Overview',
        'Installation',
        'Usage',
        'Learn',
        'FAQ',
        'Glossary',
        '*',
        'Item'
      ]
    }
  }
} as Preview['parameters']
