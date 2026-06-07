import { ComponentConfig, Slot } from '@puckeditor/core';

import { columnsPresets, ColumnsValue } from '../../plugins/columns';
import { UserFields } from '../../types';

export type GridProps = {
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
  render: ({ columns, content: Content }) => (
    <Content
      style={{
        display: 'grid',
        gridTemplateColumns: columns.map(column => `${column}fr`).join(' '),
        gap: 16,
      }}
      minEmptyHeight={300}
    />
  ),
};
