import { ComponentConfig } from '@puckeditor/core';

export type SpaceProps = { size: number };

export const Space: ComponentConfig<SpaceProps> = {
  fields: {
    size: {
      type: 'select',
      label: 'Size',
      options: [
        { label: 'Small', value: 8 },
        { label: 'Medium', value: 16 },
        { label: 'Large', value: 24 },
        { label: 'XL', value: 48 },
      ],
    },
  },
  defaultProps: {
    size: 24,
  },
  render: ({ size }) => <div style={{ height: size }} />,
};
