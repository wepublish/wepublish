import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {Navigation, NavigationListDocument} from '@wepublish/website/api'
import {NavbarContainer} from './navbar-container'
import {css} from '@emotion/react'

const navigations = [
  {
    id: 'cldx7kcpi1168oapxftiqsh0p',
    key: 'main',
    name: 'main',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Home',
        page: {
          id: '1234-1234',
          slug: 'slug',
          url: '/',
          blocks: []
        }
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Artikel',
        article: {
          id: '1234-1234',
          slug: 'slug',
          url: '/a/abcd',
          blocks: []
        }
      },
      {
        __typename: 'ExternalNavigationLink',
        label: 'Google',
        url: 'https://google.com'
      }
    ]
  }
] as Navigation[]

export default {
  component: NavbarContainer,
  title: 'Container/Navbar'
} as Meta

export const Default = {
  args: {
    onQuery: action('onQuery')
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationListDocument
          },
          result: {
            data: {
              navigations
            }
          }
        }
      ]
    }
  }
}

export const WithClassName = {
  args: {
    onQuery: action('onQuery'),
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationListDocument
          },
          result: {
            data: {
              navigations
            }
          }
        }
      ]
    }
  }
}

export const WithEmotion = {
  args: {
    onQuery: action('onQuery'),
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationListDocument
          },
          result: {
            data: {
              navigations
            }
          }
        }
      ]
    }
  }
}
