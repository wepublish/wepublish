import { ComponentData } from '@puckeditor/core';
import {
  FullPuckBlockFragment,
  PuckBackgroundSize,
  PuckBlockDatasourceInput,
  PuckBlockDatasourcesInput,
  PuckBlockInput,
  PuckBlockBreakpointStylingInput,
  PuckBlockKind,
  PuckBlockStylingInput,
  PuckBlockTimingsInput,
  PuckBlockVisibilityInput,
  PuckBorderInput,
  PuckBorderStyle,
  PuckBreakpoint,
  PuckCornerShape,
  PuckDatasourceType,
  PuckFontWeight,
  PuckListDatasourceType,
  PuckTextAlign,
  PuckTextTransform,
  PuckWeekday,
} from '@wepublish/editor/api';
import {
  buildPuckBlockTree,
  defaultPuckSlot,
  PuckBlockNode,
} from '@wepublish/puck-content/website';

import {
  BlockTiming,
  BlockVisibilityValue,
} from '../block-visibility/block-visibility.field';
import { BorderValue } from '../border/border.field';
import { puckBlockConsumes, puckDerivedDatasources } from '../config';
import { Datasource, DatasourcesValue } from '../datasource/datasource.field';
import {
  BreakpointStylingValue,
  hasStylingValue,
  StylingValue,
  toBreakpointStyling,
} from '../styling/styling.field';
import {
  compact,
  enumMember,
  ifPresent,
  isRecord,
  toPlainJson,
  withoutGraphQLExtras,
} from './graphql-values';
import { PuckDynamicConfig } from './puck-registry';

export type PuckSlotConfig = {
  components: Partial<Record<string, { fields?: unknown }>>;
};

export type DerivedDatasources = Partial<
  Record<string, (props: Record<string, unknown>) => DatasourcesValue>
>;

export type BlockConsumes = Partial<
  Record<string, (props: Record<string, unknown>) => number | undefined>
>;

export type ToPuckBlockInputsOptions = {
  config: PuckSlotConfig;
  dynamicConfig?: PuckDynamicConfig;
  derivedDatasources?: DerivedDatasources;
  blockConsumes?: BlockConsumes;
};

export type LoadedPuckContent =
  | { content: ComponentData[]; error?: undefined }
  | { content?: undefined; error: Error };

type BlockKind = `${PuckBlockKind}`;

type PathKey = string | number;

type Slot = { slot: string; keys: PathKey[] };

type SlotContent = { slot: string; content: ComponentData[] };

const blockPropKeys = [
  'id',
  'locked',
  'grouped',
  'visibility',
  'styling',
  'datasources',
];

const isComponentData = (value: unknown): value is ComponentData =>
  isRecord(value) &&
  typeof value.type === 'string' &&
  isRecord(value.props) &&
  typeof value.props.id === 'string';

const isFilledSlot = (value: unknown): value is ComponentData[] =>
  Array.isArray(value) && value.length > 0 && value.every(isComponentData);

const propPath = (parent: string, key: string) =>
  parent ? `${parent}.${key}` : key;

const toPathKeys = (path: string): PathKey[] =>
  path.split('.').flatMap(segment => {
    const [key, ...indexes] = segment.split('[');

    return [key, ...indexes.map(index => Number.parseInt(index, 10))];
  });

const getAtPath = (target: unknown, keys: PathKey[]): unknown =>
  keys.reduce<unknown>(
    (value, key) =>
      typeof key === 'number' ?
        Array.isArray(value) ?
          value[key]
        : undefined
      : isRecord(value) ? value[key]
      : undefined,
    target
  );

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

const withoutBlockProps = (props: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(props).filter(([key]) => !blockPropKeys.includes(key))
  );

