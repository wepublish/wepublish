import { Meta } from '@storybook/react';
import {
  FullNavigationFragment,
  Navigation,
  NavigationListDocument,
} from '@wepublish/website/api';
import { NavbarContainer } from './navbar-container';

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
        url: '/',
      },
    },
    {
      __typename: 'ArticleNavigationLink',
      label: 'Artikel',
      article: {
        url: '/a/abcd',
      },
    },
    {
      __typename: 'ExternalNavigationLink',
      label: 'Google',
      url: 'https://google.com',
    },
  ],
} as FullNavigationFragment;

const navigations = [
  navigation,
  {
    ...navigation,
    id: '1234-1234',
    key: 'categories',
    name: 'Kategorien',
  },
  {
    ...navigation,
    id: '12345-12345',
    key: 'about',
    name: 'Über Uns',
  },
  {
    ...navigation,
    id: '123456-123456',
    key: 'header',
    name: 'Header',
  },
  {
    id: '123456-123456',
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
    ],
  },
] as Navigation[];

export default {
  component: NavbarContainer,
  title: 'Container/Navbar',
} as Meta;

export const Default = {
  args: {
    slug: 'main',
    categorySlugs: [['categories'], ['about']],
    headerSlug: 'header',
    iconSlug: 'icons',
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
