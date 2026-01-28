import { Meta } from '@storybook/react';
import {
  FullNavigationFragment,
  Navigation,
  NavigationListDocument,
} from '@wepublish/website/api';
import { FooterContainer } from './footer-container';

const children = (
  <svg
    viewBox="0 0 100 100"
    width={50}
    height={50}
    style={{ justifySelf: 'center' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="50"
      cy="50"
      r="50"
      fill="#fff"
    />
  </svg>
);

const navigation = {
  id: 'cldx7kcpi1168oapxftiqsh0p',
  key: 'main',
  name: 'main',
  links: [
    {
      __typename: 'PageNavigationLink',
      label: 'Gesellschaft',
      page: {
        url: '/',
      },
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Politik',
      article: {
        url: '/a/abcd',
      },
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Kultur',
      article: {
        url: '/a/abcd',
      },
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Tsüri-News',
      article: {
        url: '/a/abcd',
      },
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'Was lauft?',
      url: 'https://google.com',
    },
  ],
} as FullNavigationFragment;

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
          url: '/',
        },
      },
      {
        __typename: 'ExternalNavigationLink',
        label: 'Denkmal.org',
        url: 'https://google.com',
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Tsüri Guide',
        article: {
          url: '/a/abcd',
        },
      },
    ],
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
          url: '/',
        },
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Bildung',
        article: {
          url: '/a/abcd',
        },
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Konsum',
        article: {
          url: '/a/abcd',
        },
      },
      {
        __typename: 'ArticleNavigationLink',
        label: 'Archive',
        article: {
          url: '/a/abcd',
        },
      },
    ],
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
          url: '/team/',
        },
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Über Uns',
        page: {
          url: '/about-us/',
        },
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Kontakt',
        article: {
          url: '/contact/',
        },
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Jobs',
        article: {
          url: '/jobs/',
        },
      },
    ],
  },
] as Navigation[];

export default {
  component: FooterContainer,
  title: 'Container/Footer',
} as Meta;

export const Default = {
  args: {
    slug: 'footer',
    categorySlugs: [['guides', 'fokusthema'], ['about']],
    children,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: NavigationListDocument,
          },
          result: {
            data: {
              navigations,
            },
          },
        },
      ],
    },
  },
};
