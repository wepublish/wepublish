import { Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { AuthorList } from './author-list';
import { ApolloError } from '@apollo/client';
import { mockAuthor } from '@wepublish/storybook/mocks';

export default {
  component: AuthorList,
  title: 'Components/AuthorList',
} as Meta;

export const Default = {
  args: {
    data: {
      authors: {
        nodes: [
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
          mockAuthor(),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        totalCount: 11,
      },
    },
    variables: {},
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
      errorMessage: 'Author list error',
    }),
    onVariablesChange: action('onVariablesChange'),
  },
};

export const WithoutJobTitle = {
  args: {
    data: {
      authors: {
        nodes: [
          mockAuthor(),
          mockAuthor({ jobTitle: undefined }),
          mockAuthor({ jobTitle: undefined }),
          mockAuthor(),
          mockAuthor(),
          mockAuthor({ jobTitle: undefined }),
          mockAuthor(),
          mockAuthor({ jobTitle: undefined }),
          mockAuthor(),
          mockAuthor({ jobTitle: undefined }),
          mockAuthor(),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        totalCount: 11,
      },
    },
    variables: {},
    onVariablesChange: action('onVariablesChange'),
  },
};

export const WithoutImage = {
  args: {
    data: {
      authors: {
        nodes: [
          mockAuthor(),
          mockAuthor({ image: null }),
          mockAuthor({ image: null }),
          mockAuthor(),
          mockAuthor(),
          mockAuthor({ image: null }),
          mockAuthor({ image: null }),
          mockAuthor(),
          mockAuthor(),
          mockAuthor({ image: null }),
          mockAuthor(),
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          endCursor: null,
          startCursor: null,
        },
        totalCount: 11,
      },
    },
    variables: {},
    onVariablesChange: action('onVariablesChange'),
  },
};
