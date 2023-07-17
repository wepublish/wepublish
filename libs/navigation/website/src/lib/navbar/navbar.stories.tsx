import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {FullNavigationFragment, Navigation} from '@wepublish/website/api'
import {Navbar} from './navbar'
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
  component: Navbar,
  title: 'Components/Navbar'
} as Meta

export const Default = {
  args: {
    data: {
      navigations
    },
    loading: false,
    slug: 'main',
    categorySlugs: ['categories', 'about']
  }
}

export const WithLoading = {
  args: {
    data: {
      navigations: null
    },
    loading: true,
    slug: 'main',
    categorySlugs: ['categories', 'about']
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
    }),
    slug: 'main',
    categorySlugs: ['categories', 'about']
  }
}

export const WithClassName = {
  args: {
    data: {
      navigations
    },
    className: 'extra-classname',
    slug: 'main',
    categorySlugs: ['categories', 'about']
  }
}

export const WithEmotion = {
  args: {
    data: {
      navigations
    },
    css: css`
      background-color: #eee;
    `,
    slug: 'main',
    categorySlugs: ['categories', 'about']
  }
}

export const WithoutItems = {
  args: {
    data: {
      navigations
    },
    loading: false,
    slug: '',
    categorySlugs: []
  }
}
