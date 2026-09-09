import { CSSObject, Theme } from '@emotion/react';
import { Breakpoint } from '@mui/material';
import { BaseField, Field } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

import { UserFields } from '../fields';

export type BreakpointsValue<Props extends object = Record<string, unknown>> =
  Partial<Record<Breakpoint, Partial<Props>>>;

// Defaults to any like puck's own Field type so concrete instances stay
// assignable to the generic UserFields union.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BreakpointsField<Props extends object = Record<string, any>> =
  BaseField & {
    type: 'breakpoints';
    objectFields: {
      [SubPropName in keyof Props]:
        | Field<Props[SubPropName], UserFields[keyof UserFields]>
        | UserFields[keyof UserFields];
    };
  };

export const breakpointsSchema = (
  fields: Record<string, z.ZodType>,
  breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl']
) => {
  const breakpointSchema = z.object(fields).partial();

  return z
    .object(
      Object.fromEntries(
        breakpoints.map(breakpoint => [breakpoint, breakpointSchema])
      )
    )
    .partial();
};

export const breakpointsFieldAi = (
  fields: Record<string, z.ZodType>,
  breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl']
): FieldAiParams => ({
  instructions: `Responsive settings keyed by theme breakpoint (${breakpoints.join(', ')}, from smallest to largest). Each breakpoint applies from its minimum width upwards until a larger breakpoint overrides it. Always provide the smallest breakpoint (${breakpoints[0]}) as the base and only add larger breakpoints when the layout should differ there.`,
  schema: toAiSchema(breakpointsSchema(fields, breakpoints)),
});

/**
 * Sorts breakpoint keys by their theme size, smallest first.
 */
export const sortBreakpoints = (
  theme: Theme,
  breakpoints: Breakpoint[]
): Breakpoint[] => {
  return [...breakpoints].sort(
    (a, b) => theme.breakpoints.values[a] - theme.breakpoints.values[b]
  );
};

/**
 * Resolves the value for a given breakpoint by falling back to the next
 * smaller breakpoint that has a value (mobile first).
 */
export const resolveBreakpointValue = <Props extends object>(
  theme: Theme,
  value: BreakpointsValue<Props> | undefined,
  breakpoint: Breakpoint
): Partial<Props> | undefined => {
  if (!value) {
    return undefined;
  }

  const sorted = sortBreakpoints(theme, Object.keys(value) as Breakpoint[]);
  const target = theme.breakpoints.values[breakpoint];

  return sorted
    .filter(key => theme.breakpoints.values[key] <= target)
    .reduce<
      Partial<Props> | undefined
    >((acc, key) => ({ ...acc, ...value[key] }), undefined);
};

/**
 * Builds emotion styles from a breakpoints value (mobile first): the styles of
 * the smallest breakpoint apply as base and every larger breakpoint is wrapped
 * in a `theme.breakpoints.up` media query.
 */
export const breakpointsStyles = <Props extends object>(
  theme: Theme,
  value: BreakpointsValue<Props> | undefined,
  toStyles: (resolved: Partial<Props> | undefined) => CSSObject
): CSSObject => {
  const breakpoints = sortBreakpoints(
    theme,
    Object.keys(value ?? {}) as Breakpoint[]
  );

  return {
    ...toStyles(resolveBreakpointValue(theme, value, breakpoints[0] ?? 'xs')),
    ...Object.fromEntries(
      breakpoints
        .slice(1)
        .map(breakpoint => [
          theme.breakpoints.up(breakpoint),
          toStyles(resolveBreakpointValue(theme, value, breakpoint)),
        ])
    ),
  };
};

/**
 * Returns the breakpoint that applies at the given width: the largest one
 * whose minimum width is not above it.
 */
export const getActiveBreakpoint = (
  theme: Theme,
  breakpoints: Breakpoint[],
  width: number
): Breakpoint | undefined => {
  return sortBreakpoints(theme, breakpoints)
    .filter(breakpoint => theme.breakpoints.values[breakpoint] <= width)
    .at(-1);
};
