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
import { GridPlacementValue } from '../../../values/grid-placement';
import { VisibilityValue } from '../../../values/visibility';
import { GapLayout, gapStyles } from '../gap';
import { gridPlacementStyles } from '../grid-placement';
import { itemContentSlot } from '../item-slot';
import { ItemsAlignment, itemsAlignmentStyles } from '../items-alignment';

export type DynamicGridItem = {
  placement?: BreakpointsValue<GridPlacementValue>;
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
        items.map(({ placement, visibility }, index) => (
          <Fragment key={index}>
            {getSlot(
              slots,
              itemContentSlot(index)
            )({
              className: css({
                ...gridPlacementStyles(theme, placement),
                ...visibilityCss(theme, { breakpoints: visibility }),
              }),
            })}
          </Fragment>
        ))
      }
    </ClassNames>
  </GridContent>
);
