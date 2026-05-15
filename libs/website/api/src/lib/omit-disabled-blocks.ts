import { InMemoryCacheConfig } from '@apollo/client';
import { BlockContent } from './graphql';

export const omitDisabledBlocks: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {
  PageRevision: {
    fields: {
      blocks: {
        merge: (_, blocks: BlockContent[]) => {
          return blocks.filter(block => !block.disabled);
        },
      },
    },
  },
  ArticleRevision: {
    fields: {
      blocks: {
        merge: (_, blocks: BlockContent[]) => {
          return blocks.filter(block => !block.disabled);
        },
      },
    },
  },
};
