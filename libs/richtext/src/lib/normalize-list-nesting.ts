import {
  RichtextElements,
  RichtextJSONDocument,
} from './json-format.interface';

type ListType = 'bulletList' | 'orderedList';

const isListItem = (node: RichtextElements) => node.type === 'listItem';

const wrapOrphanListItems = (
  content: RichtextElements[],
  listType: ListType
): RichtextElements[] => {
  const normalized: RichtextElements[] = [];
  let orphanRun: RichtextElements[] = [];

  const flushOrphanRun = () => {
    if (!orphanRun.length) {
      return;
    }

    normalized.push(
      (listType === 'orderedList' ?
        {
          type: 'orderedList',
          attrs: { start: 1 },
          content: orphanRun,
        }
      : {
          type: 'bulletList',
          content: orphanRun,
        }) as RichtextElements
    );
    orphanRun = [];
  };

  for (const child of content) {
    if (isListItem(child)) {
      orphanRun.push(child);
    } else {
      flushOrphanRun();
      normalized.push(child);
    }
  }

  flushOrphanRun();

  return normalized;
};

/**
 * Repairs malformed richtext documents where a listItem directly contains
 * listItem children (produced by legacy editors/migrations). Such structures
 * render as invalid `<li><li>` HTML and cause hydration errors. Consecutive
 * orphaned listItems are wrapped in a synthetic list of the nearest ancestor
 * list type. Valid documents are returned unchanged (same reference).
 */
export const normalizeListNesting = <
  T extends RichtextElements | RichtextJSONDocument,
>(
  node: T,
  parentListType: ListType = 'bulletList'
): T => {
  const listType =
    node.type === 'bulletList' || node.type === 'orderedList' ?
      node.type
    : parentListType;

  const content =
    'content' in node ?
      (node.content as RichtextElements[] | undefined)
    : undefined;

  if (!content?.length) {
    return node;
  }

  const normalizedChildren = content.map(child =>
    normalizeListNesting(child, listType)
  );

  const hasOrphans =
    node.type === 'listItem' && normalizedChildren.some(isListItem);
  const childrenChanged = normalizedChildren.some(
    (child, index) => child !== content[index]
  );

  if (!hasOrphans && !childrenChanged) {
    return node;
  }

  return {
    ...node,
    content:
      hasOrphans ?
        wrapOrphanListItems(normalizedChildren, listType)
      : normalizedChildren,
  };
};
