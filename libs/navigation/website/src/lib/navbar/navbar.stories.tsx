import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {Navigation} from '@wepublish/website/api'
import {Navbar} from './navbar'

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
  }
] as Navigation[]

export default {
  component: Navbar,
  title: 'Components/Navbar'
} as Meta

export const Default = {
  args: {
    data: {
      navigations
    },
    loading: false
  }
}

export const WithLoading = {
  args: {
    data: {
      navigations: null
    },
    loading: true
  }
}

export const WithError = {
  args: {
    data: {
      navigations: null
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
  }
}
