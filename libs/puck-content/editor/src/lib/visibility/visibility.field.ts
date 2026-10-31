import { Breakpoint } from '@mui/material';
import { BaseField } from '@puckeditor/core';
import { FieldAiParams } from '@puckeditor/plugin-ai';
import { z } from 'zod/v4';

import { toAiSchema } from '../ai-schema';

export type VisibilityValue = Breakpoint[];

export type VisibilityField = BaseField & {
  type: 'visibility';
};

export const defaultBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export const visibilitySchema = (
  breakpoints: Breakpoint[] = defaultBreakpoints
) => z.array(z.enum(breakpoints as [Breakpoint, ...Breakpoint[]]));

export const visibilityFieldAi = (
  breakpoints: Breakpoint[] = defaultBreakpoints
): FieldAiParams => ({
  instructions: `The theme breakpoints (${breakpoints.join(', ')}, from smallest to largest) the component is visible on. Omit it to show the component everywhere; only set it to hide the component on specific screen sizes.`,
  schema: toAiSchema(visibilitySchema(breakpoints)),
});

export const isHiddenOn = (
  value: VisibilityValue | undefined,
  breakpoint: Breakpoint
) => !!value && !value.includes(breakpoint);

export type ThemeBreakpoints = {
  keys: Breakpoint[];
  values: Record<Breakpoint, number>;
};

export type BreakpointRange = {
  breakpoint: Breakpoint;
  min: number;
  max?: number;
};

export const breakpointRanges = ({
  keys,
  values,
}: ThemeBreakpoints): BreakpointRange[] => {
  const sorted = [...keys].sort((a, b) => values[a] - values[b]);

  return sorted.map((breakpoint, index) => {
    const next = sorted[index + 1];

    return next === undefined ?
        { breakpoint, min: values[breakpoint] }
      : { breakpoint, min: values[breakpoint], max: values[next] - 1 };
  });
};

export const formatBreakpointRange = ({ min, max }: BreakpointRange) =>
  max === undefined ? `${min}px+` : `${min}–${max}px`;

export const toggleBreakpoint = (
  value: VisibilityValue | undefined,
  breakpoint: Breakpoint,
  breakpoints: Breakpoint[]
): VisibilityValue | undefined => {
  const shown = value ?? breakpoints;
  const next =
    shown.includes(breakpoint) ?
      shown.filter(current => current !== breakpoint)
    : [...shown, breakpoint];
  const sorted = breakpoints.filter(current => next.includes(current));

  return sorted.length === breakpoints.length ? undefined : sorted;
};

export const hiddenBreakpoints = (
  value: VisibilityValue | undefined,
  breakpoints: Breakpoint[]
) => breakpoints.filter(breakpoint => isHiddenOn(value, breakpoint));
