import { Meta } from '@storybook/react';
import { ArticleList } from './article-list';
import { ApolloError } from '@apollo/client';
import { mockArticle, mockArticleRevision } from '@wepublish/storybook/mocks';

export default {
  component: ArticleList,
  title: 'Components/ArticleList',
} as Meta;

export const Default = {
  args: {
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
    variables: {},
  },
};

export const WithLoading = {
  args: {
    data: undefined,
    loading: true,
  },
};

export const WithError = {
  args: {
    data: undefined,
    loading: false,
    error: new ApolloError({
      errorMessage: 'Article list error',
    }),
  },
};

export const WithoutImage = {
  args: {
    data: {
      articles: {
        nodes: [
          mockArticle(),
          mockArticle({
            latest: mockArticleRevision({
              image: null,
            }),
          }),
          mockArticle(),
          mockArticle({
            latest: mockArticleRevision({
              image: null,
            }),
          }),
          mockArticle({
            latest: mockArticleRevision({
              image: null,
            }),
          }),
          mockArticle(),
          mockArticle(),
          mockArticle(),
          mockArticle({
            latest: mockArticleRevision({
              image: null,
            }),
          }),
          mockArticle({
            latest: mockArticleRevision({
              image: null,
            }),
          }),
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
    variables: {},
  },
};
