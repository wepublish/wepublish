import { ComponentConfig } from '@puckeditor/core';

import { UserConfig, UserFields } from '../../types';
import { ContainerProps, ContainerRender } from './container.component';

export const ContainerConfig: ComponentConfig<{
  props: ContainerProps;
  fields: UserFields;
}> = {
  ai: {
    instructions:
      'A layout wrapper that horizontally centres its nested content and constrains it to a maximum width. Place other components inside its content slot. Use maxWidth (Auto, sm, md, lg or xl) to control how wide the content may grow. Containers cannot be nested inside one another.',
  },
  fields: {
    content: {
      type: 'slot',
      disallow: ['Container'] as Array<keyof UserConfig['components']>,
    },
    maxWidth: {
      type: 'select',
      options: [
        { label: 'Auto', value: undefined },
        { label: 'sm', value: 'sm' },
        { label: 'md', value: 'md' },
        { label: 'lg', value: 'lg' },
        { label: 'xl', value: 'xl' },
      ],
    },
  },
  defaultProps: {
    content: [],
  },
  render: ContainerRender,
};
