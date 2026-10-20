import { InMemoryCacheConfig, Reference, StoreObject } from '@apollo/client';
import { FieldFunctionOptions } from '@apollo/client/cache';

type StoredBlock = Reference | StoreObject;
type StoredFlexBlock = Reference | StoreObject;

const flatten = (
  blocks: readonly StoredBlock[],
  readField: FieldFunctionOptions['readField'],
  depth = 0
): StoredBlock[] =>
  blocks.flatMap(block => {
    if (readField<string>('__typename', block) !== 'BlockTemplateBlock') {
      return [block];
    }

    // A block template could be referencing itself
    if (depth >= 10) {
      return [];
    }

    const template = readField<Reference>('template', block);

    if (!template) {
      return [];
    }

    return flatten(
      readField<readonly StoredBlock[]>('blocks', template) ?? [],
      readField,
      depth + 1
    );
  });

/**
 * A flex child pairs a block with its grid alignment. When a template expands
 * to several blocks they all inherit the template block's alignment, since
 * there is no per-block alignment to take.
 */
const flattenFlexBlocks = (
  flexBlocks: readonly StoredFlexBlock[],
  readField: FieldFunctionOptions['readField']
): StoredFlexBlock[] =>
  flexBlocks.flatMap(flexBlock => {
    const block = readField<StoredBlock>('block', flexBlock);

    if (!block) {
      return [flexBlock];
    }

    const flattened = flatten([block], readField);

    if (flattened.length === 1 && flattened[0] === block) {
      return [flexBlock];
    }

    const alignment = readField('alignment', flexBlock);

    return flattened.map(expanded => ({ alignment, block: expanded }));
  });

const flattenedBlocks = {
  read: (
    existing: readonly StoredBlock[] | undefined,
    { readField }: FieldFunctionOptions
  ) => (existing ? flatten(existing, readField) : existing),
};

/**
 * Expands `BlockTemplateBlock`s into the blocks they reference, so consumers
 * never have to know templates exist.
 *
 * This runs on `read` rather than `merge`: during `merge` the referenced
 * `BlockTemplate` has not been written to the cache yet, so `readField` would
 * come back empty and the template's blocks would be dropped.
 */
export const flattenBlockTemplates: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {
  PageRevision: { fields: { blocks: flattenedBlocks } },
  ArticleRevision: { fields: { blocks: flattenedBlocks } },
  FlexBlock: {
    fields: {
      blocks: {
        read: (
          existing: readonly StoredFlexBlock[] | undefined,
          { readField }: FieldFunctionOptions
        ) => (existing ? flattenFlexBlocks(existing, readField) : existing),
      },
    },
  },
};
