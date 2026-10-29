import { Breakpoint } from '@mui/material';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { Weekday } from '@wepublish/editor/api';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';
import {
  defaultBreakpoints,
  visibilitySchema,
  VisibilityValue,
} from '../visibility/visibility.field';

const timeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
  .describe('Time of day as HH:MM');

export const blockTimingSchema = z
  .object({
    from: z.iso
      .datetime()
      .nullish()
      .describe('The block is hidden before this moment'),
    to: z.iso
      .datetime()
      .nullish()
      .describe('The block is hidden from this moment on'),
    weekdays: z
      .array(z.enum(Weekday))
      .nullish()
      .describe(
        'The block is only shown on these weekdays. Empty means every day'
      ),
    timeOfDay: z
      .object({ from: timeOfDaySchema, to: timeOfDaySchema })
      .nullish()
      .describe('The block is only shown during this daily window'),
  })
  .describe('When the block is shown');

export const blockVisibilitySchema = z
  .object({
    disabled: z
      .boolean()
      .describe('Hides the block everywhere while keeping it in the page'),
    timings: blockTimingSchema.nullish(),
    breakpoints: visibilitySchema(defaultBreakpoints).describe(
      'The theme breakpoints the block is shown on. Omit it to show the block on every screen size'
    ),
  })
  .partial();

export type BlockTiming = z.infer<typeof blockTimingSchema>;
export type BlockVisibilityValue = z.infer<typeof blockVisibilitySchema>;

export type BlockVisibilityField = BaseField & {
  type: 'blockVisibility';
};

export const blockVisibilityFieldAi: FieldAiParams = {
  instructions:
    'Whether and when the block is shown: disabled hides it, timing limits it to a date range, weekdays and a daily time window, breakpoints limits it to screen sizes. Omit everything to always show the block.',
  schema: toAiSchema(blockVisibilitySchema),
};

export const isTimed = (timing: BlockTiming | null | undefined) =>
  !!(
    timing?.from ||
    timing?.to ||
    timing?.weekdays?.length ||
    timing?.timeOfDay
  );

export const blockVisibilityFlags = (
  value: BlockVisibilityValue | undefined
): {
  disabled: boolean;
  timed: boolean;
  breakpoints: VisibilityValue | undefined;
} => ({
  disabled: !!value?.disabled,
  timed: isTimed(value?.timings),
  breakpoints: value?.breakpoints,
});

type BlockEntry = { id: string; value: BlockVisibilityValue };

const isRestricted = (value: BlockVisibilityValue) => {
  const { disabled, timed, breakpoints } = blockVisibilityFlags(value);

  return disabled || timed || !!breakpoints;
};

export const collectBlockVisibility = (node: unknown): BlockEntry[] => {
  if (Array.isArray(node)) {
    return node.flatMap(collectBlockVisibility);
  }

  if (!node || typeof node !== 'object') {
    return [];
  }

  const { type, props } = node as {
    type?: unknown;
    props?: Record<string, unknown>;
  };

  if (typeof type === 'string' && props && typeof props.id === 'string') {
    const value = props.visibility as BlockVisibilityValue | undefined;
    const own =
      value && typeof value === 'object' && isRestricted(value) ?
        [{ id: props.id, value }]
      : [];

    return [...own, ...collectBlockVisibility(Object.values(props))];
  }

  return collectBlockVisibility(Object.values(node));
};

const cssString = (text: string) => JSON.stringify(text);

export const outlineVisibilityCss = (
  entries: BlockEntry[],
  labels: { disabled: string; timed: string },
  breakpointOrder: Breakpoint[] = defaultBreakpoints
) =>
  entries
    .map(({ id, value }) => {
      const { disabled, timed, breakpoints } = blockVisibilityFlags(value);
      const badges = [
        disabled && labels.disabled,
        timed && labels.timed,
        breakpoints &&
          breakpointOrder
            .filter(breakpoint => breakpoints.includes(breakpoint))
            .map(breakpoint => breakpoint.toUpperCase())
            .join(' '),
      ].filter(Boolean) as string[];
      const name = `[data-puck-layer-tree-id=${cssString(id)}] > [class*="_Layer-inner"] [class*="_Layer-name"]`;

      return [
        disabled && `${name} { opacity: 0.5; text-decoration: line-through; }`,
        badges.length &&
          `${name}::after { content: ${cssString(badges.join(' · '))}; margin-left: 8px; font-size: var(--puck-font-size-xxxs); color: var(--puck-color-text-secondary); text-decoration: none; display: inline-block; }`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
