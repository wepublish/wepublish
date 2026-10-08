import { InMemoryCacheConfig } from '@apollo/client';

/**
 * Cache merge payload, not an operation result — codegen only emits schema
 * types that operations actually select, so the shape is declared locally.
 */
type MergedBlock = { disabled?: boolean | null };

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
};
