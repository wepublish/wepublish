export type BlockCatalogEntry = {
  id: string;
  group?: string;
};

export const blockCatalog = [
  { id: 'text' },
  { id: 'media' },
  { id: 'layout' },
  { id: 'teaser', group: 'teaserParts' },
  { id: 'engagement' },
  { id: 'form', group: 'formFields' },
  { id: 'embed' },
] as const satisfies readonly BlockCatalogEntry[];

export type BlockCategoryId = (typeof blockCatalog)[number]['id'];

export type BlockGroupId = Extract<
  (typeof blockCatalog)[number],
  { group: string }
>['group'];

export type BlockGroup<Name extends string = string> = {
  id: string;
  blocks: Name[];
};

export type BlockCategory<
  Id extends string = string,
  Name extends string = string,
> = {
  id: Id;
  blocks: Name[];
  group?: BlockGroup<Name>;
};

export const catalogBlockNames = <Name extends string>(
  catalog: BlockCategory<string, Name>[]
): Name[] =>
  catalog.flatMap(({ blocks, group }) => [...blocks, ...(group?.blocks ?? [])]);
