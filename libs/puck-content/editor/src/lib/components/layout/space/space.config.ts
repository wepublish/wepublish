import { ComponentConfig } from '@puckeditor/core';
import { z } from 'zod/v4';
import { SpaceProps, SpaceRender } from '@wepublish/puck-content/website';

import { editorRender } from '../../../blocks/editor-render';
import { breakpointsFieldAi } from '../../../breakpoints/breakpoints.field';
import { UserFields } from '../../../fields';

const sizeOptions = [
  { label: 'None', value: 0 },
  { label: 'Small', value: 8 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 24 },
  { label: 'XL', value: 48 },
];

export const Space: ComponentConfig<{
  props: SpaceProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'Adds empty vertical spacing between other components. Set size per breakpoint to None, Small, Medium, Large or XL to control the gap height. Use it to separate blocks; it renders no visible content of its own.',
  },
  inline: true,
  fields: {
    size: {
      type: 'breakpoints',
      label: 'Size',
      objectFields: {
        size: {
          type: 'select',
          label: 'Size',
          options: sizeOptions,
        },
      },
      ai: breakpointsFieldAi({
        size: z
          .literal(sizeOptions.map(({ value }) => value))
          .describe('Gap height in pixels'),
      }),
    },
  },
  defaultProps: {
    size: { xs: { size: 24 } },
  },
  render: editorRender(SpaceRender, { inline: true }),
};
