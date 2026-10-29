import { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { PuckComponent, Slot } from '@puckeditor/core';

import {
  breakpointsStyles,
  BreakpointsValue,
} from '@wepublish/puck-content/editor';
import { GapLayout, gapStyles } from '../gap';
import { ItemsAlignment, itemsAlignmentStyles } from '../items-alignment';

export type RowLayout = GapLayout & ItemsAlignment;

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
    {...props}
    css={(theme: Theme) =>
      breakpointsStyles(theme, layout, resolved => ({
        ...gapStyles(theme, resolved),
        ...itemsAlignmentStyles(resolved),
      }))
    }
  />
);
