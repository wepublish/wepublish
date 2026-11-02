import {
  BlockCategory,
  BlockCategoryId,
  blockCatalog,
  catalogBlockNames,
} from './block-library.catalog';

export type BlockMeta = {
  category?: string;
  group?: string;
  order?: number;
  hidden?: boolean;
};

export const blockCategoryKey = (id: string) => `puck.blocks.categories.${id}`;
export const blockGroupKey = (id: string) => `puck.blocks.groups.${id}`;
export const blockGroupHintKey = (id: string) => `puck.blocks.groupHints.${id}`;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const pickBlocks = (
  category: BlockCategory,
  keep: (name: string) => boolean,
  keepGroup = false
): BlockCategory[] => {
  const blocks = category.blocks.filter(keep);
  const groupBlocks =
    keepGroup ?
      (category.group?.blocks ?? [])
    : (category.group?.blocks.filter(keep) ?? []);

  if (!blocks.length && !groupBlocks.length) {
    return [];
  }

  return [
    {
      id: category.id,
      blocks,
      ...(category.group && groupBlocks.length ?
        { group: { id: category.group.id, blocks: groupBlocks } }
      : {}),
    },
  ];
};

export const filterCatalog = (
  catalog: BlockCategory[],
  query: string,
  labelOf: (key: string) => string
): BlockCategory[] => {
  const needle = normalize(query.trim());

  if (!needle) {
    return catalog;
  }

  const matches = (key: string) =>
    normalize(labelOf(key)).includes(needle) || normalize(key).includes(needle);

  return catalog.flatMap(category =>
    matches(category.id) ?
      [category]
    : pickBlocks(
        category,
        matches,
        !!category.group && matches(category.group.id)
      )
  );
};

export const countBlocks = (catalog: BlockCategory[]) =>
  catalogBlockNames(catalog).length;

const byOrder =
  (components: Record<string, BlockMeta>) => (a: string, b: string) =>
    (components[a]?.order ?? Infinity) - (components[b]?.order ?? Infinity) ||
    a.localeCompare(b);

export const catalogFromComponents = <Name extends string>(
  components: Record<Name, BlockMeta>
): BlockCategory<string, Name>[] => {
  const names = (Object.keys(components) as Name[])
    .filter(name => !components[name].hidden)
    .sort(byOrder(components));
  const known = new Set<string>(blockCatalog.map(({ id }) => id));

  const categories = blockCatalog.flatMap(
    (category): BlockCategory<string, Name>[] => {
      const groupId = 'group' in category ? category.group : undefined;
      const members = names.filter(
        name => components[name].category === category.id
      );
      const grouped = members.filter(
        name => groupId && components[name].group === groupId
      );
      const blocks = members.filter(name => !grouped.includes(name));

      if (!members.length) {
        return [];
      }

      return [
        {
          id: category.id,
          blocks,
          ...(groupId && grouped.length ?
            { group: { id: groupId, blocks: grouped } }
          : {}),
        },
      ];
    }
  );

  const other = names.filter(
    name => !known.has(components[name].category ?? '')
  );

  return other.length ?
      [...categories, { id: 'other', blocks: other }]
    : categories;
};

export const puckCategories = <Name extends string>(
  components: Record<Name, BlockMeta>
) => {
  const categories = {} as Record<BlockCategoryId, { components: Name[] }>;

  for (const category of catalogFromComponents(components)) {
    if (category.id !== 'other') {
      categories[category.id as BlockCategoryId] = {
        components: catalogBlockNames([category]),
      };
    }
  }

  return { ...categories, other: { visible: false } };
};
