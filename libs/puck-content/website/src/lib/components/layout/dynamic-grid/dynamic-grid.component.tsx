import { ClassNames, Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { Fragment } from 'react';

import { PuckBlockComponent, PuckSlotValue } from '../../../blocks/block.types';
import { getSlot } from '../../../blocks/slots';
import { visibilityCss } from '../../../blocks/visibility-css';
import {
  breakpointsStyles,
  BreakpointsValue,
} from '../../../values/breakpoints';
import { VisibilityValue } from '../../../values/visibility';
import { columnSpanStyles, ColumnSpanValue } from '../column-span';
import { GapLayout, gapStyles } from '../gap';
import { itemContentSlot } from '../item-slot';
import { ItemsAlignment, itemsAlignmentStyles } from '../items-alignment';

export type DynamicGridItem = {
  span?: ColumnSpanValue;
  visibility?: VisibilityValue;
  content: PuckSlotValue;
};

export type DynamicGridLayout = GapLayout & ItemsAlignment;

export type DynamicGridProps = {
  layout?: BreakpointsValue<DynamicGridLayout>;
  items: DynamicGridItem[];
};

const GridContent = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
`;

export const DynamicGridRender: PuckBlockComponent<DynamicGridProps> = ({
  props: { layout, items },
  slots,
  className,
}) => (
  <GridContent
    className={className}
    css={(theme: Theme) =>
      breakpointsStyles(theme, layout, resolved => ({
        ...gapStyles(theme, resolved),
        ...itemsAlignmentStyles(resolved),
      }))
    }
  >
    <ClassNames>
      {({ css, theme }) =>
        items.map(({ span, visibility }, index) => (
          <Fragment key={index}>
            {getSlot(
              slots,
              itemContentSlot(index)
            )({
              className: css({
                ...columnSpanStyles(span)(theme),
                ...visibilityCss(theme, { breakpoints: visibility }),
              }),
            })}
          </Fragment>
        ))
      }
    </ClassNames>
  </GridContent>
);
