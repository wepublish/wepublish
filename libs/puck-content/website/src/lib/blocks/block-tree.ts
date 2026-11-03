export const defaultPuckSlot = 'content';

export type FlatPuckBlockLike = {
  id: string;
  parentId?: string | null;
  puckSlot?: string | null;
  position: number;
};

export type PuckBlockNode<B> = {
  block: B;
  slots: ReadonlyMap<string, PuckBlockNode<B>[]>;
};

const slotOf = ({ puckSlot }: FlatPuckBlockLike) => puckSlot ?? defaultPuckSlot;

const byPosition = <B extends FlatPuckBlockLike>(blocks: B[]) =>
  [...blocks].sort((a, b) => a.position - b.position);

const groupBySlot = <B extends FlatPuckBlockLike>(children: B[]) =>
  children.reduce(
    (slots, child) =>
      slots.set(slotOf(child), [...(slots.get(slotOf(child)) ?? []), child]),
    new Map<string, B[]>()
  );

const childrenByParent = <B extends FlatPuckBlockLike>(flat: readonly B[]) =>
  flat.reduce((groups, block) => {
    const parentId = block.parentId ?? null;

    return groups.set(parentId, [...(groups.get(parentId) ?? []), block]);
  }, new Map<string | null, B[]>());

// GraphQL cannot return a tree of unknown depth: every query would have to
// spell out a fixed nesting depth and silently miss deeper blocks. So the API
// returns a flat list in tree order with parentId, puckSlot and position, and
// the tree is rebuilt here.
export const buildPuckBlockTree = <B extends FlatPuckBlockLike>(
  flat: readonly B[]
): { roots: PuckBlockNode<B>[]; unplaced: B[] } => {
  const childrenOf = childrenByParent(flat);
  const placedIds = new Set<string>();
  const placed = new Set<B>();

  const place = (block: B) => {
    if (placedIds.has(block.id)) {
      return false;
    }

    placedIds.add(block.id);
    placed.add(block);

    return true;
  };

  const toNodes = (siblings: B[]): PuckBlockNode<B>[] =>
    siblings.filter(place).map(block => ({
      block,
      slots: new Map(
        [...groupBySlot(childrenOf.get(block.id) ?? [])]
          .map(([slot, children]): [string, PuckBlockNode<B>[]] => [
            slot,
            toNodes(byPosition(children)),
          ])
          .filter(([, nodes]) => nodes.length > 0)
      ),
    }));

  const roots = toNodes(byPosition(childrenOf.get(null) ?? []));

  return { roots, unplaced: flat.filter(block => !placed.has(block)) };
};