const configSlotPaths = (
  fields: unknown,
  value: unknown,
  parent: string
): string[] =>
  isRecord(fields) ?
    Object.entries(fields).flatMap(([name, field]) => {
      const path = propPath(parent, name);
      const entry = isRecord(value) ? value[name] : undefined;

      if (!isRecord(field)) {
        return [];
      }

      switch (field.type) {
        case 'slot':
          return [path];
        case 'array':
          return Array.isArray(entry) ?
              entry.flatMap((item, index) =>
                configSlotPaths(field.arrayFields, item, `${path}[${index}]`)
              )
            : [];
        case 'object':
          return configSlotPaths(field.objectFields, entry, path);
        default:
          return [];
      }
    })
  : [];

const shapeSlotPaths = (value: unknown, path: string): string[] =>
  isFilledSlot(value) ? [path]
  : Array.isArray(value) ?
    value.flatMap((item, index) => shapeSlotPaths(item, `${path}[${index}]`))
  : isRecord(value) ?
    Object.entries(value).flatMap(([key, entry]) =>
      shapeSlotPaths(entry, propPath(path, key))
    )
  : [];

const slotFieldNames = (fields: unknown): string[] =>
  isRecord(fields) ?
    Object.entries(fields).flatMap(([name, field]) =>
      isRecord(field) && field.type === 'slot' ? [name] : []
    )
  : [];

const toPathSlot = (path: string): Slot => ({
  slot: path,
  keys: toPathKeys(path),
});

const toNamedSlot = (name: string): Slot => ({ slot: name, keys: [name] });

const declaredSlots = (
  kind: BlockKind,
  type: string,
  props: Record<string, unknown>,
  { config, dynamicConfig }: ToPuckBlockInputsOptions
): Slot[] => {
  const fields = config.components[type]?.fields;

  return kind === 'generated' ?
      Array.from(
        new Set([
          ...slotFieldNames(fields),
          ...slotFieldNames(dynamicConfig?.components[type]?.fields),
        ]),
        toNamedSlot
      )
    : configSlotPaths(fields, props, '').map(toPathSlot);
};

const remainingSlots = (
  kind: BlockKind,
  props: Record<string, unknown>
): Slot[] =>
  kind === 'generated' ?
    Object.entries(props)
      .filter(([, value]) => isFilledSlot(value))
      .map(([name]) => toNamedSlot(name))
  : shapeSlotPaths(props, '').map(toPathSlot);

const takeSlots = (props: Record<string, unknown>, slots: Slot[]) =>
  slots.reduce<{ props: Record<string, unknown>; slots: SlotContent[] }>(
    (taken, { slot, keys }) => {
      const value = getAtPath(taken.props, keys);

      return Array.isArray(value) ?
          {
            props: setAtPath(taken.props, keys, []) as Record<string, unknown>,
            slots: [
              ...taken.slots,
              { slot, content: value.filter(isComponentData) },
            ],
          }
        : taken;
    },
    { props, slots: [] }
  );

const withoutEmptyStyling = (value: unknown): unknown =>
  isRecord(value) ?
    Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => hasStylingValue(entry))
        .map(([key, entry]) => [key, withoutEmptyStyling(entry)])
    )
  : value;

const toStoredStyling = (
  styling: unknown
): BreakpointStylingValue | undefined => {
  const stored = withoutEmptyStyling(
    toBreakpointStyling(withoutGraphQLExtras(styling))
  );

  return hasStylingValue(stored) ?
      (stored as BreakpointStylingValue)
    : undefined;
};

const datasourceKeysOf = (type: unknown) =>
  type === 'single' ? ['type', 'id']
  : type === 'multiple' ? ['type', 'ids']
  : ['type'];

const toStoredDatasource = (datasource: unknown): unknown =>
  isRecord(datasource) ?
    Object.fromEntries(
      Object.entries(datasource).filter(([key]) =>
        datasourceKeysOf(datasource.type).includes(key)
      )
    )
  : datasource;

const toStoredDatasources = (datasources: unknown) =>
  (isRecord(datasources) ?
    Object.fromEntries(
      Object.entries(datasources).map(([model, datasource]) => [
        model,
        toStoredDatasource(datasource),
      ])
    )
  : datasources) as DatasourcesValue;

