import { parseISO } from 'date-fns';

import {
  PuckBlock,
  PuckBlockTimings,
  PuckBlockVisibility,
} from './puck-block.model';
import {
  ApiBlock,
  ApiBlockTimings,
  ApiBlockVisibility,
  defaultPuckSlot,
} from './puck-blocks';

const toTimings = ({
  from,
  to,
  ...timings
}: ApiBlockTimings): PuckBlockTimings => ({
  ...timings,
  ...(from ? { from: parseISO(from) } : {}),
  ...(to ? { to: parseISO(to) } : {}),
});

const toVisibility = ({
  timings,
  ...visibility
}: ApiBlockVisibility): PuckBlockVisibility => ({
  ...visibility,
  ...(timings ? { timings: toTimings(timings) } : {}),
});

const flattenSiblings = (
  siblings: ApiBlock[],
  parentId: string | null
): PuckBlock[] => {
  const positions = new Map<string | null, number>();

  return siblings.flatMap(({ children = [], slot, visibility, ...block }) => {
    const parentSlot = parentId === null ? null : (slot ?? defaultPuckSlot);
    const position = positions.get(parentSlot) ?? 0;

    positions.set(parentSlot, position + 1);

    return [
      {
        ...block,
        ...(visibility ? { visibility: toVisibility(visibility) } : {}),
        parentId,
        slot: parentSlot,
        position,
      },
      ...flattenSiblings(children, block.id),
    ];
  });
};

// GraphQL cannot return a tree of unknown depth: a query has to spell out
// every level it selects, so it would nest a fixed number of fragments and
// silently miss deeper blocks. Writes stay a recursive tree because input
// objects may nest arbitrarily; reads get this flat list in depth-first order
// instead, and clients rebuild the tree from parentId, slot and position.
export const flattenPuckBlocks = (blocks: ApiBlock[]): PuckBlock[] =>
  flattenSiblings(blocks, null);
