import { Config, Field, Fields } from '@puckeditor/core';

type InsertableBlock = {
  type: string;
  props: { id: string } & Record<string, unknown>;
};

export type SlotZone = {
  zone: string;
  label: string;
  count: number;
  index?: number;
  allow?: string[];
  disallow?: string[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const fieldSlotZones = (
  id: string,
  field: Field,
  value: unknown,
  path: string,
  label: string
): SlotZone[] => {
  if (field.type === 'slot') {
    return [
      {
        zone: `${id}:${path}`,
        label,
        count: Array.isArray(value) ? value.length : 0,
        ...(field.allow ? { allow: field.allow } : {}),
        ...(field.disallow ? { disallow: field.disallow } : {}),
      },
    ];
  }

  if (field.type === 'array' && Array.isArray(value)) {
    return value.flatMap((item, index) =>
      fieldsSlotZones(
        id,
        field.arrayFields,
        item ?? {},
        `${path}[${index}].`,
        String(
          field.getItemSummary?.(item, index) ??
            `${field.label ?? path} ${index + 1}`
        )
      )
    );
  }

  if (field.type === 'object') {
    return fieldsSlotZones(
      id,
      field.objectFields,
      isRecord(value) ? value : {},
      `${path}.`,
      field.label ?? path
    );
  }

  return [];
};

const fieldsSlotZones = (
  id: string,
  fields: Fields,
  values: Record<string, unknown>,
  prefix: string,
  parentLabel?: string
): SlotZone[] =>
  Object.entries(fields).flatMap(([key, field]) =>
    fieldSlotZones(
      id,
      field,
      values[key],
      `${prefix}${key}`,
      parentLabel ?? field.label ?? key
    )
  );

export const slotZones = (config: Config, block: InsertableBlock) =>
  fieldsSlotZones(
    block.props.id,
    config.components[block.type]?.fields ?? {},
    block.props,
    ''
  );

const isInsertable = (
  type: string,
  { allow, disallow }: Pick<SlotZone, 'allow' | 'disallow'>
) => (!allow || allow.includes(type)) && !disallow?.includes(type);

export const acceptingZones = (zones: SlotZone[], type: string) =>
  zones.filter(zone => isInsertable(type, zone));

export const insertZones = (
  config: Config,
  block: InsertableBlock | null | undefined,
  root: Pick<SlotZone, 'label' | 'count'>
): SlotZone[] =>
  block ?
    slotZones(config, block)
  : [{ zone: 'root:default-zone', label: root.label, count: root.count }];

const ROOT_ZONE = 'root:default-zone';

export type InsertMode = 'end' | 'into' | 'below';

export const insertMode = (
  config: Config,
  selected: InsertableBlock | null | undefined
): InsertMode => {
  if (!selected) {
    return 'end';
  }

  return slotZones(config, selected).length ? 'into' : 'below';
};

export type InsertContext = {
  selected: InsertableBlock | null | undefined;
  selector?: { index: number; zone?: string } | null;
  parent?: InsertableBlock | null;
  root: Pick<SlotZone, 'label' | 'count'>;
};

const surroundingZone = (
  config: Config,
  { selector, parent, root }: InsertContext
): SlotZone | undefined => {
  if (!selector?.zone || selector.zone === ROOT_ZONE) {
    return { zone: ROOT_ZONE, label: root.label, count: root.count };
  }

  return parent ?
      slotZones(config, parent).find(({ zone }) => zone === selector.zone)
    : undefined;
};

export const insertTargets = (
  config: Config,
  type: string,
  context: InsertContext
): SlotZone[] => {
  if (!context.selected) {
    return [{ zone: ROOT_ZONE, ...context.root }];
  }

  const into = acceptingZones(slotZones(config, context.selected), type);

  if (into.length) {
    return into;
  }

  const below = belowTarget(config, context);

  return below && isInsertable(type, below) ? [below] : [];
};

export const belowTarget = (
  config: Config,
  context: InsertContext
): SlotZone | undefined => {
  const below = surroundingZone(config, context);

  return below ?
      { ...below, index: (context.selector?.index ?? below.count - 1) + 1 }
    : undefined;
};

export const isInsertableInto = isInsertable;

export const stopPointerDown = (element: HTMLElement | null) =>
  element?.addEventListener('pointerdown', event => event.stopPropagation());
