import { Meta } from '@storybook/react';
import { AuthorDocument } from '@wepublish/website/api';
import { AuthorContainer } from './author-container';
import { mockAuthor } from '@wepublish/storybook/mocks';

const author = mockAuthor();

export default {
  component: AuthorContainer,
  title: 'Container/Author',
} as Meta;

export const ById = {
  args: {
    id: author.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorDocument,
            variables: {
              id: author.id,
            },
          },
          result: {
            data: {
              author,
            },
          },
        },
      ],
    },
  },
};

export const BySlug = {
  args: {
    slug: author.slug,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorDocument,
            variables: {
              slug: author.slug,
            },
          },
          result: {
            data: {
              author,
            },
          },
        },
      ],
    },
  },
};