const toBorderInput = ({ width, style, color }: BorderValue): PuckBorderInput =>
  compact({
    width: ifPresent(width, compact),
    style: ifPresent(style, value => enumMember(PuckBorderStyle, value)),
    color,
  });

const toStylingInput = ({
  textAlign,
  fontWeight,
  textTransform,
  backgroundSize,
  border,
  cornerShape,
  ...styling
}: StylingValue): PuckBlockStylingInput => ({
  ...styling,
  ...compact({
    textAlign: ifPresent(textAlign, value => enumMember(PuckTextAlign, value)),
    fontWeight: ifPresent(fontWeight, value =>
      enumMember(PuckFontWeight, value)
    ),
    textTransform: ifPresent(textTransform, value =>
      enumMember(PuckTextTransform, value)
    ),
    backgroundSize: ifPresent(backgroundSize, value =>
      enumMember(PuckBackgroundSize, value)
    ),
    border: ifPresent(border, toBorderInput),
    cornerShape: ifPresent(cornerShape, value =>
      enumMember(PuckCornerShape, value)
    ),
  }),
});

const toBreakpointStylingInput = (
  styling: BreakpointStylingValue
): PuckBlockBreakpointStylingInput =>
  Object.fromEntries(
    Object.entries(styling).map(([breakpoint, value]) => [
      breakpoint,
      toStylingInput(value),
    ])
  );

const toTimingsInput = ({
  from,
  to,
  weekdays,
  timeOfDay,
}: BlockTiming): PuckBlockTimingsInput =>
  compact({
    from,
    to,
    weekdays: weekdays?.map(weekday => enumMember(PuckWeekday, weekday)),
    timeOfDay,
  });

const toVisibilityInput = ({
  disabled,
  timings,
  breakpoints,
}: BlockVisibilityValue): PuckBlockVisibilityInput =>
  compact({
    disabled,
    breakpoints: breakpoints?.map(breakpoint =>
      enumMember(PuckBreakpoint, breakpoint)
    ),
    timings: ifPresent(timings, toTimingsInput),
  });

const toDatasourceInput = (
  datasource: Datasource
): PuckBlockDatasourceInput => ({
  ...datasource,
  type: enumMember(PuckDatasourceType, datasource.type),
});

const toDatasourcesInput = ({
  article,
  page,
  event,
  image,
  memberPlan,
  userSubscription,
}: DatasourcesValue): PuckBlockDatasourcesInput =>
  compact({
    article: ifPresent(article, toDatasourceInput),
    page: ifPresent(page, toDatasourceInput),
    event: ifPresent(event, toDatasourceInput),
    image: ifPresent(image, toDatasourceInput),
    memberPlan: ifPresent(memberPlan, toDatasourceInput),
    userSubscription: ifPresent(userSubscription, ({ type }) => ({
      type: enumMember(PuckListDatasourceType, type),
    })),
  });

const kindOf = (
  type: string,
  dynamicConfig: PuckDynamicConfig | undefined
): BlockKind =>
  dynamicConfig && Object.hasOwn(dynamicConfig.components, type) ?
    'generated'
  : 'puck';

const derivedDatasourcesOf = (
  type: string,
  props: Record<string, unknown>,
  derivedDatasources: DerivedDatasources
): DatasourcesValue | undefined => derivedDatasources[type]?.(props);

const consumesOf = (
  kind: BlockKind,
  type: string,
  props: Record<string, unknown>,
  blockConsumes: BlockConsumes
) => (kind === 'puck' ? blockConsumes[type]?.(props) : undefined);

const toInputDatasources = (
  datasources: unknown,
  derived: DatasourcesValue | undefined
): DatasourcesValue | undefined =>
  datasources === undefined || datasources === null ?
    derived
  : { ...toStoredDatasources(toPlainJson(datasources)), ...derived };

