import { Theme } from '@emotion/react';
import { PuckComponent, Slot } from '@puckeditor/core';

import {
  breakpointsStyles,
  BreakpointsValue,
  columnsPresets,
  ColumnsValue,
} from '@wepublish/puck-content/editor';
import { gapStyles, GapValue } from './gap';
import { ItemsAlignment, itemsAlignmentStyles } from './items-alignment';

export type GridLayout = GapValue &
  ItemsAlignment & {
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
    css={(theme: Theme) => ({
      display: 'grid',
      ...breakpointsStyles(theme, layout, resolved => ({
        gridTemplateColumns: toGridTemplateColumns(
          resolved?.columns ?? columnsPresets[0]
        ),
        ...gapStyles(resolved),
        ...itemsAlignmentStyles(resolved),
      })),
    })}
  />
);
