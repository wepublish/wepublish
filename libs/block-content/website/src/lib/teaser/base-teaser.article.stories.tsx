import { Meta } from '@storybook/react';
import { BaseTeaser } from './base-teaser';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleTeaser,
} from '@wepublish/storybook/mocks';

export default {
  component: BaseTeaser,
  title: 'Blocks/Teaser/Article',
} as Meta;

const articleTeaser = mockArticleTeaser();

export const Default = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: articleTeaser,
  },
};

export const WithoutPreTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: {
      ...articleTeaser,
      preTitle: null,
    },
  },
};

export const WithoutArticlePreTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      preTitle: null,
      article: mockArticle({
        latest: mockArticleRevision({
          preTitle: null,
        }),
      }),
    }),
  },
};

export const WithoutTitle = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      title: null,
    }),
  },
};

export const WithoutLead = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      lead: null,
    }),
  },
};

export const WithoutImage = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      image: null,
    }),
  },
};

export const WithoutImageWithoutBlock = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      image: null,
      article: mockArticle({
        latest: mockArticleRevision({
          blocks: [],
        }),
      }),
    }),
  },
};

export const WithoutAuthors = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      article: mockArticle({
        latest: mockArticleRevision({
          authors: [],
        }),
      }),
    }),
  },
};

export const WithoutDate = {
  args: {
    alignment: {
      x: 0,
      y: 0,
      w: 3,
      h: 4,
      __typename: 'FlexAlignment',
    },
    teaser: mockArticleTeaser({
      article: mockArticle({
        publishedAt: null,
      }),
    }),
  },
};
