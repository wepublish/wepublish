import { ComponentData } from '@puckeditor/core';
import { z } from 'zod/v4';

import {
  articleRootSchema,
  blockTimingSchema,
  blockVisibilitySchema,
  borderStyles,
  DatasourceModel,
  DatasourceType,
  hasStylingValue,
  isHexColor,
  isThemeColor,
  listDatasourceTypes,
  pageRootSchema,
  rootPropertySchema,
  spacingSchema,
  stylingSchema,
  StylingValue,
} from '@wepublish/puck-content/editor';
import {
  PuckContent,
  PuckData,
  PuckDocumentKind,
  PuckRootPropsByKind,
} from '../document/document';

const defaultSlot = 'content';

const blockPropKeys = ['id', 'locked', 'visibility', 'styling', 'datasources'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isComponentData = (value: unknown): value is ComponentData =>
  isRecord(value) &&
  typeof value.type === 'string' &&
  isRecord(value.props) &&
  typeof value.props.id === 'string';

const holdsComponent = (value: unknown): boolean =>
  isComponentData(value) ? true
  : Array.isArray(value) ? value.some(holdsComponent)
  : isRecord(value) ? Object.values(value).some(holdsComponent)
  : false;

const blockDataSchema = z
  .record(z.string(), z.json())
  .refine(data => !holdsComponent(data), {
    message: 'Components inside the data belong in children with a slot path',
  })
  .refine(data => !blockPropKeys.some(key => key in data), {
    message: `${blockPropKeys.join(', ')} belong on the block, not inside its data`,
  });

const slotPathSchema = z
  .string()
  .regex(/^[^.[\]]+(\[\d{1,3}\])*(\.[^.[\]]+(\[\d{1,3}\])*)*$/);

const endsAfterItStarts = ({
  timings,
}: z.infer<typeof blockVisibilitySchema>) =>
  !timings?.from ||
  !timings?.to ||
  Date.parse(timings.from) < Date.parse(timings.to);

const apiBlockVisibilitySchema = blockVisibilitySchema
  .extend({ timings: blockTimingSchema.strict().nullish() })
  .strict()
  .refine(endsAfterItStarts, {
    message: 'The block timing has to end after it starts',
    path: ['timings', 'to'],
  });

const apiBlockColorSchema = z
  .string()
  .refine(color => isThemeColor(color) || isHexColor(color), {
    message:
      'Colours are a theme colour path like primary.main or a hex colour',
  });

const apiBlockSidesSchema = <Side extends z.ZodType>(side: Side) =>
  z
    .strictObject({ top: side, right: side, bottom: side, left: side })
    .partial();

const apiBlockStylingSchema = stylingSchema()
  .extend({
    typography: z.string().min(1),
    color: apiBlockColorSchema,
    background: apiBlockColorSchema,
    backgroundImage: z.string().min(1),
    overlay: apiBlockColorSchema,
    margin: apiBlockSidesSchema(spacingSchema),
    padding: apiBlockSidesSchema(spacingSchema),
    border: z
      .strictObject({
        width: apiBlockSidesSchema(z.number().min(0)),
        style: z.enum(borderStyles),
        color: apiBlockColorSchema,
      })
      .partial(),
    borderRadius: z
      .strictObject({
        topLeft: spacingSchema,
        topRight: spacingSchema,
        bottomRight: spacingSchema,
        bottomLeft: spacingSchema,
      })
      .partial(),
  })
  .partial()
  .strict()
  .transform(styling => styling as StylingValue);

const apiBlockListDatasourceSchema = z.strictObject({
  type: z.enum(listDatasourceTypes),
});

const apiBlockDatasourceSchema = z.union([
  apiBlockListDatasourceSchema,
  z.strictObject({ type: z.literal('single'), id: z.string() }),
  z.strictObject({ type: z.literal('multiple'), ids: z.array(z.string()) }),
]);

const apiBlockDatasourcesSchema = z.strictObject({
  article: apiBlockDatasourceSchema.nullish(),
  page: apiBlockDatasourceSchema.nullish(),
  event: apiBlockDatasourceSchema.nullish(),
  image: apiBlockDatasourceSchema.nullish(),
  memberPlan: apiBlockDatasourceSchema.nullish(),
  userSubscription: apiBlockListDatasourceSchema.nullish(),
});

export type ApiBlockData = z.infer<typeof blockDataSchema>;

export type ApiBlockVisibility = z.infer<typeof blockVisibilitySchema>;

export type ApiBlockDatasources = z.infer<typeof apiBlockDatasourcesSchema>;

export type ApiBlock = {
  id: string;
  type: string;
  locked?: boolean;
  visibility?: ApiBlockVisibility;
  styling?: StylingValue;
  datasources?: ApiBlockDatasources;
  data: ApiBlockData;
  slot?: string;
  children?: ApiBlock[];
};

export const apiBlockSchema: z.ZodType<ApiBlock> = z.strictObject({
  id: z.string().min(1),
  type: z.string().min(1),
  locked: z.boolean().optional(),
  visibility: apiBlockVisibilitySchema.optional(),
  styling: apiBlockStylingSchema.optional(),
  datasources: apiBlockDatasourcesSchema.optional(),
  data: blockDataSchema,
  slot: slotPathSchema.optional(),
  get children() {
    return z.array(apiBlockSchema).optional();
  },
});

export const apiBlocksSchema = z.array(apiBlockSchema);

type GraphQLOutput<T> =
  T extends readonly (infer Item)[] ? GraphQLOutput<Item>[]
  : T extends object ?
    { [Key in keyof T]?: GraphQLOutput<T[Key]> | null } & {
      __typename?: string;
    }
  : T;

export type FlatApiBlockDatasources = GraphQLOutput<{
  [Model in DatasourceModel]: {
    type: DatasourceType;
    id: string;
    ids: string[];
  };
}>;

export type FlatApiBlock = {
  __typename?: string;
  id: string;
  type: string;
  parentId?: string | null;
  slot?: string | null;
  position: number;
  locked?: boolean | null;
  visibility?: GraphQLOutput<ApiBlockVisibility> | null;
  styling?: GraphQLOutput<StylingValue> | null;
  datasources?: FlatApiBlockDatasources | null;
  data: ApiBlockData;
};

export type ApiDocument<K extends PuckDocumentKind = PuckDocumentKind> = {
  blocks: ApiBlock[];
  rootProps: PuckRootPropsByKind[K];
};

type PathKey = string | number;

type SlotContent = { slot: string; content: ComponentData[] };

const isFilledSlot = (value: unknown): value is ComponentData[] =>
  Array.isArray(value) && value.length > 0 && value.every(isComponentData);

const propPath = (parent: string, key: string) =>
  parent ? `${parent}.${key}` : key;

const toPathKeys = (path: string): PathKey[] =>
  path.split('.').flatMap(segment => {
    const [key, ...indexes] = segment.split('[');

    return [key, ...indexes.map(index => Number.parseInt(index, 10))];
  });

const setAtPath = (
  target: unknown,
  keys: PathKey[],
  value: unknown
): unknown => {
  if (!keys.length) {
    return value;
  }

  const [key, ...rest] = keys;

  if (typeof key === 'number') {
    const items: unknown[] = Array.isArray(target) ? [...target] : [];
    items[key] = setAtPath(items[key], rest, value);

    return items;
  }

  const record: Record<string, unknown> = isRecord(target) ? target : {};

  return { ...record, [key]: setAtPath(record[key], rest, value) };
};

const groupBySlot = (children: ApiBlock[]) =>
  children.reduce((slots, child) => {
    const slot = child.slot ?? defaultSlot;

    return slots.set(slot, [...(slots.get(slot) ?? []), child]);
  }, new Map<string, ApiBlock[]>());

const withChildren = (
  props: Record<string, unknown>,
  children: ApiBlock[]
): Record<string, unknown> =>
  Array.from(groupBySlot(children)).reduce(
    (result, [slot, slotChildren]) =>
      setAtPath(
        result,
        toPathKeys(slot),
        toPuckContent(slotChildren)
      ) as Record<string, unknown>,
    props
  );

const withoutBlockProps = (props: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(props).filter(([key]) => !blockPropKeys.includes(key))
  );

export const toPuckContent = (blocks: ApiBlock[]): ComponentData[] =>
  blocks.map(
    ({
      id,
      type,
      locked,
      visibility,
      styling,
      datasources,
      data,
      children = [],
    }) => ({
      type,
      props: {
        ...withChildren(withoutBlockProps(data), children),
        id,
        ...(locked ? { locked } : {}),
        ...(visibility ? { visibility } : {}),
        ...(styling ? { styling } : {}),
        ...(datasources ? { datasources } : {}),
      },
    })
  );

const slotsOf = (value: unknown, path: string): SlotContent[] =>
  isFilledSlot(value) ? [{ slot: path, content: value }]
  : Array.isArray(value) ?
    value.flatMap((item, index) => slotsOf(item, `${path}[${index}]`))
  : isRecord(value) ?
    Object.entries(value).flatMap(([key, entry]) =>
      slotsOf(entry, propPath(path, key))
    )
  : [];

const withEmptySlots = (value: unknown): unknown =>
  isFilledSlot(value) ? []
  : Array.isArray(value) ? value.map(withEmptySlots)
  : isRecord(value) ?
    Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, withEmptySlots(entry)])
    )
  : value;

