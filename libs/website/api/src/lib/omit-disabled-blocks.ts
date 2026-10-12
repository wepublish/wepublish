import { InMemoryCacheConfig } from '@apollo/client';

type MergedBlock = { disabled?: boolean | null };
type MergedFlexBlock = { block?: MergedBlock | null };

type MergedFlexBlock = { block?: MergedBlock | null };

export const omitDisabledBlocks: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {
  PageRevision: {
    fields: {
      blocks: {
        merge: (_, blocks: MergedBlock[]) => {
          return blocks.filter(block => !block.disabled);
        },
      },
    },
  },
  ArticleRevision: {
    fields: {
      blocks: {
        merge: (_, blocks: MergedBlock[]) => {
          return blocks.filter(block => !block.disabled);
        },
      },
    },
  },
  BlockTemplate: {
    fields: {
      blocks: {
        merge: (_, blocks: MergedBlock[]) => {
          return blocks.filter(block => !block.disabled);
        },
      },
    },
  },
  FlexBlock: {
    fields: {
      blocks: {
        merge: (_, blocks: MergedFlexBlock[]) => {
          return blocks.filter(({ block }) => !block?.disabled);
        },
      },
    },
  },
};
