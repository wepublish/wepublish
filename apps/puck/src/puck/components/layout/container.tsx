import { Container } from '@mui/material';
import { ComponentConfig, Slot } from '@puckeditor/core';
import { ComponentProps } from 'react';

import { UserConfig, UserFields } from '../../types';

export type ContainerProps = Pick<
  ComponentProps<typeof Container>,
  'className' | 'maxWidth'
> & {
  content: Slot;
};

export const ContainerConfig: ComponentConfig<{
  props: ContainerProps;
  fields: UserFields;
}> = {
  inline: true,
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
  render: ({ content: Content, ...props }) => (
    <Container {...props}>
      <Content
        minEmptyHeight={300}
        collisionAxis="y"
      />
    </Container>
  ),
};
