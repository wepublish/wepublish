import { Breakpoint } from '@mui/material';
import { createUsePuck } from '@puckeditor/core';
import { useMemo, useState } from 'react';

import { useWebsiteTheme } from '../website-theme';
import {
  BreakpointsValue,
  getActiveBreakpoint,
  sortBreakpoints,
} from './breakpoints.field';

const usePuck = createUsePuck();

export type BreakpointSelection = {
  allBreakpoints: Breakpoint[];
  baseBreakpoint: Breakpoint;
  activeBreakpoints: Breakpoint[];
  availableBreakpoints: Breakpoint[];
  previewBreakpoint: Breakpoint | undefined;
  selected: Breakpoint;
  setSelected: (breakpoint: Breakpoint) => void;
};

export const useBreakpointSelection = (
  value: BreakpointsValue | undefined
): BreakpointSelection => {
  const theme = useWebsiteTheme();
  const previewWidth = usePuck(
    puck => puck.appState.ui.viewports.current.width
  );

  const allBreakpoints = useMemo(
    () => sortBreakpoints(theme, theme.breakpoints.keys),
    [theme]
  );
  const baseBreakpoint = allBreakpoints[0];
  const activeBreakpoints = useMemo(
    () =>
      sortBreakpoints(theme, [
        ...new Set([
          baseBreakpoint,
          ...(Object.keys(value ?? {}) as Breakpoint[]),
        ]),
      ]),
    [theme, baseBreakpoint, value]
  );
  const availableBreakpoints = allBreakpoints.filter(
    breakpoint => !activeBreakpoints.includes(breakpoint)
  );
  const previewBreakpoint =
    typeof previewWidth === 'number' ?
      getActiveBreakpoint(theme, activeBreakpoints, previewWidth)
    : undefined;

  const [selectedState, setSelected] = useState<Breakpoint | undefined>(
    () => previewBreakpoint ?? activeBreakpoints[0]
  );
  const selected =
    selectedState && activeBreakpoints.includes(selectedState) ?
      selectedState
    : activeBreakpoints[0];

  return {
    allBreakpoints,
    baseBreakpoint,
    activeBreakpoints,
    availableBreakpoints,
    previewBreakpoint,
    selected,
    setSelected,
  };
};
