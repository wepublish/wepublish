import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {Navigation} from '@wepublish/website/api'
import {Footer} from './footer'

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
      label: 'Impressum',
      article: {
        url: '/a/impressum'
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
  component: Footer,
  title: 'Components/Footer'
} as Meta

export const Default = {
  args: {
    data: {
      navigation
    },
    loading: false,
    children
  }
}

export const WithLoading = {
  args: {
    data: {
      navigation: null
    },
    loading: true,
    children
  }
}

export const WithError = {
  args: {
    data: {
      navigation: null
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    }),
    children
  }
}
