import { ComponentConfig, Slot } from '@puckeditor/core';

import { columnsPresets, ColumnsValue } from '../../plugins/columns';
import { UserFields } from '../../types';

export type GridProps = {
  className?: string;
  columns: ColumnsValue;
  content: Slot;
};

export const Grid: ComponentConfig<{
  props: GridProps;
  fields: UserFields;
}> = {
  fields: {
    columns: {
      type: 'columns',
      label: 'Layout',
    },
    content: {
      type: 'slot',
    },
  },
  defaultProps: {
    columns: columnsPresets[1],
    content: [],
  },
  render: ({ columns, content: Content, ...props }) => (
    <div
      {...props}
      css={{
        display: 'grid',
        gridTemplateColumns: columns.map(column => `${column}fr`).join(' '),
        gap: 16,
      }}
    >
      <Content
        minEmptyHeight={300}
        collisionAxis="dynamic"
      />
    </div>
  ),
};
