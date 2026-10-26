import { Meta } from '@storybook/nextjs-vite';
import {
  ArticleAccessSource,
  ArticleDocument,
  FullArticleAccessFragment,
  FullArticleFragment,
  FullEngagementPromptFragment,
  ViewArticleDocument,
} from '@wepublish/website/api';
import { ArticleContainer } from './article-container';
import {
  mockAnnouncementPrompt,
  mockArticle,
  mockArticleAccess,
  mockArticleRevision,
  mockEngagementPrompt,
  mockHardEngagementPrompt,
  mockPaywall,
  mockPeer,
  mockRestrictedByRule,
  mockRichTextBlock,
} from '@wepublish/storybook/mocks';
import {
  WithPollBlockDecorators,
  WithSubscribeBlockDecorators,
} from '@wepublish/storybook';

const article = mockArticle();
const articleWithPeer = mockArticle({ peer: mockPeer() });
const hardStage = mockHardEngagementPrompt();
const preview = mockRichTextBlock();
const articleBehindHardStage = mockArticle({
  latest: mockArticleRevision({ blocks: [preview], restricted: true }),
});
const articleBehindPaywall = mockArticle({
  paywall: mockPaywall({ enforced: true }),
  latest: mockArticleRevision({ blocks: [preview], restricted: true }),
});

/** The answer of viewArticle, which the container asks once mounted. */
const viewArticle = (
  { id, latest }: FullArticleFragment,
  {
    access = mockArticleAccess(),
    prompts = [],
  }: {
    access?: FullArticleAccessFragment;
    prompts?: FullEngagementPromptFragment[];
  } = {}
) => ({
  request: { query: ViewArticleDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      viewArticle: {
        __typename: 'ArticleView',
        meterToken: 'meter-token',
        access,
        prompts,
        article: {
          __typename: 'Article',
          id,
          latest: {
            __typename: 'ArticleRevision',
            id: latest.id,
            restricted: !access.granted,
            blocks: latest.blocks,
          },
        },
      },
    },
  },
});

const articleQuery = (
  data: FullArticleFragment,
  variables: Record<string, string> = { id: data.id }
) => ({
  request: { query: ArticleDocument, variables },
  result: { data: { article: data } },
});

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
        viewArticle(article),
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
        viewArticle(article),
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
        viewArticle(article),
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
        viewArticle(articleWithPeer),
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
        viewArticle(article),
      ],
    },
  },
};

export const WithSoftModal = {
  args: {
    id: article.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        articleQuery(article),
        viewArticle(article, { prompts: [mockEngagementPrompt()] }),
      ],
    },
  },
};

export const WithHardCutoff = {
  args: {
    id: articleBehindHardStage.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        articleQuery(articleBehindHardStage),
        viewArticle(articleBehindHardStage, {
          access: mockRestrictedByRule(hardStage),
          prompts: [hardStage, mockEngagementPrompt()],
        }),
      ],
    },
  },
};

export const WithEnforcedPaywall = {
  args: {
    id: articleBehindPaywall.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        articleQuery(articleBehindPaywall),
        viewArticle(articleBehindPaywall, {
          access: mockArticleAccess({
            granted: false,
            source: ArticleAccessSource.Paywall,
            paywallId: articleBehindPaywall.paywall?.id,
            previewBlocks: 2,
          }),
        }),
      ],
    },
  },
};

export const WithAnnouncementBanner = {
  args: {
    id: article.id,
  },

  parameters: {
    apolloClient: {
      mocks: [
        articleQuery(article),
        viewArticle(article, { prompts: [mockAnnouncementPrompt()] }),
      ],
    },
  },
};