const toPlainJson = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(toPlainJson)
  : isRecord(value) ?
    Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, toPlainJson(entry)])
    )
  : value;

const withoutGraphQLExtras = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(withoutGraphQLExtras)
  : isRecord(value) ?
    Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, entry]) =>
            key !== '__typename' && entry !== null && entry !== undefined
        )
        .map(([key, entry]) => [key, withoutGraphQLExtras(entry)])
    )
  : value;

const withoutEmptyStyling = (value: unknown): unknown =>
  isRecord(value) ?
    Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => hasStylingValue(entry))
        .map(([key, entry]) => [key, withoutEmptyStyling(entry)])
    )
  : value;

const toStoredStyling = (styling: unknown): StylingValue | undefined => {
  const stored = withoutEmptyStyling(withoutGraphQLExtras(styling));

  return hasStylingValue(stored) ? (stored as StylingValue) : undefined;
};

const datasourceKeysOf = (type: unknown) =>
  type === 'single' ? ['type', 'id']
  : type === 'multiple' ? ['type', 'ids']
  : ['type'];

const toStoredDatasource = (datasource: unknown): unknown => {
  if (!isRecord(datasource)) {
    return datasource;
  }

  const keys = datasourceKeysOf(datasource.type);

  return Object.fromEntries(
    Object.entries(datasource).filter(([key]) => keys.includes(key))
  );
};

