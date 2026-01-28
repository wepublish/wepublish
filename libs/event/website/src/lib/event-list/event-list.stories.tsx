import { Meta } from '@storybook/react';
import { EventList } from './event-list';
import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { mockEvent } from '@wepublish/storybook/mocks';

export default {
  component: EventList,
  title: 'Components/EventList',
} as Meta;

export const Default = {
  args: {
    data: {
      events: {
        nodes: [
          mockEvent(),
          mockEvent(),
          mockEvent(),
          mockEvent(),
          mockEvent(),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        totalCount: 5,
      },
    },
    variables: {
      take: 10,
    },
    onVariablesChange: action('onVariablesChange'),
  },
};

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
    onVariablesChange: action('onVariablesChange'),
  },
};

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
    onVariablesChange: action('onVariablesChange'),
  },
};

export const WithoutImage = {
  args: {
    data: {
      events: {
        nodes: [
          mockEvent({ image: undefined }),
          mockEvent(),
          mockEvent({ image: undefined }),
          mockEvent(),
          mockEvent({ image: undefined }),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        totalCount: 5,
      },
    },
    onVariablesChange: action('onVariablesChange'),
  },
};
