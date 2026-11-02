import {
  ComponentData,
  Config,
  Data,
  Fields,
  Permissions,
  PuckApi,
} from '@puckeditor/core';

type GroupableBlock = { props: { id: string; grouped?: boolean } };

type TypedBlock = GroupableBlock & { type: string };

type GroupData = Pick<Data, 'content'> & Partial<Pick<Data, 'zones'>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isComponent = (value: unknown): value is ComponentData =>
  isRecord(value) &&
  typeof value.type === 'string' &&
  isRecord(value.props) &&
  typeof value.props.id === 'string';

const nestedComponents = (value: unknown): ComponentData[] =>
  isComponent(value) ? [value]
  : Array.isArray(value) ? value.flatMap(nestedComponents)
  : isRecord(value) ? Object.values(value).flatMap(nestedComponents)
  : [];

const childrenOf = (block: ComponentData) =>
  Object.values(block.props).flatMap(nestedComponents);

const findPath = (
  blocks: ComponentData[],
  id: string
): ComponentData[] | undefined => {
  for (const block of blocks) {
    if (block.props.id === id) {
      return [block];
    }

    const path = findPath(childrenOf(block), id);

    if (path) {
      return [block, ...path];
    }
  }

  return undefined;
};

const topLevelBlocks = ({ content, zones }: GroupData) => [
  ...content,
  ...Object.values(zones ?? {}).flat(),
];

const pathTo = (data: GroupData, id: string) =>
  findPath(topLevelBlocks(data), id) ?? [];

const allBlocks = (blocks: ComponentData[]): ComponentData[] =>
  blocks.flatMap(block => [block, ...allBlocks(childrenOf(block))]);

const hasSlotField = (fields: Fields | undefined): boolean =>
  Object.values(fields ?? {}).some(
    field =>
      field.type === 'slot' ||
      (field.type === 'array' && hasSlotField(field.arrayFields)) ||
      (field.type === 'object' && hasSlotField(field.objectFields))
  );

export const isGrouped = (block: GroupableBlock | null | undefined) =>
  !!block?.props.grouped;

export const toggleGroup = <Block extends GroupableBlock>(
  block: Block
): Block => ({
  ...block,
  props: { ...block.props, grouped: !block.props.grouped },
});

export const canGroup = (
  config: Pick<Config, 'components'>,
  block: TypedBlock | null | undefined
) => !!block && hasSlotField(config.components[block.type]?.fields);

export const groupSelectionTarget = (data: GroupData, id: string) =>
  pathTo(data, id).find(isGrouped)?.props.id ?? id;

export const isInGroup = (data: GroupData | undefined, id: string) =>
  !!data && pathTo(data, id).slice(0, -1).some(isGrouped);

export const groupPermissions = (
  block: GroupableBlock,
  data: GroupData | undefined,
  permissions: Partial<Permissions>
): Partial<Permissions> =>
  isInGroup(data, block.props.id) ?
    {
      ...permissions,
      drag: false,
      delete: false,
      duplicate: false,
    }
  : permissions;

export const groupedKey = (data: GroupData) =>
  allBlocks(topLevelBlocks(data))
    .filter(isGrouped)
    .map(block => block.props.id)
    .join(',');

type GroupClickPuck = Pick<
  PuckApi,
  'appState' | 'dispatch' | 'getSelectorForId'
>;

export const redirectGroupClick = (
  event: Event,
  getPuck: () => GroupClickPuck
) => {
  const target = event.target as Partial<Element> | null;
  const clicked =
    typeof target?.closest === 'function' ?
      target
        .closest('[data-puck-component]')
        ?.getAttribute('data-puck-component')
    : undefined;

  if (!clicked) {
    return;
  }

  const { appState, dispatch, getSelectorForId } = getPuck();
  const group = groupSelectionTarget(appState.data, clicked);

  if (group === clicked) {
    return;
  }

  const itemSelector = getSelectorForId(group);

  if (!itemSelector) {
    return;
  }

  event.stopPropagation();
  dispatch({ type: 'setUi', ui: { itemSelector } });
};
