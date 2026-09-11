import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { PuckComponent, Slot } from '@puckeditor/core';

import {
  breakpointsStyles,
  BreakpointsValue,
} from '@wepublish/puck-content/editor';
import { gapStyles, GapValue } from './gap';
import { ItemsAlignment, itemsAlignmentStyles } from './items-alignment';

export type RowLayout = Pick<GapValue, 'columnGap'> & ItemsAlignment;

export type RowProps = {
  className?: string;
  content: Slot;
  layout?: BreakpointsValue<RowLayout>;
};

const RowContent = styled.div`
  display: grid;
  grid-auto-flow: column;
`;

export const RowRender: PuckComponent<RowProps> = ({
  content: Content,
  layout,
  ...props
}) => (
  <Content
    as={RowContent}
    minEmptyHeight={100}
    collisionAxis="dynamic"
    {...props}
    css={(theme: Theme) =>
      breakpointsStyles(theme, layout, resolved => ({
        ...gapStyles(resolved),
        ...itemsAlignmentStyles(resolved),
      }))
    }
  />
);
