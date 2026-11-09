import { InMemoryCacheConfig, Reference, StoreObject } from '@apollo/client';

type StoredBlock = Reference | StoreObject;

/**
 * Field-wise merge for the block lists, so two selections of the same list
 * cannot erase each other.
 *
 * Blocks carry no `id`, so Apollo stores them embedded rather than normalised,
 * and the default behaviour for an embedded array is to *replace* it. That is
 * wrong here, because the same list is written by selections of very different
 * depth. `FullArticleTeaser` asks for `article.latest.blocks` but only selects
 * fields inside `... on PollBlock`, so every other block arrives as nothing
 * but a `__typename` — and one teaser render then overwrites the full blocks
 * the article route had already read.
 *
 * What the reader sees is a flash of no content: the article's cached entry is
 * suddenly incomplete, `cache-first` falls through to the network, and
 * `libs/article/website/.../article.tsx` renders an empty wrapper for the
 * length of the round trip. It only shows when the router reuses a cached
 * match — on a fresh match the loader re-merges the full blocks first — which
 * is why it takes a particular back-and-forth to hit.
 *
 * Overlaying by index is sound because both selections return the same list
 * from the same revision in the same order. The `__typename` guard keeps the
 * overlay off a list that genuinely changed shape; anything the incoming write
 * does carry still wins, so an edited block updates normally.
 */
const overlay = (
  existing: readonly StoredBlock[] | undefined,
  incoming: readonly StoredBlock[]
): readonly StoredBlock[] => {
  if (!existing?.length) {
    return incoming;
  }

  return incoming.map((block, index) => {
    const previous = existing[index];

    if (
      !previous ||
      typeof previous !== 'object' ||
      typeof block !== 'object' ||
      (previous as StoreObject).__typename !== (block as StoreObject).__typename
    ) {
      return block;
    }

    return { ...previous, ...block };
  });
};

const mergedBlocks = { merge: overlay };

export const mergeBlockSelections: Exclude<
  InMemoryCacheConfig['typePolicies'],
  undefined
> = {
  ArticleRevision: { fields: { blocks: mergedBlocks } },
  PageRevision: { fields: { blocks: mergedBlocks } },
  BlockTemplate: { fields: { blocks: mergedBlocks } },
};