const toStoredDatasources = (datasources: unknown) =>
  (isRecord(datasources) ?
    Object.fromEntries(
      Object.entries(datasources).map(([model, datasource]) => [
        model,
        toStoredDatasource(datasource),
      ])
    )
  : datasources) as ApiBlockDatasources;

const toApiBlock = ({ type, props }: ComponentData, slot: string): ApiBlock => {
  const { id, locked, visibility, styling, datasources, ...rest } = props;
  const storedStyling = toStoredStyling(styling);
  const children = slotsOf(rest, '').flatMap(({ slot: childSlot, content }) =>
    content.map(child => toApiBlock(child, childSlot))
  );

  return {
    id,
    type,
    ...(locked ? { locked: true } : {}),
    ...(visibility ?
      { visibility: toPlainJson(visibility) as ApiBlockVisibility }
    : {}),
    ...(storedStyling ? { styling: storedStyling } : {}),
    ...(datasources ?
      { datasources: toStoredDatasources(toPlainJson(datasources)) }
    : {}),
    data: toPlainJson(withEmptySlots(rest)) as ApiBlockData,
    ...(slot === defaultSlot ? {} : { slot }),
    ...(children.length ? { children } : {}),
  };
};

export const toApiBlocks = (content: PuckContent): ApiBlock[] =>
  content.map(component => toApiBlock(component, defaultSlot));

const toFlatBlocks = (
  blocks: ApiBlock[],
  parentId: string | null
): FlatApiBlock[] => {
  const positions = new Map<string, number>();

  return blocks.flatMap(({ slot, children = [], ...block }) => {
    const slotPath = parentId === null ? defaultSlot : (slot ?? defaultSlot);
    const position = positions.get(slotPath) ?? 0;

    positions.set(slotPath, position + 1);

    return [
      {
        ...block,
        parentId,
        slot: parentId === null ? null : slotPath,
        position,
      },
      ...toFlatBlocks(children, block.id),
    ];
  });
};

export const toFlatPuckBlocks = (blocks: ApiBlock[]): FlatApiBlock[] =>
  toFlatBlocks(blocks, null);

type FlatBlock = Omit<
  FlatApiBlock,
  '__typename' | 'visibility' | 'styling' | 'datasources' | 'data'
> & {
  visibility?: unknown;
  styling?: unknown;
  datasources?: unknown;
  data: Record<string, unknown>;
};

const slotOf = ({ slot }: FlatBlock) => slot ?? defaultSlot;

const inSlotOrder = (siblings: FlatBlock[]) =>
  Array.from(new Set(siblings.map(slotOf))).flatMap(slot =>
    siblings
      .filter(sibling => slotOf(sibling) === slot)
      .sort((a, b) => a.position - b.position)
  );

const childrenByParent = (flat: FlatBlock[]) =>
  flat.reduce((groups, block) => {
    const parentId = block.parentId ?? null;

    return groups.set(parentId, [...(groups.get(parentId) ?? []), block]);
  }, new Map<string | null, FlatBlock[]>());

const toTreeBlock = (
  {
    id,
    type,
    parentId,
    slot,
    locked,
    visibility,
    styling,
    datasources,
    data,
  }: FlatBlock,
  children: ApiBlock[]
): ApiBlock => {
  const storedStyling = toStoredStyling(styling);

  return {
    id,
    type,
    ...(locked ? { locked: true } : {}),
    ...(isRecord(visibility) ?
      { visibility: withoutGraphQLExtras(visibility) as ApiBlockVisibility }
    : {}),
    ...(storedStyling ? { styling: storedStyling } : {}),
    ...(isRecord(datasources) ?
      { datasources: toStoredDatasources(withoutGraphQLExtras(datasources)) }
    : {}),
    data: data as ApiBlockData,
    ...(parentId && slot && slot !== defaultSlot ? { slot } : {}),
    ...(children.length ? { children } : {}),
  };
};

