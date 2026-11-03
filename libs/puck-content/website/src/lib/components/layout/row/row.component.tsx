import { ClassNames, CSSObject, Theme } from '@emotion/react';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import {
  breakpointsStyles,
  BreakpointsValue,
} from '../../../values/breakpoints';
import { GapLayout, gapStyles } from '../gap';
import { ItemsAlignment, itemsAlignmentStyles } from '../items-alignment';

export type RowLayout = GapLayout & ItemsAlignment;

export type RowProps = {
  layout?: BreakpointsValue<RowLayout>;
  content: PuckSlotValue;
};

const rowStyles = (
  theme: Theme,
  layout: BreakpointsValue<RowLayout> | undefined
): CSSObject => ({
  display: 'grid',
  gridAutoFlow: 'column',
  ...breakpointsStyles(theme, layout, resolved => ({
    ...gapStyles(theme, resolved),
    ...itemsAlignmentStyles(resolved),
  })),
});

export const RowRender: PuckBlockComponent<RowProps> = ({
  props: { layout },
  slots,
  className,
}) => (
  <ClassNames>
    {({ css, cx, theme }) =>
      getSlot(
        slots,
        'content'
      )({ className: cx(className, css(rowStyles(theme, layout))) })
    }
  </ClassNames>
);