const toBlockInput = (
  { type, props }: ComponentData,
  puckSlot: string,
  options: ToPuckBlockInputsOptions
): PuckBlockInput => {
  const { id, locked, grouped, visibility, styling, datasources, ...rest } =
    props;
  const kind = kindOf(type, options.dynamicConfig);
  const declared = takeSlots(rest, declaredSlots(kind, type, rest, options));
  const remaining = takeSlots(
    declared.props,
    remainingSlots(kind, declared.props)
  );
  const children = [...declared.slots, ...remaining.slots].flatMap(
    ({ slot, content }) =>
      content.map(child => toBlockInput(child, slot, options))
  );
  const inputDatasources = toInputDatasources(
    datasources,
    derivedDatasourcesOf(
      type,
      rest,
      options.derivedDatasources ?? puckDerivedDatasources
    )
  );

  return {
    id,
    kind: enumMember(PuckBlockKind, kind),
    type,
    ...compact({
      locked: locked ? true : undefined,
      grouped: grouped ? true : undefined,
      visibility: ifPresent<BlockVisibilityValue, PuckBlockVisibilityInput>(
        visibility,
        toVisibilityInput
      ),
      styling: ifPresent(toStoredStyling(styling), toBreakpointStylingInput),
      datasources: ifPresent(inputDatasources, toDatasourcesInput),
      consumes: consumesOf(
        kind,
        type,
        props,
        options.blockConsumes ?? puckBlockConsumes
      ),
    }),
    props: toPlainJson(remaining.props),
    ...(puckSlot !== defaultPuckSlot && { puckSlot }),
    ...(children.length > 0 && { children }),
  };
};

export const toPuckBlockInputs = (
  content: readonly ComponentData[],
  options: ToPuckBlockInputsOptions
): PuckBlockInput[] =>
  content.map(component => toBlockInput(component, defaultPuckSlot, options));

const withoutDerived = (
  datasources: DatasourcesValue,
  derived: DatasourcesValue | undefined
): DatasourcesValue | undefined => {
  if (!derived) {
    return datasources;
  }

  const kept = Object.fromEntries(
    Object.entries(datasources).filter(([model]) => !(model in derived))
  );

  return Object.keys(kept).length ? kept : undefined;
};

const toLoadedDatasources = (
  datasources: unknown,
  derived: DatasourcesValue | undefined
): DatasourcesValue | undefined =>
  isRecord(datasources) ?
    withoutDerived(
      toStoredDatasources(withoutGraphQLExtras(datasources)),
      derived
    )
  : undefined;

const toComponent = (
  { block, slots }: PuckBlockNode<FullPuckBlockFragment>,
  derivedDatasources: DerivedDatasources
): ComponentData => {
  const props = withoutBlockProps(isRecord(block.props) ? block.props : {});
  const withChildren = Array.from(slots).reduce<Record<string, unknown>>(
    (result, [slot, nodes]) => {
      const content = nodes.map(node => toComponent(node, derivedDatasources));

      return block.kind === PuckBlockKind.Generated ?
          { ...result, [slot]: content }
        : (setAtPath(result, toPathKeys(slot), content) as Record<
            string,
            unknown
          >);
    },
    props
  );
  const styling = toStoredStyling(block.styling);
  const datasources = toLoadedDatasources(
    block.datasources,
    derivedDatasourcesOf(block.type, props, derivedDatasources)
  );

  return {
    type: block.type,
    props: {
      ...withChildren,
      id: block.id,
      ...(block.locked && { locked: true }),
      ...(block.grouped && { grouped: true }),
      ...(isRecord(block.visibility) && {
        visibility: withoutGraphQLExtras(block.visibility),
      }),
      ...(styling && { styling }),
      ...(datasources && { datasources }),
    },
  };
};

export const fromPuckBlocks = (
  blocks: readonly FullPuckBlockFragment[],
  {
    derivedDatasources = puckDerivedDatasources,
  }: { derivedDatasources?: DerivedDatasources } = {}
): LoadedPuckContent => {
  const { roots, unplaced } = buildPuckBlockTree(blocks);

  if (unplaced.length) {
    return {
      error: new Error(
        `The puck blocks ${unplaced.map(({ id }) => id).join(', ')} have no place in the document`
      ),
    };
  }

  return { content: roots.map(node => toComponent(node, derivedDatasources)) };
};
