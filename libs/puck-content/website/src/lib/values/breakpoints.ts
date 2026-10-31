import { CSSObject, Theme } from '@emotion/react';
import { Breakpoint } from '@mui/material';

export type BreakpointsValue<Props extends object = Record<string, unknown>> =
  Partial<Record<Breakpoint, Partial<Props>>>;

export const sortBreakpoints = (
  theme: Theme,
  breakpoints: Breakpoint[]
): Breakpoint[] => {
  return [...breakpoints].sort(
    (a, b) => theme.breakpoints.values[a] - theme.breakpoints.values[b]
  );
};

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
    .reduce<Partial<Props> | undefined>(
      (acc, key) => ({
        ...acc,
        ...Object.fromEntries(
          Object.entries(value[key] ?? {}).filter(
            ([, subValue]) => subValue !== undefined
          )
        ),
      }),
      undefined
    );
};

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

export const getActiveBreakpoint = (
  theme: Theme,
  breakpoints: Breakpoint[],
  width: number
): Breakpoint | undefined => {
  return sortBreakpoints(theme, breakpoints)
    .filter(breakpoint => theme.breakpoints.values[breakpoint] <= width)
    .at(-1);
};
