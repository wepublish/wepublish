import styled from '@emotion/styled';
import { ComponentConfig, Slot } from '@puckeditor/core';

import { UserFields } from '../../types';

export type FlexProps = {
  className?: string;
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
  ai: {
    instructions:
      'A flexible 12-column grid layout that arranges its nested components across one or more rows. Place components inside its content slot; set rows to the number of rows to lay them out in. Child components placed here can additionally set a column span and row span. Use it for multi-column arrangements of mixed content.',
  },
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
  render: ({ content: Content, rows, ...props }) => (
    <div {...props}>
      <Content
        as={GridContent}
        minEmptyHeight={300}
        collisionAxis="x"
        style={{
          gridTemplateRows: `repeat(${rows || 1}, auto)`,
        }}
      />
    </div>
  ),
};
