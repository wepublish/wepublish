import { ApolloError } from '@apollo/client';
import { Meta } from '@storybook/react';
import { Page } from './page';
import { mockPage, mockPageRevision } from '@wepublish/storybook/mocks';
import {
  WithPollBlockDecorators,
  WithSubscribeBlockDecorators,
} from '@wepublish/storybook';

const page = mockPage();

export default {
  component: Page,
  title: 'Components/Page',
  decorators: [WithSubscribeBlockDecorators({}), WithPollBlockDecorators({})],
} as Meta;

export const Default = {
  args: {
    data: { page },
    loading: false,
  },
};

export const WithLoading = {
  args: {
    data: {
      page: null,
    },
    loading: true,
  },
};

export const WithError = {
  args: {
    data: {
      page: null,
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};

export const WithChildren = {
  args: {
    data: { page },
    children: <div>Children</div>,
  },
};

export const WithoutSocialMedia = {
  args: {
    data: {
      page: mockPage({
        latest: mockPageRevision({
          socialMediaImage: null,
          socialMediaDescription: null,
          socialMediaTitle: null,
        }),
      }),
    },
  },
};

export const WithoutDescription = {
  args: {
    data: {
      page: mockPage({
        latest: mockPageRevision({
          description: null,
        }),
      }),
    },
  },
};

export const WithoutImageMetadata = {
  args: {
    data: {
      page: mockPage({
        latest: mockPageRevision({
          socialMediaImage: null,
          image: null,
        }),
      }),
    },
  },
};