const rebuildTree = (flat: FlatBlock[]): ApiBlock[] => {
  const childrenOf = childrenByParent(flat);
  const placed = new Set<string>();

  const toTree = (siblings: FlatBlock[]): ApiBlock[] => {
    const unplaced = inSlotOrder(siblings).filter(({ id }) => !placed.has(id));

    unplaced.forEach(({ id }) => placed.add(id));

    return unplaced.map(block =>
      toTreeBlock(block, toTree(childrenOf.get(block.id) ?? []))
    );
  };

  return toTree(childrenOf.get(null) ?? []);
};

// GraphQL cannot return a tree of unknown depth: every query would have to
// spell out a fixed nesting depth and silently miss deeper blocks. So the API
// returns a flat list in tree order with parentId, slot and position, and the
// tree is rebuilt here.
export const fromFlatPuckBlocks = (flat: FlatApiBlock[]): ApiBlock[] =>
  rebuildTree(flat);

const countBlocks = (blocks: ApiBlock[]): number =>
  blocks.reduce(
    (count, { children = [] }) => count + 1 + countBlocks(children),
    0
  );

const hasUniqueIds = (blocks: FlatBlock[]) =>
  new Set(blocks.map(({ id }) => id)).size === blocks.length;

const nullableRecordSchema = z.record(z.string(), z.unknown()).nullish();

const flatApiBlocksSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      type: z.string().min(1),
      parentId: z.string().min(1).nullish(),
      slot: slotPathSchema.nullish(),
      position: z.number().int().min(0),
      locked: z.boolean().nullish(),
      visibility: nullableRecordSchema,
      styling: nullableRecordSchema,
      datasources: nullableRecordSchema,
      data: z.record(z.string(), z.unknown()),
    })
  )
  .refine(hasUniqueIds, { message: 'Every block needs an id of its own' })
  .transform((blocks, context) => {
    const tree = rebuildTree(blocks);

    if (countBlocks(tree) !== blocks.length) {
      context.issues.push({
        code: 'custom',
        message: 'Every block needs its parent in the list',
        input: blocks,
      });

      return z.NEVER;
    }

    return tree;
  });

const withoutEmptyValues = (value: unknown) =>
  value && typeof value === 'object' ?
    Object.fromEntries(
      Object.entries(value).filter(
        ([, entry]) => entry !== null && entry !== ''
      )
    )
  : value;

const storedRootShape = {
  slug: z.string(),
  properties: z.array(rootPropertySchema.extend({ key: z.string() })),
};

const storedPageRootSchema = pageRootSchema.extend(storedRootShape).partial();

const storedArticleRootSchema = articleRootSchema
  .extend(storedRootShape)
  .partial();

const rootPropsParsers: {
  [K in PuckDocumentKind]: (metadata: unknown) => PuckRootPropsByKind[K];
} = {
  page: metadata => storedPageRootSchema.parse(metadata),
  article: metadata => storedArticleRootSchema.parse(metadata),
};

export const toPuckRootProps = <K extends PuckDocumentKind>(
  kind: K,
  metadata: unknown = {}
): PuckRootPropsByKind[K] =>
  rootPropsParsers[kind](withoutEmptyValues(metadata));

const puckDataOf: {
  [K in PuckDocumentKind]: (
    content: PuckContent,
    metadata: unknown
  ) => PuckData<K>;
} = {
  page: (content, metadata) => ({
    root: { props: toPuckRootProps('page', metadata) },
    content,
  }),
  article: (content, metadata) => ({
    root: { props: toPuckRootProps('article', metadata) },
    content,
  }),
};

export const toPuckData = <K extends PuckDocumentKind>(
  kind: K,
  flatBlocks: unknown,
  metadata?: unknown
): PuckData<K> =>
  puckDataOf[kind](
    toPuckContent(
      apiBlocksSchema.parse(flatApiBlocksSchema.parse(flatBlocks))
    ) as PuckContent,
    metadata
  );

const rootPropsOf: {
  [K in PuckDocumentKind]: (data: PuckData<K>) => PuckRootPropsByKind[K];
} = {
  page: ({ root }) => root.props ?? {},
  article: ({ root }) => root.props ?? {},
};

export const toApiDocument = <K extends PuckDocumentKind>(
  kind: K,
  data: PuckData<K>
): ApiDocument<K> => ({
  blocks: apiBlocksSchema.parse(toApiBlocks(data.content)),
  rootProps: rootPropsOf[kind](data),
});
