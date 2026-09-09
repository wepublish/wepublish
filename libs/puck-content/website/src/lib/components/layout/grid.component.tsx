import { Theme } from '@emotion/react';
import { Breakpoint } from '@mui/material';
import { PuckComponent, Slot } from '@puckeditor/core';

import {
  BreakpointsValue,
  columnsPresets,
  ColumnsValue,
  resolveBreakpointValue,
  sortBreakpoints,
} from '@wepublish/puck-content/editor';

export type GridLayout = {
  columns: ColumnsValue;
};

export type GridProps = {
  className?: string;
  layout: BreakpointsValue<GridLayout>;
  content: Slot;
};

const toGridTemplateColumns = (columns: ColumnsValue) =>
  columns.map(column => `${column}fr`).join(' ');

export const GridRender: PuckComponent<GridProps> = ({
  layout,
  content: Content,
  ...props
}) => (
  <Content
    minEmptyHeight={300}
    collisionAxis="dynamic"
    {...props}
    css={(theme: Theme) => {
      const breakpoints = sortBreakpoints(
        theme,
        Object.keys(layout ?? {}) as Breakpoint[]
      );

      return {
        display: 'grid',
        gap: 16,
        gridTemplateColumns: toGridTemplateColumns(
          resolveBreakpointValue(theme, layout, breakpoints[0] ?? 'xs')
            ?.columns ?? columnsPresets[0]
        ),
        ...Object.fromEntries(
          breakpoints.slice(1).map(breakpoint => [
            theme.breakpoints.up(breakpoint),
            {
              gridTemplateColumns: toGridTemplateColumns(
                resolveBreakpointValue(theme, layout, breakpoint)?.columns ??
                  columnsPresets[0]
              ),
            },
          ])
        ),
      };
    }}
  />
);
