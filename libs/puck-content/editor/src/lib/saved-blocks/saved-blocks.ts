import { ComponentData, Config, Data } from '@puckeditor/core';
import {
  FullPuckBlockFragment,
  PuckBlockInput,
  PuckBlockTemplateFragment,
  PuckRegistryInput,
} from '@wepublish/editor/api';
import {
  LINKED_TEMPLATE_SLOT,
  LINKED_TEMPLATE_TYPE,
} from '@wepublish/puck-content/website';
import type { PuckBlockTemplateContentFragment } from '@wepublish/website/api';

import {
  fromPuckBlocks,
  getAtPath,
  setAtPath,
  toPathKeys,
  toPuckBlockInputs,
} from '../document/puck-blocks';
import {
  dynamicConfigKey,
  dynamicConfigOf,
  PuckDynamicConfig,
  readDynamicConfig,
  toDynamicConfig,
  toPuckRegistryInput,
} from '../document/puck-registry';
import {
  acceptingZones,
  belowTarget,
  InsertContext,
  SlotZone,
  slotZones,
} from '../insert/insert.helpers';
import {
  SavedBlocksInsertMode,
  SavedBlockTemplate,
} from './saved-blocks.context';

export const SAVED_BLOCKS_TYPE = 'SavedBlocks';

const ROOT_ZONE = 'root:default-zone';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isComponent = (value: unknown): value is ComponentData =>
  isRecord(value) &&
  typeof value['type'] === 'string' &&
  isRecord(value['props']) &&
  typeof value['props']['id'] === 'string';

const mapNested = (
  value: unknown,
  map: (block: ComponentData) => ComponentData
): unknown => {
  if (isComponent(value)) {
    return map(value);
  }

  if (Array.isArray(value)) {
    return value.map(item => mapNested(item, map));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapNested(item, map)])
    );
  }

  return value;
};

const nestedBlocks = (value: unknown): ComponentData[] =>
  isComponent(value) ? [value, ...nestedBlocks(value.props)]
  : Array.isArray(value) ? value.flatMap(nestedBlocks)
  : isRecord(value) ? Object.values(value).flatMap(nestedBlocks)
  : [];

const randomId = (type: string) => `${type}-${crypto.randomUUID()}`;

export const withFreshIds = (
  blocks: readonly ComponentData[],
  newId: (type: string) => string = randomId
): ComponentData[] => {
  const fresh = (block: ComponentData): ComponentData => {
    const id = newId(block.type);

    return {
      ...block,
      props: {
        ...(mapNested(block.props, fresh) as Record<string, unknown>),
        id,
      },
    };
  };

  return blocks.map(fresh);
};

const parseZone = (zone: string) => {
  const separator = zone.indexOf(':');

  return {
    parentId: zone.slice(0, separator),
    path: zone.slice(separator + 1),
  };
};

const updateZone = (
  data: Data,
  zone: string,
  update: (blocks: ComponentData[]) => ComponentData[]
): Data => {
  if (zone === ROOT_ZONE) {
    return { ...data, content: update([...data.content]) };
  }

  const { parentId, path } = parseZone(zone);
  const keys = toPathKeys(path);

  const updateBlock = (block: ComponentData): ComponentData => {
    const props = mapNested(block.props, updateBlock) as ComponentData['props'];

    if (block.props.id !== parentId) {
      return { ...block, props };
    }

    const current = getAtPath(props, keys);
    const blocks = Array.isArray(current) ? [...current] : [];

    return {
      ...block,
      props: setAtPath(props, keys, update(blocks)) as ComponentData['props'],
    };
  };

  return { ...data, content: data.content.map(updateBlock) };
};

export const insertBlocks = (
  data: Data,
  zone: string,
  index: number,
  blocks: readonly ComponentData[]
): Data =>
  updateZone(data, zone, current => [
    ...current.slice(0, index),
    ...blocks,
    ...current.slice(index),
  ]);

export const removeBlockAt = (data: Data, zone: string, index: number): Data =>
  updateZone(data, zone, current =>
    current.filter((_, position) => position !== index)
  );

export type BlockPosition = { zone: string; index: number };

