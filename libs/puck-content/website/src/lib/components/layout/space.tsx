import { ComponentConfig } from '@puckeditor/core';

import { UserFields } from '../../types';

export type SpaceProps = { size: number };

export const Space: ComponentConfig<{
  props: SpaceProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Adds empty vertical spacing between other components. Set size to Small, Medium, Large or XL to control the gap height. Use it to separate blocks; it renders no visible content of its own.',
  },
  inline: true,
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
  render: ({ size, ...props }) => (
    <div
      style={{ height: size }}
      ref={props.puck.dragRef}
    />
  ),
};
