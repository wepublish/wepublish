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
  ai: {
    instructions:
      'A column-based layout that places its nested components side by side in equal or proportionally sized columns. Choose a column preset via the columns (Layout) field and add components to the content slot. Use it to arrange content in a fixed set of columns.',
  },
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
    <Content
      minEmptyHeight={300}
      collisionAxis="dynamic"
      {...props}
      style={{
        display: 'grid',
        gridTemplateColumns: columns.map(column => `${column}fr`).join(' '),
        gap: 16,
      }}
    />
  ),
};
