import { ApolloError } from '@apollo/client';
import { Meta } from '@storybook/react';
import { Article } from './article';
import { mockArticle, mockArticleRevision } from '@wepublish/storybook/mocks';
import {
  WithPollBlockDecorators,
  WithSubscribeBlockDecorators,
} from '@wepublish/storybook';

const article = mockArticle();

export default {
  component: Article,
  title: 'Components/Article',
  decorators: [WithSubscribeBlockDecorators({}), WithPollBlockDecorators({})],
} as Meta;

export const Default = {
  args: {
    data: { article },
  },
};

export const WithLoading = {
  args: {
    data: {
      article: null,
    },
    loading: true,
  },
};

export const WithError = {
  args: {
    data: {
      article: null,
    },
    error: new ApolloError({
      errorMessage: 'Foobar',
    }),
  },
};

export const WithChildren = {
  args: {
    data: { article },
    children: <div>Children</div>,
  },
};

export const WithoutAuthors = {
  args: {
    data: {
      article: mockArticle({ latest: mockArticleRevision({ authors: [] }) }),
    },
  },
};

export const WithoutSocialMedia = {
  args: {
    data: {
      article: mockArticle({
        latest: mockArticleRevision({
          socialMediaImage: null,
          socialMediaDescription: null,
          socialMediaTitle: null,
        }),
      }),
    },
  },
};

export const WithoutLead = {
  args: {
    data: {
      article: mockArticle({
        latest: mockArticleRevision({
          lead: null,
        }),
      }),
    },
  },
};

export const WithoutImageMetadata = {
  args: {
    data: {
      article: mockArticle({
        latest: mockArticleRevision({
          socialMediaImage: null,
          image: null,
        }),
      }),
    },
  },
};
