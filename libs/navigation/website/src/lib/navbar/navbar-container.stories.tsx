import {Meta} from '@storybook/react'
import {FullNavigationFragment, Navigation, NavigationListDocument} from '@wepublish/website/api'
import {NavbarContainer} from './navbar-container'
import {css} from '@emotion/react'

const navigation = {
  id: 'cldx7kcpi1168oapxftiqsh0p',
  key: 'main',
  name: 'main',
  links: [
    {
      __typename: 'PageNavigationLink',
      label: 'Home',
      page: {
        url: '/'
      }
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Artikel',
      article: {
        url: '/a/abcd'
      }
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'Google',
      url: 'https://google.com'
    }
  ]
} as FullNavigationFragment

const navigations = [
  navigation,
  {
    ...navigation,
    id: '1234-1234',
    key: 'categories',
    name: 'Kategorien'
  },
  {
    ...navigation,
    id: '12345-12345',
    key: 'about',
    name: 'Über Uns'
  }
] as Navigation[]

export default {
  component: NavbarContainer,
  title: 'Container/Navbar'
} as Meta

export const Default = {
  args: {
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']]
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
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']],
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
    css: css`
      background-color: #eee;
    `,
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']]
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
