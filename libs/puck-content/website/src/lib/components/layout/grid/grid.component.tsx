import { ClassNames, CSSObject, Theme } from '@emotion/react';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import {
  breakpointsStyles,
  BreakpointsValue,
} from '../../../values/breakpoints';
import { columnsPresets, ColumnsValue } from '../../../values/columns';
import { GapLayout, gapStyles } from '../gap';
import { ItemsAlignment, itemsAlignmentStyles } from '../items-alignment';

export type GridLayout = GapLayout &
  ItemsAlignment & {
    columns: ColumnsValue;
  };

export type GridProps = {
  layout: BreakpointsValue<GridLayout>;
  content: PuckSlotValue;
};

const toGridTemplateColumns = (columns: ColumnsValue) =>
  columns.map(column => `${column}fr`).join(' ');

const gridStyles = (
  theme: Theme,
  layout: BreakpointsValue<GridLayout>
): CSSObject => ({
  display: 'grid',
  ...breakpointsStyles(theme, layout, resolved => ({
    gridTemplateColumns: toGridTemplateColumns(
      resolved?.columns ?? columnsPresets[0]
    ),
    ...gapStyles(theme, resolved),
    ...itemsAlignmentStyles(resolved),
  })),
});

export const GridRender: PuckBlockComponent<GridProps> = ({
  props: { layout },
  slots,
  className,
}) => (
  <ClassNames>
    {({ css, cx, theme }) =>
      getSlot(
        slots,
        'content'
      )({ className: cx(className, css(gridStyles(theme, layout))) })
    }
  </ClassNames>
);
