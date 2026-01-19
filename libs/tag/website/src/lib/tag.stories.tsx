import { ApolloError } from '@apollo/client';
import { Meta, StoryObj } from '@storybook/react';
import { Tag } from './tag';
import {
  mockArticle,
  mockArticleRevision,
  mockTag,
} from '@wepublish/storybook/mocks';
import { action } from '@storybook/addon-actions';

const tag = mockTag();

export default {
  component: Tag,
  title: 'Components/Tag',
} as Meta;

export const Default: StoryObj<typeof Tag> = {
  args: {
    tag: {
      data: {
        tag,
      },
      loading: false,
    },
    articles: {
      data: {
        articles: {
          nodes: [
            mockArticle(),
            mockArticle({
              latest: mockArticleRevision({
                title: 'Some longer article title: How will it look like?',
              }),
            }),
            mockArticle(),
            mockArticle(),
            mockArticle(),
            mockArticle(),
            mockArticle(),
            mockArticle(),
            mockArticle(),
            mockArticle(),
            mockArticle(),
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
      loading: false,
    },
    variables: {
      skip: 0,
      take: 5,
      filter: {
        tags: [tag.id],
      },
    },
    onVariablesChange: action('onVariablesChange'),
  },
};

export const WithTagLoading = {
  ...Default,
  args: {
    ...Default.args,
    tag: {
      data: {
        tag: null,
      },
      loading: true,
    },
  },
};

export const WithArticlesLoading = {
  ...Default,
  args: {
    ...Default.args,
    articles: {
      data: {
        articles: null,
      },
      loading: true,
    },
  },
};

export const WithTagError = {
  ...Default,
  args: {
    ...Default.args,
    tags: {
      data: {
        tags: null,
      },
      error: new ApolloError({
        errorMessage: 'Foobar',
      }),
    },
  },
};

export const WithArticlesError = {
  ...Default,
  args: {
    ...Default.args,
    articles: {
      data: {
        articles: null,
      },
      error: new ApolloError({
        errorMessage: 'Foobar',
      }),
    },
  },
};
