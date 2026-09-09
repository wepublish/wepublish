import styled from '@emotion/styled';
import { PuckComponent, Slot } from '@puckeditor/core';

import { VisibilityValue } from '@wepublish/puck-content/editor';
import { columnSpanStyles, ColumnSpanValue } from './column-span';
import { visibilityStyles } from './with-visibility';

export type DynamicGridItem = {
  span?: ColumnSpanValue;
  visibility?: VisibilityValue;
  content: Slot;
};

export type DynamicGridProps = {
  className?: string;
  items: DynamicGridItem[];
};

const GridContent = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(12, 1fr);
`;

export const DynamicGridRender: PuckComponent<DynamicGridProps> = ({
  items,
  ...props
}) => (
  <GridContent {...props}>
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
