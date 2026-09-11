import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { PuckComponent, Slot } from '@puckeditor/core';

import {
  breakpointsStyles,
  BreakpointsValue,
  VisibilityValue,
} from '@wepublish/puck-content/editor';
import { columnSpanStyles, ColumnSpanValue } from './column-span';
import { gapStyles, GapValue } from './gap';
import { ItemsAlignment, itemsAlignmentStyles } from './items-alignment';
import { visibilityStyles } from './with-visibility';

export type DynamicGridItem = {
  span?: ColumnSpanValue;
  visibility?: VisibilityValue;
  content: Slot;
};

export type DynamicGridLayout = GapValue & ItemsAlignment;

export type DynamicGridProps = {
  className?: string;
  layout?: BreakpointsValue<DynamicGridLayout>;
  items: DynamicGridItem[];
};

const GridContent = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
`;

export const DynamicGridRender: PuckComponent<DynamicGridProps> = ({
  layout,
  items,
  ...props
}) => (
  <GridContent
    {...props}
    css={(theme: Theme) =>
      breakpointsStyles(theme, layout, resolved => ({
        ...gapStyles(resolved),
        ...itemsAlignmentStyles(resolved),
      }))
    }
  >
    {items.map(({ span, visibility, content: Content }, index) => (
      <Content
        key={index}
        minEmptyHeight={100}
        collisionAxis="dynamic"
        css={theme => ({
          ...columnSpanStyles(span)(theme),
          ...visibilityStyles(visibility)(theme),
        })}
      />
    ))}
  </GridContent>
);
