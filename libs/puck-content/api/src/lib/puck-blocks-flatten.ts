import { parseISO } from 'date-fns';

import { PuckBlockTimings, PuckBlockVisibility } from './puck-block.model';
import {
  ApiBlock,
  ApiBlockTimings,
  ApiBlockVisibility,
  defaultPuckSlot,
  orderPuckChildren,
} from './puck-blocks';

const toTimings = ({
  from,
  to,
  timeOfDay,
  ...timings
}: ApiBlockTimings): PuckBlockTimings => ({
  ...timings,
  ...(from ? { from: parseISO(from) } : {}),
  ...(to ? { to: parseISO(to) } : {}),
  ...(timeOfDay ?
    { timeOfDay: { from: timeOfDay.from, to: timeOfDay.to } }
  : {}),
});

const toVisibility = ({
  timings,
  ...visibility
}: ApiBlockVisibility): PuckBlockVisibility => ({
  ...visibility,
  ...(timings ? { timings: toTimings(timings) } : {}),
});

export type FlatPuckBlock = Omit<
  ApiBlock,
  'children' | 'puckSlot' | 'visibility'
> & {
  parentId: string | null;
  puckSlot: string | null;
  position: number;
  visibility?: PuckBlockVisibility;
};

const flattenSiblings = (
  siblings: ApiBlock[],
  parentId: string | null
): FlatPuckBlock[] => {
  const positions = new Map<string | null, number>();

  return siblings.flatMap(
    ({ children = [], puckSlot, visibility, ...block }) => {
      const parentSlot =
        parentId === null ? null : (puckSlot ?? defaultPuckSlot);
      const position = positions.get(parentSlot) ?? 0;

      positions.set(parentSlot, position + 1);

      return [
        {
          ...block,
          ...(visibility ? { visibility: toVisibility(visibility) } : {}),
          parentId,
          puckSlot: parentSlot,
          position,
        },
        ...flattenSiblings(orderPuckChildren(children), block.id),
      ];
    }
  );
};

// GraphQL cannot return a tree of unknown depth: a query has to spell out
// every level it selects, so it would nest a fixed number of fragments and
// silently miss deeper blocks. Writes stay a recursive tree because input
// objects may nest arbitrarily; reads get this flat list in depth-first order
// instead, and clients rebuild the tree from parentId, puckSlot and position.
export const flattenPuckBlocks = (blocks: ApiBlock[]): FlatPuckBlock[] =>
  flattenSiblings(blocks, null);
