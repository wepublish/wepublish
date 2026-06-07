import styled from '@emotion/styled';
import { ComponentConfig, Slot } from '@puckeditor/core';

import { UserFields } from '../../types';

export type FlexProps = {
  content: Slot;
  rows: number;
};

const GridContent = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(12, 1fr);

  & > * {
    grid-row: span 6;
  }
`;

export const Flex: ComponentConfig<{
  props: FlexProps;
  fields: UserFields;
}> = {
  fields: {
    content: {
      type: 'slot',
    },
    rows: {
      label: 'Rows',
      type: 'number',
    },
  },
  defaultProps: {
    content: [],
    rows: 1,
  },
  render: ({ content: Content, puck, rows }) => (
    <Content
      as={GridContent}
      style={{
        gridTemplateRows: `repeat(${rows || 1}, auto)`,
      }}
      minEmptyHeight={300}
    />
  ),
};
