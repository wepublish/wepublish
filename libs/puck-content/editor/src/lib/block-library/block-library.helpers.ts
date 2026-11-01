import { BlockCategory, catalogBlockNames } from './block-library.catalog';

export const blockLabelKey = (name: string) => `puck.blocks.names.${name}`;
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

export const restrictCatalog = (
  catalog: BlockCategory[],
  available: (name: string) => boolean
): BlockCategory[] =>
  catalog.flatMap(category => pickBlocks(category, available));

export const countBlocks = (catalog: BlockCategory[]) =>
  catalogBlockNames(catalog).length;

export const puckCategories = <Id extends string, Name extends string>(
  catalog: BlockCategory<Id, Name>[]
) => {
  const categories = {} as Record<Id, { components: Name[] }>;

  for (const category of catalog) {
    categories[category.id] = { components: catalogBlockNames([category]) };
  }

  return { ...categories, other: { visible: false } };
};
