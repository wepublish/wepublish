import styled from '@emotion/styled';
import { PuckComponent, Slot } from '@puckeditor/core';

export type RowProps = {
  className?: string;
  content: Slot;
  alignItems: 'start' | 'center' | 'end';
};

const RowContent = styled.div`
  display: grid;
  grid-auto-flow: column;
`;

export const RowRender: PuckComponent<RowProps> = ({
  content: Content,
  alignItems,
  ...props
}) => (
  <Content
    as={RowContent}
    minEmptyHeight={100}
    collisionAxis="dynamic"
    css={{
      alignItems,
    }}
  />
);
