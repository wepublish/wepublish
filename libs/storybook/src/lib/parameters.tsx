import {MockedProvider} from '@apollo/client/testing'
import {Preview} from '@storybook/react'

export const parameters = {
  apolloClient: {
    MockedProvider,
    addTypename: false
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
