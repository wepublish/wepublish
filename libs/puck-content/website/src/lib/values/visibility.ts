import { Breakpoint } from '@mui/material';

export type VisibilityValue = Breakpoint[];

export const defaultBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export const isHiddenOn = (
  value: readonly string[] | null | undefined,
  breakpoint: Breakpoint
) => !!value && !value.includes(breakpoint);

export const hiddenBreakpoints = (
  value: readonly string[] | null | undefined,
  breakpoints: Breakpoint[]
) => breakpoints.filter(breakpoint => isHiddenOn(value, breakpoint));
