import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {FullNavigationFragment, Navigation} from '@wepublish/website/api'
import {Navbar} from './navbar'
import {css} from '@emotion/react'
import {Md60FpsSelect, MdInvertColors, MdSecurity} from 'react-icons/md'

const navigation = {
  id: 'cldx7kcpi1168oapxftiqsh0p',
  key: 'main',
  name: 'main',
  links: [
    {
      __typename: 'PageNavigationLink',
      label: 'Gesellschaft',
      page: {
        url: '/'
      }
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Politik',
      article: {
        url: '/a/abcd'
      }
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Kultur',
      article: {
        url: '/a/abcd'
      }
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Tsüri-News',
      article: {
        url: '/a/abcd'
      }
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'Was lauft?',
      url: 'https://google.com'
    }
  ]
} as FullNavigationFragment

const navigations = [
  navigation,
  {
    id: '1234-1234',
    key: 'guides',
    name: 'Guides',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Agenda',
        page: {
          url: '/'
        }
      },
      {
        __typename: 'ExternalNavigationLink',
        label: 'Denkmal.org',
        url: 'https://google.com'
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Tsüri Guide',
        article: {
          url: '/a/abcd'
        }
      }
    ]
  },
  {
    id: '12345-12345',
    key: 'fokusthema',
    name: 'Fokusthema',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Mobilität',
        page: {
          url: '/'
        }
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Bildung',
        article: {
          url: '/a/abcd'
        }
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Konsum',
        article: {
          url: '/a/abcd'
        }
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Archive',
        article: {
          url: '/a/abcd'
        }
      }
    ]
  },
  {
    id: '12345-12345',
    key: 'about',
    name: 'Über Uns',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Team',
        page: {
          url: '/team/'
        }
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Über Uns',
        page: {
          url: '/about-us/'
        }
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Kontakt',
        article: {
          url: '/contact/'
        }
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Jobs',
        article: {
          url: '/jobs/'
        }
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
    loading: false,
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']]
  }
}

export const WithChildren = {
  args: {
    data: {
      navigations
    },
    loading: false,
    slug: 'main',
    children: [
      <>
        <MdInvertColors size="32" />
        <Md60FpsSelect size="32" />
        <MdSecurity size="32" />
      </>
    ],
    categorySlugs: [['guides', 'fokusthema'], ['about']]
  }
}

export const WithLoading = {
  args: {
    data: {
      navigations: null
    },
    loading: true,
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']]
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
    categorySlugs: [['guides', 'fokusthema'], ['about']]
  }
}

export const WithClassName = {
  args: {
    data: {
      navigations
    },
    className: 'extra-classname',
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']]
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
    categorySlugs: [['guides', 'fokusthema'], ['about']]
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
