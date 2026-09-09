import { Container } from '@mui/material';
import { PuckComponent, Slot } from '@puckeditor/core';
import { ComponentProps } from 'react';

export type ContainerProps = Pick<
  ComponentProps<typeof Container>,
  'className' | 'maxWidth'
> & {
  content: Slot;
};

export const ContainerRender: PuckComponent<ContainerProps> = ({
  content: Content,
  ...props
}) => (
  <Container {...props}>
    <Content
      minEmptyHeight={300}
      collisionAxis="y"
    />
  </Container>
);
