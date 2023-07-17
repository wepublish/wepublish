import {InMemoryCache} from '@apollo/client'
import {MockedProvider} from '@apollo/client/testing'
import {Preview} from '@storybook/react'
import {ApiV1} from '@wepublish/website'

const cache = new InMemoryCache({
  possibleTypes: ApiV1.possibleTypes.possibleTypes,
  resultCaching: false,
  addTypename: false
})

export const parameters = {
  apolloClient: {
    MockedProvider,
    cache
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
