import { ApolloError } from '@apollo/client';
import { Meta } from '@storybook/react';
import {
  BaseNavigationLink,
  Navigation,
  NavigationLinkInput,
} from '@wepublish/website/api';
import { Navbar } from './navbar';
import { Md60FpsSelect, MdInvertColors, MdSecurity } from 'react-icons/md';
import { WithUserDecorator } from '@wepublish/storybook';
import { mockImage } from '@wepublish/storybook/mocks';

const navigations = [
  {
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
    ] as Array<
      Pick<NavigationLinkInput, 'label' | 'url'> & { __typename: string }
    >,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
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
    ] as Array<
      Pick<NavigationLinkInput, 'label' | 'url'> & {
        __typename: string;
        page?: any;
      }
    >,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
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
    ] as Array<
      Pick<NavigationLinkInput, 'label' | 'url'> & {
        __typename: string;
        article: any;
      }
    >,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
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
    ] as Array<
      Pick<NavigationLinkInput, 'label' | 'url'> & {
        __typename: string;
        article: any;
      }
    > as unknown as BaseNavigationLink[],
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: '1234567-1234567',
    key: 'header',
    name: 'Header',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Foo',
        page: {
          url: '/foo/',
        },
      },
      {
        __typename: 'PageNavigationLink',
        label: 'Bar',
        page: {
          url: '/bar',
        },
      },
    ] as Array<
      Pick<NavigationLinkInput, 'label' | 'url'> & {
        __typename: string;
        page?: any;
      }
    >,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
  {
    id: '1234568-1234568',
    key: 'icons',
    name: 'Icons',
    links: [
      {
        __typename: 'PageNavigationLink',
        label: 'Search',
        page: {
          url: '/search',
        },
      },
      {
        __typename: 'ExternalNavigationLink',
        label: 'X',
        url: 'https://twitter.com/foobar',
      },
    ] as Array<
      Pick<NavigationLinkInput, 'label' | 'url'> & { __typename: string }
    >,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
  },
] as Navigation[];

const logo = mockImage();

export default {
  component: Navbar,
  title: 'Components/Navbar',
} as Meta;

export const Default = {
  args: {
    data: {
      navigations,
    },
    loading: false,
    slug: 'main',
    categorySlugs: [['guides', 'fokusthema'], ['about']],
    headerSlug: 'header',
    iconSlug: 'icons',
    logo,
  },
};

export const WithLoggedIn = {
  ...Default,
  decorators: [WithUserDecorator(null)],
};

export const WithoutLogo = {
  ...Default,
  args: {
    ...Default.args,
    logo: undefined,
  },
};

export const WithChildren = {
  ...Default,
  args: {
    ...Default.args,
    children: [
      <>
        <MdInvertColors size="32" />
        <Md60FpsSelect size="32" />
        <MdSecurity size="32" />
      </>,
    ],
  },
};

export const WithLoading = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      navigations: null,
    },
    loading: true,
  },
};

export const WithError = {
  ...Default,
  args: {
    ...Default.args,
    data: {
      navigations: null,
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};

export const WithoutItems = {
  ...Default,
  args: {
    ...Default.args,
    slug: '',
    categorySlugs: [],
    headerSlug: '',
  },
};
