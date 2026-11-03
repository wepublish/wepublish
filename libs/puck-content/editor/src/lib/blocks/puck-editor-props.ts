import { Slot, SlotComponent } from '@puckeditor/core';
import {
  PuckSlotComponent,
  PuckSlots,
  PuckSlotValue,
} from '@wepublish/puck-content/website';
import { isValidElement } from 'react';

import { BlockVisibilityValue } from '../block-visibility/block-visibility.field';
import { DatasourcesValue } from '../datasource/datasource.field';
import { BreakpointStylingValue } from '../styling/styling.field';

export type ToPuckSlots<T> =
  T extends PuckSlotValue ? Slot
  : T extends readonly (infer Item)[] ? ToPuckSlots<Item>[]
  : T extends object ? { [Key in keyof T]: ToPuckSlots<T[Key]> }
  : T;

export type SplitPuckRenderOptions = {
  minEmptyHeight?: number;
};

export type SplitPuckRenderProps<Props> = {
  id: string;
  props: Props;
  slots: PuckSlots;
  className?: string;
  styling?: BreakpointStylingValue;
  visibility?: BlockVisibilityValue;
  datasources?: DatasourcesValue;
};

type PuckRenderProps = {
  id: string;
  className?: string;
  styling?: BreakpointStylingValue;
  visibility?: BlockVisibilityValue;
  datasources?: DatasourcesValue;
  [key: string]: unknown;
};

const wrappedSlots = new WeakMap<
  SlotComponent,
  Map<number | undefined, PuckSlotComponent>
>();

const toPuckSlot = (
  slot: SlotComponent,
  minEmptyHeight: number | undefined
): PuckSlotComponent => {
  const byHeight =
    wrappedSlots.get(slot) ?? new Map<number | undefined, PuckSlotComponent>();
  const known = byHeight.get(minEmptyHeight);

  if (known) {
    return known;
  }

  const wrapped: PuckSlotComponent = props =>
    slot({ minEmptyHeight, ...props });

  byHeight.set(minEmptyHeight, wrapped);
  wrappedSlots.set(slot, byHeight);

  return wrapped;
};

const isNestedProps = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !isValidElement(value);

const propPath = (parent: string, key: string) =>
  parent ? `${parent}.${key}` : key;

const withoutSlots = (
  value: unknown,
  path: string,
  slots: Map<string, SlotComponent>
): unknown => {
  if (typeof value === 'function') {
    slots.set(path, value as SlotComponent);

    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      withoutSlots(item, `${path}[${index}]`, slots)
    );
  }

  if (isNestedProps(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        withoutSlots(entry, propPath(path, key), slots),
      ])
    );
  }

  return value;
};

export const splitPuckRenderProps = <Props>(
  {
    id,
    puck,
    editMode,
    locked,
    grouped,
    className,
    styling,
    visibility,
    datasources,
    ...rest
  }: PuckRenderProps,
  { minEmptyHeight }: SplitPuckRenderOptions
): SplitPuckRenderProps<Props> => {
  const puckSlots = new Map<string, SlotComponent>();
  const props = withoutSlots(rest, '', puckSlots) as Props;

  return {
    id,
    props,
    slots: Object.fromEntries(
      Array.from(puckSlots, ([path, slot]) => [
        path,
        toPuckSlot(slot, minEmptyHeight),
      ])
    ),
    ...(className !== undefined && { className }),
    ...(styling !== undefined && { styling }),
    ...(visibility !== undefined && { visibility }),
    ...(datasources !== undefined && { datasources }),
  };
};
