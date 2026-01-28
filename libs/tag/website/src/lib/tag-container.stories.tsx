import { Meta, StoryObj } from '@storybook/react';
import { ArticleListDocument, TagDocument } from '@wepublish/website/api';
import { TagContainer } from './tag-container';
import {
  mockArticle,
  mockArticleRevision,
  mockTag,
} from '@wepublish/storybook/mocks';
import { action } from '@storybook/addon-actions';

const tag = mockTag();

export default {
  component: TagContainer,
  title: 'Container/Tag',
} as Meta;

export const Default: StoryObj<typeof TagContainer> = {
  args: {
    tag: tag.tag!,
    type: tag.type!,
    onVariablesChange: action('onVariablesChange'),
    variables: {
      skip: 0,
      take: 5,
    },
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: TagDocument,
            variables: {
              tag: tag.tag,
              type: tag.type,
            },
          },
          result: {
            data: {
              tags: {
                nodes: [tag],
              },
            },
          },
        },
        {
          request: {
            query: ArticleListDocument,
            variables: {
              skip: 0,
              take: 5,
              filter: {
                tags: [tag.id],
              },
            },
          },
          result: {
            data: {
              articles: {
                nodes: [
                  mockArticle(),
                  mockArticle({
                    latest: mockArticleRevision({
                      title:
                        'Some longer article title: How will it look like?',
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
          },
        },
      ],
    },
  },
};
