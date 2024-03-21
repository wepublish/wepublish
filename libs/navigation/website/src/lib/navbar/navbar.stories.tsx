import {ApolloError} from '@apollo/client'
import {Meta} from '@storybook/react'
import {FullNavigationFragment, Navigation} from '@wepublish/website/api'
import {Navbar} from './navbar'
import {css} from '@emotion/react'
import {Md60FpsSelect, MdInvertColors, MdSecurity} from 'react-icons/md'
import {WithUserDecorator} from '@wepublish/storybook'

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
    id: '123456-123456',
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
  },
  {
    id: '123456-123456',
    key: 'header',
    name: 'Header',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Foo',
        page: {
          url: '/foo/'
        }
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Bar',
        page: {
          url: '/bar'
        }
      }
    ]
  }
] as Navigation[]

const logo = {
  __typename: 'Image',
  id: 'U1R8wgTK8k8E576',
  createdAt: '2024-02-28T13:13:24.792Z',
  modifiedAt: '2024-02-28T13:13:24.792Z',
  filename: 'banff2',
  format: 'jpeg',
  mimeType: 'image/jpeg',
  extension: '.jpeg',
  width: 1988,
  height: 882,
  fileSize: 438218,
  title: null,
  description: null,
  tags: [],
  source: null,
  link: null,
  license: null,
  focalPoint: {
    __typename: 'Point',
    x: 0.5,
    y: 0.5
  },
  url: 'https://wepublish.ch/wp-content/uploads/2020/11/cropped-wepublishlogo-1.png',
  bigURL: 'https://wepublish.ch/wp-content/uploads/2020/11/cropped-wepublishlogo-1.png',
  largeURL: 'https://wepublish.ch/wp-content/uploads/2020/11/cropped-wepublishlogo-1.png',
  mediumURL: 'https://wepublish.ch/wp-content/uploads/2020/11/cropped-wepublishlogo-1.png',
  smallURL: 'https://wepublish.ch/wp-content/uploads/2020/11/cropped-wepublishlogo-1.png',
  squareBigURL:
    'http://localhost:4100/U1R8wgTK8k8E576/t/w_800,h_800,o_png,q_1,f_0.500:0.500/banff2.png',
  squareLargeURL:
    'http://localhost:4100/U1R8wgTK8k8E576/t/w_500,h_500,o_png,q_1,f_0.500:0.500/banff2.png',
  squareMediumURL:
    'http://localhost:4100/U1R8wgTK8k8E576/t/w_300,h_300,o_png,q_1,f_0.500:0.500/banff2.png',
  squareSmallURL:
    'http://localhost:4100/U1R8wgTK8k8E576/t/w_200,h_200,o_png,q_1,f_0.500:0.500/banff2.png'
}

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
    categorySlugs: [['guides', 'fokusthema'], ['about']],
    headerSlug: 'header',
    logo
  }
}

export const WithLoggedIn = {
  ...Default,
  decorators: [WithUserDecorator(null)]
}

export const WithoutLogo = {
  ...Default,
  args: {
    ...Default.args,
    logo: undefined
  }
}

export const WithChildren = {
  ...Default,
  args: {
    ...Default.args,
    children: [
      <>
        <MdInvertColors size="32" />
        <Md60FpsSelect size="32" />
        <MdSecurity size="32" />
      </>
    ]
  }
}

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      navigations: null
    },
    loading: true
  }
}

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      navigations: null
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar'
    })
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

export const WithoutItems = {
  ...Default,
  args: {
    ...Default.args,
    slug: '',
    categorySlugs: [],
    headerSlug: ''
  }
}
