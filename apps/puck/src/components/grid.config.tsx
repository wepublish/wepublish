import { ComponentConfig, Slot } from '@puckeditor/core';

export type GridProps = {
  numColumns: number;
  gap: number;
  items: Slot;
};

export const GridConfig: ComponentConfig<GridProps> = {
  fields: {
    numColumns: {
      type: 'number',
      label: 'Number of columns',
      min: 1,
      max: 12,
    },
    gap: {
      label: 'Gap',
      type: 'number',
      min: 0,
    },
    items: {
      type: 'slot',
    },
  },
  defaultProps: {
    numColumns: 4,
    gap: 24,
    items: [],
  },
  render: ({ gap, numColumns, items: Items }) => {
    return (
      <Items
        style={{
          display: 'grid',
          gap,
          gridTemplateColumns: `repeat(${numColumns}, 1fr)`,
        }}
      />
    );
  },
};
