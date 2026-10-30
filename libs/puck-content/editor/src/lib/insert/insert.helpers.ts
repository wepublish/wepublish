import { Config, Field, Fields } from '@puckeditor/core';

type InsertableBlock = {
  type: string;
  props: { id: string } & Record<string, unknown>;
};

export type SlotZone = {
  zone: string;
  label: string;
  count: number;
  allow?: string[];
  disallow?: string[];
};

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
      value ?? {},
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
  rootCount: number
): SlotZone[] =>
  block ?
    slotZones(config, block)
  : [{ zone: 'root:default-zone', label: 'Page', count: rootCount }];

export const stopPointerDown = (element: HTMLElement | null) =>
  element?.addEventListener('pointerdown', event => event.stopPropagation());
