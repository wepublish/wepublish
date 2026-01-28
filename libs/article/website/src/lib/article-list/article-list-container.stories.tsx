import { Meta } from '@storybook/react';
import { Article, ArticleListDocument } from '@wepublish/website/api';
import { ArticleListContainer } from './article-list-container';
import { mockArticle } from '@wepublish/storybook/mocks';

const article = mockArticle();

export default {
  component: ArticleListContainer,
  title: 'Container/ArticleList',
} as Meta;

export const Default = {
  args: {},

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleListDocument,
            variables: {},
          },
          result: {
            data: {
              articles: {
                nodes: [article, mockArticle(), mockArticle()],
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

export const WithFilter = {
  ...Default,
  args: {
    filter: (articles: Article[]) => articles.filter(a => a.id !== article.id),
  },
};
