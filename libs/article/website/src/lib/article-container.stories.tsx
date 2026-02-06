import { Meta } from '@storybook/react';
import { ArticleDocument } from '@wepublish/website/api';
import { ArticleContainer } from './article-container';
import { mockArticle, mockPeer } from '@wepublish/storybook/mocks';
import {
  WithPollBlockDecorators,
  WithSubscribeBlockDecorators,
} from '@wepublish/storybook';

const article = mockArticle();
const articleWithPeer = mockArticle({ peer: mockPeer() });

export default {
  component: ArticleContainer,
  title: 'Container/Article',
  decorators: [WithSubscribeBlockDecorators({}), WithPollBlockDecorators({})],
} as Meta;

export const ById = {
  args: {
    id: article.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: article.id,
            },
          },
          result: {
            data: {
              article,
            },
          },
        },
      ],
    },
  },
};

export const BySlug = {
  args: {
    slug: article.slug,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              slug: article.slug,
            },
          },
          result: {
            data: {
              article,
            },
          },
        },
      ],
    },
  },
};

export const ByToken = {
  args: {
    token: 'foobar',
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              token: 'foobar',
            },
          },
          result: {
            data: {
              article,
            },
          },
        },
      ],
    },
  },
};

export const WithPeer = {
  args: {
    id: articleWithPeer.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: articleWithPeer.id,
            },
          },
          result: {
            data: {
              article: articleWithPeer,
            },
          },
        },
      ],
    },
  },
};

export const WithChildren = {
  args: {
    id: article.id,
    children: <div>Children</div>,
  },

  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ArticleDocument,
            variables: {
              id: article.id,
            },
          },
          result: {
            data: {
              article,
            },
          },
        },
      ],
    },
  },
};