const findInProps = (
  value: unknown,
  parentId: string,
  path: string
): BlockPosition | null => {
  if (Array.isArray(value)) {
    const index = value.findIndex(
      item => isComponent(item) && item.type === SAVED_BLOCKS_TYPE
    );

    if (index >= 0 && value.every(isComponent)) {
      return { zone: `${parentId}:${path}`, index };
    }

    for (const [position, item] of value.entries()) {
      const found =
        isComponent(item) ?
          findInProps(item.props, item.props.id, '')
        : findInProps(item, parentId, `${path}[${position}]`);

      if (found) {
        return found;
      }
    }

    return null;
  }

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const found = findInProps(item, parentId, path ? `${path}.${key}` : key);

      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const findSavedBlocksPlaceholder = (
  data: Data
): BlockPosition | null => {
  const index = data.content.findIndex(
    block => block.type === SAVED_BLOCKS_TYPE
  );

  if (index >= 0) {
    return { zone: ROOT_ZONE, index };
  }

  for (const block of data.content) {
    const found = findInProps(block.props, block.props.id, '');

    if (found) {
      return found;
    }
  }

  return null;
};

export const registryFor = (
  blocks: readonly ComponentData[],
  dynamicConfig: PuckDynamicConfig | undefined
): PuckDynamicConfig | undefined => {
  if (!dynamicConfig) {
    return undefined;
  }

  const used = Object.fromEntries(
    nestedBlocks(blocks).flatMap(({ type }) =>
      Object.hasOwn(dynamicConfig.components, type) ?
        [[type, dynamicConfig.components[type]]]
      : []
    )
  );

  if (!Object.keys(used).length) {
    return undefined;
  }

  return {
    components: used,
    ...(dynamicConfig.styles !== undefined && {
      styles: dynamicConfig.styles,
    }),
    ...(dynamicConfig.script !== undefined && {
      script: dynamicConfig.script,
    }),
  };
};

const mergeCode = (target?: string, source?: string) => {
  if (!source || target?.includes(source)) {
    return target;
  }

  return target ? `${target}\n${source}` : source;
};

export const mergeDynamicConfig = (
  target: PuckDynamicConfig | undefined,
  source: PuckDynamicConfig
): PuckDynamicConfig => {
  const styles = mergeCode(target?.styles, source.styles);
  const script = mergeCode(target?.script, source.script);

  return {
    components: { ...source.components, ...target?.components },
    ...(styles !== undefined && { styles }),
    ...(script !== undefined && { script }),
  };
};

export const clashingComponents = (
  target: PuckDynamicConfig | undefined,
  source: PuckDynamicConfig
): string[] =>
  Object.keys(source.components).filter(
    name =>
      !!target?.components[name] &&
      JSON.stringify(target.components[name]) !==
        JSON.stringify(source.components[name])
  );

export const zoneAccepts = (zone: SlotZone, types: readonly string[]) =>
  types.every(type => acceptingZones([zone], type).length > 0);

export const savedBlocksTargets = (
  config: Config,
  types: readonly string[],
  context: InsertContext
): SlotZone[] => {
  if (!context.selected) {
    return [{ zone: ROOT_ZONE, ...context.root }];
  }

  const into = slotZones(config, context.selected).filter(zone =>
    zoneAccepts(zone, types)
  );

  if (into.length) {
    return into;
  }

  const below = belowTarget(config, context);

  return below && zoneAccepts(below, types) ? [below] : [];
};

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export const matchesSavedBlocks = (name: string, query: string) =>
  normalize(name).includes(normalize(query.trim()));

export const withSavedBlocksPlaceholder = <C extends Config>(config: C): C => ({
  ...config,
  components: {
    ...config.components,
    [SAVED_BLOCKS_TYPE]: {
      label: SAVED_BLOCKS_TYPE,
      hidden: true,
      metadata: { ai: { exclude: true } },
      render: () => null,
    },
  },
});

export const withMergedRegistry = (
  data: Data,
  dynamicConfig: PuckDynamicConfig | undefined
): Data => {
  if (!dynamicConfig) {
    return data;
  }

  const props: Record<string, unknown> = data.root.props ?? {};

  return {
    ...data,
    root: {
      ...data.root,
      props: {
        ...props,
        [dynamicConfigKey]: mergeDynamicConfig(
          readDynamicConfig(dynamicConfigOf(props)),
          dynamicConfig
        ),
      } as Data['root']['props'],
    },
  };
};

export const savedBlocksModes = (
  {
    id,
    linkedTemplateIds,
  }: Pick<SavedBlockTemplate, 'id' | 'linkedTemplateIds'>,
  editedId: string | null
): Record<SavedBlocksInsertMode, boolean> => {
  const linksEdited = !!editedId && linkedTemplateIds.includes(editedId);

  return { linked: !linksEdited && id !== editedId, copy: !linksEdited };
};

export const toSavedBlockTemplate = ({
  id,
  name,
  puckBlocks,
  puckRegistry,
  linkedTemplateIds,
}: PuckBlockTemplateFragment): SavedBlockTemplate | null => {
  const loaded = fromPuckBlocks(puckBlocks ?? []);

  if (!loaded.content) {
    return null;
  }

  const dynamicConfig = toDynamicConfig(puckRegistry);

  return {
    id,
    name,
    content: loaded.content,
    types: [...new Set(loaded.content.map(({ type }) => type))],
    linkedTemplateIds: linkedTemplateIds ?? [],
    ...(dynamicConfig && { dynamicConfig }),
  };
};

export const toSavedBlocksInput = (
  block: ComponentData,
  config: Config,
  dynamicConfig: PuckDynamicConfig | undefined
): { puckBlocks: PuckBlockInput[]; puckRegistry: PuckRegistryInput | null } => {
  const registry = registryFor([block], dynamicConfig);

  return {
    puckBlocks: toPuckBlockInputs([block], {
      config,
      dynamicConfig: registry,
    }),
    puckRegistry: toPuckRegistryInput(registry),
  };
};

export const linkedTemplateBlock = (
  templateId: string,
  newId: (type: string) => string = randomId
): ComponentData => ({
  type: LINKED_TEMPLATE_TYPE,
  props: { id: newId(LINKED_TEMPLATE_TYPE), templateId },
});

const linkedDescendants = (
  blocks: readonly {
    id: string;
    parentId: string | null;
    puckSlot: string | null;
  }[]
) => {
  const dropped = new Set(
    blocks
      .filter(({ puckSlot }) => puckSlot === LINKED_TEMPLATE_SLOT)
      .map(({ id }) => id)
  );
  let grown = true;

  while (grown) {
    grown = false;

    for (const { id, parentId } of blocks) {
      if (parentId && dropped.has(parentId) && !dropped.has(id)) {
        dropped.add(id);
        grown = true;
      }
    }
  }

  return dropped;
};

export const unlinkedContent = (
  template: PuckBlockTemplateContentFragment,
  newId?: (type: string) => string
): ComponentData[] => {
  const dropped = linkedDescendants(template.puckBlocks);
  const loaded = fromPuckBlocks(
    template.puckBlocks.filter(
      ({ id }) => !dropped.has(id)
    ) as unknown as FullPuckBlockFragment[]
  );

  return withFreshIds(loaded.content ?? [], newId);
};
