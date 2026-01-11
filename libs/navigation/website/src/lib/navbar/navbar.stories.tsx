import { ApolloError } from '@apollo/client';
import { Meta, StoryObj } from '@storybook/react';
import {
  BaseNavigationLink,
  Navigation,
  NavigationLinkType,
} from '@wepublish/website/api';
import { Navbar } from './navbar';
import { Md60FpsSelect, MdInvertColors, MdSecurity } from 'react-icons/md';
import { WithUserDecorator } from '@wepublish/storybook';
import { mockImage } from '@wepublish/storybook/mocks';
import nanoid from 'nanoid';
import React from 'react';
import { userEvent, within } from '@storybook/test';
import { wait } from '@wepublish/testing';
import { mockUser } from '@wepublish/storybook/mocks';
import { MeDocument } from '@wepublish/website/api';

const navigations = [
  {
    id: nanoid(),
    key: 'main',
    name: 'main',
    createdAt: '2000-01-01',
    modifiedAt: '2000-01-01',
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
        createdAt: '2000-01-01',
        id: nanoid(),
        modifiedAt: '2000-01-01',
        type: NavigationLinkType.External,
      } as BaseNavigationLink,
    ],
  },
  {
    id: nanoid(),
    key: 'guides',
    name: 'Guides',
    createdAt: '2000-01-01',
    modifiedAt: '2000-01-01',
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
        createdAt: '2000-01-01',
        id: nanoid(),
        modifiedAt: '2000-01-01',
        type: NavigationLinkType.External,
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
    id: nanoid(),
    key: 'fokusthema',
    name: 'Fokusthema',
    createdAt: '2000-01-01',
    modifiedAt: '2000-01-01',
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
    id: nanoid(),
    key: 'about',
    name: 'Über Uns',
    createdAt: '2000-01-01',
    modifiedAt: '2000-01-01',
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
  {
    id: nanoid(),
    key: 'header',
    name: 'Header',
    createdAt: '2000-01-01',
    modifiedAt: '2000-01-01',
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
    ],
  },
  {
    id: nanoid(),
    key: 'icons',
    name: 'Icons',
    createdAt: '2000-01-01',
    modifiedAt: '2000-01-01',
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
        createdAt: '2000-01-01',
        id: nanoid(),
        modifiedAt: '2000-01-01',
        type: NavigationLinkType.External,
      },
    ],
  },
] as Navigation[];

const logo = mockImage();

const clickLogout: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const logoutButton = await canvas.getByText('Logout');

  await step('Logout', async () => {
    await userEvent.click(logoutButton);
  });
};

const clickIconButton: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const iconButton = await canvas.getByRole('link', { name: 'Search' });
  iconButton.addEventListener('click', e => {
    e.preventDefault();
  });

  await step('Click icon button', async () => {
    await userEvent.click(iconButton);
  });
};

const toggleMenu: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const menuButton = await canvas.getByLabelText('Menu');

  await step('Toggle menu', async () => {
    await userEvent.click(menuButton);
  });
};

const waitForInitialDataIsSet =
  (
    playFunction: NonNullable<StoryObj['play']>
  ): NonNullable<StoryObj['play']> =>
  async ctx => {
    await wait(100);
    await playFunction(ctx);
  };

const user = mockUser();
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

export const WithMenuOpen = {
  ...Default,
  args: {
    ...Default.args,
    isMenuOpen: true,
  },
};

export const WithLoggedIn = {
  ...Default,
  decorators: [WithUserDecorator(null)],
};

export const UserLogOut = {
  ...WithLoggedIn,
  decorators: [WithUserDecorator(user)],
  args: {
    ...WithLoggedIn.args,
    isMenuOpen: true,
    logo: undefined,
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: MeDocument,
          },
          result: {
            data: {
              me: user,
            },
          },
        },
      ],
    },
  },
  play: waitForInitialDataIsSet(async ctx => {
    await wait(500);
    await clickLogout(ctx);
  }),
};

export const ToggleMenu = {
  ...Default,
  args: {
    ...Default.args,
    logo: undefined,
  },
  play: waitForInitialDataIsSet(async ctx => {
    await toggleMenu(ctx);
    await wait(500);
    await toggleMenu(ctx);
  }),
};

export const ClickIconButton = {
  ...Default,
  args: {
    ...Default.args,
    logo: undefined,
    navPaperClassName: 'navpaper-class',
  },
  play: waitForInitialDataIsSet(async ctx => {
    await wait(500);
    await clickIconButton(ctx);
  }),
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
      <React.Fragment key="icons">
        <MdInvertColors size="32" />
        <Md60FpsSelect size="32" />
        <MdSecurity size="32" />
      </React.Fragment>,
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
