import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {Navigation, NavigationListDocument} from '@wepublish/website/api'
import {FooterContainer} from './footer-container'

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
  key: 'footer',
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
    slug: 'footer',
    children
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
              navigations: [navigation]
            }
          }
        }
      ]
    }
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
