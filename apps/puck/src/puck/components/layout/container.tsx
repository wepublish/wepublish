import { Container } from '@mui/material';
import { ComponentConfig, Slot } from '@puckeditor/core';

import { UserFields } from '../../types';

export type ContainerProps = {
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
    },
  },
  defaultProps: {
    content: [],
  },
  render: ({ content: Content }) => (
    <Container
      component={Content}
      minEmptyHeight={300}
    />
  ),
};
