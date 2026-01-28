import { AuthorListDocument } from '@wepublish/website/api';
import { Meta } from '@storybook/react';
import { AuthorListContainer } from './author-list-container';
import { mockAuthor } from '@wepublish/storybook/mocks';

export default {
  component: AuthorListContainer,
  title: 'Container/AuthorList',
} as Meta;

export const Default = {
  args: {},

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: AuthorListDocument,
            variables: {},
          },
          result: {
            data: {
              authors: {
                nodes: [mockAuthor(), mockAuthor(), mockAuthor()],
                totalCount: 3,
                pageInfo: {
                  hasNextPage: false,
                  hasPreviousPage: false,
                  endCursor: null,
                  startCursor: null,
                },
              },
            },
          },
        },
      ],
    },
  },
};
