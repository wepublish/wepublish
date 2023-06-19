import {action} from '@storybook/addon-actions'
import {Meta} from '@storybook/react'
import {Navigation, NavigationDocument} from '@wepublish/website/api'
import {FooterContainer} from './footer-container'
import {css} from '@emotion/react'

const children = (
  <svg
    viewBox="0 0 100 100"
    width={50}
    height={50}
    style={{justifySelf: 'center'}}
    xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#fff" />
  </svg>
)

const navigation = {
  __typename: 'Navigation',
  id: 'cldx7kcpi1168oapxftiqsh0p',
  key: 'main',
  name: 'main',
  links: [
    {
      __typename: 'PageNavigationLink',
      label: 'Home',
      page: {
        __typename: 'Page',
        id: '1234-1234',
        slug: 'slug',
        url: '/',
        blocks: []
      }
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Impressum',
      article: {
        __typename: 'Article',
        id: '1234-1234',
        slug: 'slug',
        url: '/a/impressum',
        blocks: []
      }
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'FAQ',
      url: 'https://google.com'
    }
  ]
} as Navigation

export default {
  component: FooterContainer,
  title: 'Container/Footer'
} as Meta

export const Default = {
  args: {
    onQuery: action('onQuery'),
    slug: 'footer',
    children
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationDocument,
            variables: {
              slug: 'footer'
            }
          },
          result: {
            data: {
              navigation
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
    slug: 'footer',
    children,
    className: 'extra-classname'
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationDocument,
            variables: {
              slug: 'footer'
            }
          },
          result: {
            data: {
              navigation
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
    slug: 'footer',
    children,
    css: css`
      background-color: #eee;
    `
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationDocument,
            variables: {
              slug: 'footer'
            }
          },
          result: {
            data: {
              navigation
            }
          }
        }
      ]
    }
  }
}
