import { Container } from '@mui/material';
import { PuckComponent, Slot } from '@puckeditor/core';
import { ComponentProps } from 'react';

import { DatasourcesValue } from '@wepublish/puck-content/editor';

export type ContainerProps = Pick<
  ComponentProps<typeof Container>,
  'className' | 'maxWidth'
> & {
  content: Slot;
  datasources?: DatasourcesValue;
};

export const ContainerRender: PuckComponent<ContainerProps> = ({
  content: Content,
  datasources,
  ...props
}) => (
  <Container {...props}>
    <Content minEmptyHeight={300} />
  </Container>
);
