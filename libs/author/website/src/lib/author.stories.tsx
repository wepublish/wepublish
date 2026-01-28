import { ApolloError } from '@apollo/client';
import { Meta } from '@storybook/react';
import { Author } from './author';
import { mockAuthor } from '@wepublish/storybook/mocks';

const author = mockAuthor();

export default {
  component: Author,
  title: 'Components/Author',
} as Meta;

export const Default = {
  args: {
    data: { author },
  },
};

export const WithLoading = {
  args: {
    data: {
      author: null,
    },
    loading: true,
  },
};

export const WithError = {
  args: {
    data: {
      author: null,
    },
    loading: false,
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};

export const WithoutJobTitle = {
  args: {
    data: {
      author: {
        ...author,
        jobTitle: null,
      },
    },
  },
};

export const WithoutImage = {
  args: {
    data: {
      author: {
        ...author,
        image: null,
      },
    },
  },
};

export const WithoutBio = {
  args: {
    data: {
      author: {
        ...author,
        bio: null,
      },
    },
  },
};

export const WithoutLinks = {
  args: {
    data: {
      author: {
        ...author,
        links: null,
      },
    },
  },
};
